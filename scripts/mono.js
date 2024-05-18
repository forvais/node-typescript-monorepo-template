// @ts-check
/* eslint-disable no-use-before-define */

const util = require('node:util');
const npath = require('node:path');
const fs = require('node:fs/promises');
const { execSync } = require('node:child_process');

const FOREGROUND_COLOR = {
  RED: wrapText('\x1b[31m', '\x1b[0m'),
  GREEN: wrapText('\x1b[32m', '\x1b[0m'),
  YELLOW: wrapText('\x1b[33m', '\x1b[0m'),
  DEFAULT: wrapText('\x1b[39m', '\x1b[0m'),
  CYAN: wrapText('\x1b[36m', '\x1b[0m'),
};

/**
 * Enum of FS types
 * @readonly
 * @enum {number}
 */
const FS_TYPES = Object.freeze({
  DIRECTORY: 0b01,
  LINK: 0b10,
  FILE: 0b11,
});

(async () => {
  const applications = 'apps';
  const packages = 'packages';

  /**
   * Represents the context object containing information about applications and packages.
   * @typedef {Object} Context
   * @property {Object[]} applications An array containing information about applications.
   * @property {Object[]} packages An array containing information about packages.
   */

  /**
   * The context object containing information about applications and packages.
   * @type {Context}
   */
  const context = {
    applications: [],
    packages: [],
  };

  const state = createDefaultState();

  for (const application of await findAllContentIn(applications, { type: FS_TYPES.DIRECTORY })) {
    const name = npath.parse(application).base;

    context.applications.push({
      name,
      path: application,
    });
  }

  for (const package of await findAllContentIn(packages, { type: FS_TYPES.DIRECTORY })) {
    const name = npath.parse(package).base;

    context.packages.push({
      name,
      path: package,
    });
  }

  const cli = new Cli();

  // mono dev [path] [--docker]
  cli.addCommand('dev')
    .addPositional('path')
    .addOption('docker');

  // mono prod [path] [--docker]
  cli.addCommand('prod')
    .addPositional('path')
    .addOption('docker');

  // mono down [path]
  cli.addCommand('down')
    .addPositional('path');

  // mono build [path] [--docker]
  cli.addCommand('build')
    .addPositional('path')
    .addOption('docker')
    .action(console.log);

  // mono install
  cli.addCommand('install')
    .action(console.log);

  // mono clean
  cli.addCommand('clean');

  cli.parse(process.argv.slice(2).join(' '));

  // console.log(cli.getCommands());
  // console.log(context);

  // console.log(Npm.runScript('start:dev', { workspace: context.applications.find(app => app.name === context.commands.path).path }));
})();

/* =========================================================== */
/*                           Commands                          */
/* =========================================================== */

class Npm {
  static runScript(script, opts) {
    const ifPresent = opts?.ifPresent || true;
    const workspace = opts?.workspace;

    const cmd = [
      'npm run',
      workspace && `-w ${workspace}`,
      script,
      ifPresent && '--if-present',
    ].join(' ');

    return fork(cmd);
  }
}

/**
 * @param {string} cmd - Command to execute.
 */
function fork(cmd, opts = { stdout: true }) {
  console.debug(cmd);

  const stdio = opts.stdout ? 'inherit' : 'pipe';
  return execSync(cmd, { stdio });
}

function install() {
  fork('npm install');
  fork('npm install -ws');
}

function build() {
  fork('npm run build');
}

/**
 * @param {string[]} targets
 */
async function clean(targets) {
  const _targets = ['.', ...targets];

  const distPromises = _targets.map(path => filterDist(path));
  const nodeModulesPromises = _targets.map(path => filterNodeModules(path));

  const dist = (await Promise.all(distPromises)).flat();
  const nodeModules = (await Promise.all(nodeModulesPromises)).flat();

  [...dist, ...nodeModules].forEach(path => {
    fs.rm(path, { recursive: true, force: true });
  });
}

