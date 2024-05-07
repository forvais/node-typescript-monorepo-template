// @ts-check
/* eslint-disable no-use-before-define */

const path = require('node:path');
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

  const obj = {};
  obj.applications = await findAllContentIn(applications);
  obj.packages = await findAllContentIn(packages);
})();

/* =========================================================== */
/*                           Commands                          */
/* =========================================================== */

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

async function clean(targets) {
  const _targets = ['.', ...targets];

  const distPromises = _targets.map(_path => filterDist(_path));
  const nodeModulesPromises = _targets.map(_path => filterNodeModules(_path));

  const dist = (await Promise.all(distPromises)).flat();
  const nodeModules = (await Promise.all(nodeModulesPromises)).flat();

  // for (const directory of [...dist, ...nodeModules]) {
  //   fs.unlink(d);
  // }
  console.log([...dist, ...nodeModules]);
  [...dist, ...nodeModules].forEach(_path => {
    fs.rm(_path, { recursive: true, force: true });
  });
}

function parallelizeCommands(targets, workers = 1) {

}

/* =========================================================== */
/*                           Utilities                         */
/* =========================================================== */

function unary(fn) {
  return v => fn(v);
}

async function filterDirectory(path, name) {
  return findAllContentIn(path, { type: FS_TYPES.DIRECTORY, name });
}

async function filterNodeModules(directory) {
  return filterDirectory(directory, 'node_modules');
}

async function filterDist(directory) {
  return filterDirectory(directory, 'dist');
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

  return files.map(file => path.join(directory, file));
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

  for await (const _path of paths) {
    const stat = await fs.stat(_path);
    const type = opts?.type || -1;
    const name = opts?.name;

    if (name && path.parse(_path).base !== name) continue;
    if (type === -1) filterArr.push(_path);
    if (type === FS_TYPES.FILE && stat.isFile()) filterArr.push(_path);
    if (type === FS_TYPES.DIRECTORY && stat.isDirectory()) filterArr.push(_path);
    if (type === FS_TYPES.LINK && stat.isSymbolicLink()) filterArr.push(_path);
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