/* =========================================================== */
/*                           Utilities                         */
/* =========================================================== */

class InputParser {
  static parse(input) {
    let state = {
      isErr: false,
      data: input,
      index: 0,
      positionals: [],
      options: {},
    };

    const parsers = [InputParser.parseOptions, InputParser.parsePositional];

    while (state.index < state.data.length) {
      const lastIndex = state.index;

      for (const parser of parsers) {
        state = parser(state);

        if (state.index !== lastIndex) break;
      }

      if (state.index === lastIndex) throw new Error('Infinite loop detected');
    }

    return {
      name: state.positionals[0],
      positionals: state.positionals.slice(1),
      options: state.options,
    };
  }

  static parseOptions(state) {
    if (state.isErr) return state;

    const _state = structuredClone(state);
    const WHITESPACE = ' ';
    const HYPHEN = '-';
    let char = _state.data[_state.index];
    let nHyphen = 0;
    let name = '';
    const value = true;

    while (_state.index < _state.data.length) {
      char = _state.data[_state.index++];

      // Base case
      if (char === WHITESPACE) break;

      // Count the amount of hyphens
      if (char === HYPHEN) {
        nHyphen++;
        continue; // Since this character is a hyphen, we do not care about it
      }

      // If it's anything other than a hyphen without any preceding hyphens, exit immediately
      if (nHyphen < 2 && char !== HYPHEN) {
        _state.index--;
        break;
      }

      // Only when we have two hyphens should we start counting characters
      if (nHyphen === 2) name += char;
    }

    if (!name) return state;

    return {
      ..._state,
      options: {
        ..._state.options,
        [name]: value,
      },
    };
  }

  static parsePositional(state) {
    if (state.isErr) return state;

    const WHITESPACE = ' ';
    let char = state.data[state.index];
    let word = '';

    while (state.index < state.data.length) {
      char = state.data[state.index++];

      if (char === WHITESPACE) break;

      word += char;
    }

    return {
      ...state,
      positionals: [
        ...state.positionals,
        word,
      ],
    };
  }
}

/**
 * Represents a command-line interface (CLI) for managing commands.
 * @class
 */
class Cli {
  /**
   * The path to the script associated with the CLI.
   */
  #script = './mono';

  /**
   * Represents the information about commands available in the CLI.
   * @typedef {Object} Command
   * @property {string} name
   * @property {string[]} positionals
   * @property {Object} options
   */

  /**
   * An array containing information about commands available in the CLI.
   * @type {Command[]}
   */
  #commands = [];

  /**
   * The currently selected command cursor.
   * @type {?Command}
   */
  #cursor = null;

  /**
   * @type {?Object}
   */
  #result = {};

  /**
   * @type {?Object}
   */
  #actions = [];

  /**
   * Selects a command with the specified name.
   * @param {string} name The name of the command to select.
   */
  select(name) {
    this.#cursor = this.#commands.find(command => command.name === name) || null;

    return this;
  }

  /**
   * Adds a new command to the CLI.
   *
   * @param {string} name The name of the command to add.
   */
  addCommand(name) {
    this.#commands.push({
      name,
      positionals: [],
      options: {},
      actions: [],
    });

    this.select(name);

    return this;
  }

  /**
   * Adds a positional argument to the currently selected command.
   *
   * @param {string} name The name of the positional argument to add.
   * @throws {Error} If no command is selected.
   */
  addPositional(name) {
    if (!this.#cursor) throw new Error('You must select a command before adding a new positional');

    this.#cursor.positionals.push(name);

    return this;
  }

  /**
   * Adds an option to the currently selected command.
   *
   * @param {string} name The name of the option to add.
   * @param {Object} [opts] Additional options for the option.
   * @param {*} [opts.default=true] The default value of the option.
   * @throws {Error} If no command is selected.
   */
  addOption(name, opts) {
    const _default = opts?.default || true;

    if (!this.#cursor) throw new Error('You must select a command before adding a new option');

    this.#cursor.options[name] = _default;

    return this;
  }

  /**
   * Parses an input string
   */
  parse(inputStr) {
    const input = InputParser.parse(inputStr);
    this.select(input.name);

    const cursor = this.#cursor;
    if (!cursor) throw new Error(`Could not find command: ${input.name}`);

    const result = {};

    for (let i = 0; i < cursor.positionals.length; i++) {
      const positional = cursor.positionals[i];

      result[positional] = input.positionals[i];
    }

    const cursorOptionEntries = Object.entries(cursor.options);

    for (let i = 0; i < cursorOptionEntries.length; i++) {
      const [name] = cursorOptionEntries[i];

      if (typeof input.options[name] !== 'undefined') {
        result[name] = input.options[name];
      }
    }

    for (const action of cursor.actions) {
      action(result);
    }
  }

  action(fn) {
    this.#cursor.actions.push(fn);

    return this;
  }
}

/**
 * Creates a default state
 */
function createDefaultState() {
  return {
    layer: 'base',
    selector: 'all',
  };
}

/**
 * @param {string} path
 * @param {string} name
 */
async function filterDirectory(path, name) {
  return findAllContentIn(path, { type: FS_TYPES.DIRECTORY, name });
}

/**
 * @param {string} path
 */
async function filterNodeModules(path) {
  return filterDirectory(path, 'node_modules');
}

/**
 * @param {string} path
 */
async function filterDist(path) {
  return filterDirectory(path, 'dist');
}

/**
 * Returns an array of contents in a directory
 *
 * @param {string} directory - The directory to open
 * @param {object} [opts]
 * @param {boolean=} opts.recursive
 */
async function openDirectory(directory, opts) {
  const recursive = opts?.recursive || false;
  const files = await fs.readdir(directory, { recursive });

  return files.map(file => npath.join(directory, file));
}

/**
 * Filter a list of filepaths by fs types
 *
 * @param {string[]} paths
 * @param {object} [opts]
 * @param {FS_TYPES=} opts.type
 * @param {string=} opts.name
 */
async function filterFs(paths, opts) {
  const filterArr = [];

  for await (const path of paths) {
    const stat = await fs.stat(path);
    const type = opts?.type || -1;
    const name = opts?.name;

    if (name && npath.parse(path).base !== name) continue;
    if (type === -1) filterArr.push(path);
    if (type === FS_TYPES.FILE && stat.isFile()) filterArr.push(path);
    if (type === FS_TYPES.DIRECTORY && stat.isDirectory()) filterArr.push(path);
    if (type === FS_TYPES.LINK && stat.isSymbolicLink()) filterArr.push(path);
  }

  return filterArr;
}

/**
 * Find all content in a directory by fs type
 *
 * @param {string} directory
 * @param {object} [opts]
 * @param {boolean=} opts.recursive
 * @param {FS_TYPES=} opts.type
 * @param {string=} opts.name
 */
async function findAllContentIn(directory, opts) {
  const recursive = opts?.recursive;
  const type = opts?.type;
  const name = opts?.name;

  const opnDirOpts = {};
  if (typeof recursive !== 'undefined') opnDirOpts.recursive = recursive;

  const fltrFsOpts = {};
  if (typeof type !== 'undefined') fltrFsOpts.type = type;
  if (typeof name !== 'undefined') fltrFsOpts.name = name;

  const files = await openDirectory(directory, opnDirOpts);

  return filterFs(files, fltrFsOpts);
}

/**
 * Wrap a string with a starting and ending strings
 *
 * @param {string} start
 * @param {string | null} end
 */
function wrapText(start, end) {
  /**
   * @param {string} text
   */
  function padText(text) {
    let _text = start + text;
    _text += end || start;

    return _text;
  }

  return padText;
}
