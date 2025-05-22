const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
const pty = require('node-pty');
const os = require('os');

const DOCKER_CMD = 'docker';
const DOCKER_COMPOSE_CMD = 'docker compose';

const CMDS = {
  SERVICES_UP: 'docker:start:services',
  SERVICES_DOWN: 'docker:stop:services',
  DEV_UP: 'docker:start:dev',
  DEV_DOWN: 'docker:stop:dev',
  DEV_BUILD: 'docker:build:dev',
  PROD_UP: 'docker:start',
  PROD_DOWN: 'docker:stop',
  PROD_BUILD: 'docker:build',
  DOWN_ALL: 'docker:stop:all',
  LOGS: 'docker:logs',
};

/* eslint-disable no-use-before-define */
const CMD_HANDLER_MAP = {
  [CMDS.SERVICES_UP.toLowerCase()]: cmdServicesUp,
  [CMDS.SERVICES_DOWN.toLowerCase()]: cmdServicesDown,
  [CMDS.DEV_UP.toLowerCase()]: cmdDevUp,
  [CMDS.DEV_DOWN.toLowerCase()]: cmdDevDown,
  [CMDS.DEV_BUILD.toLowerCase()]: cmdDevBuild,
  [CMDS.PROD_UP.toLowerCase()]: cmdProdUp,
  [CMDS.PROD_DOWN.toLowerCase()]: cmdProdDown,
  [CMDS.PROD_BUILD.toLowerCase()]: cmdProdBuild,
  [CMDS.DOWN_ALL.toLowerCase()]: cmdDownAll,
  [CMDS.LOGS.toLowerCase()]: cmdLogs,
};
/* eslint-enable no-use-before-define */

function raise(str, ErrorConstructor = Error) {
  throw new ErrorConstructor(str);
}

function execStream(cmd) {
  return new Promise(resolve => {
    const shell = os.platform() === 'win32' ? 'powershell.exe' : (process.env.SHELL || 'bash');

    const args = ['-c', cmd];

    const ptyProcess = pty.spawn(shell, args, {
      name: 'xterm-color',
      cols: process.stdout.columns || 80,
      rows: process.stdout.rows || 24,
      cwd: process.cwd(),
      env: process.env,
    });

    ptyProcess.onData(data => {
      process.stdout.write(data);
    });

    ptyProcess.onExit(resolve);
  });
}

async function verifyDocker() {
  try {
    await exec(`${DOCKER_CMD} --version`);

    return true;
  } catch {
    return false;
  }
}

async function verifyDockerCompose() {
  try {
    await exec(`${DOCKER_COMPOSE_CMD} version`);

    return true;
  } catch {
    return false;
  }
}

async function checkRequirements() {
  return {
    docker: await verifyDocker(),
    compose: await verifyDockerCompose(),
  };
}

async function getAllContainers() {
  const { stdout } = await exec(`${DOCKER_COMPOSE_CMD} config --services`);

  return stdout.split('\n').filter(Boolean);
}

// async function getRunningContainers() {
//   const { stdout } = await exec_stream('docker compose ps');
//
//   return stdout.split('\n').filter(Boolean).slice(1).map(line => line.split(' ').filter(Boolean)).map(line => line[0]);
// }

async function buildContainers(containers) {
  if (containers.length > 0) {
    await execStream(`${DOCKER_COMPOSE_CMD} build ${containers.join(' ')}`);
  } else {
    console.warn('No containers found.');
  }
}

async function runContainers(containers) {
  if (containers.length > 0) {
    await execStream(`${DOCKER_COMPOSE_CMD} up --remove-orphans -d ${containers.join(' ')}`);
  } else {
    console.warn('No containers found.');
  }
}

async function stopContainers(containers) {
  if (containers.length > 0) {
    await execStream(`${DOCKER_COMPOSE_CMD} stop ${containers.join(' ')} -t 0`);
  } else {
    console.warn('No containers found.');
  }
}

async function removeContainers(containers) {
  if (containers.length > 0) {
    await execStream(`${DOCKER_COMPOSE_CMD} rm -f ${containers.join(' ')}`);
  } else {
    console.warn('No containers found.');
  }
}

async function cmdServicesUp() {
  const allContainers = await getAllContainers();
  const serviceContainers = allContainers.filter(service => service.endsWith('-service'));

  await runContainers(serviceContainers);
}

async function cmdServicesDown() {
  const allContainers = await getAllContainers();
  const serviceContainers = allContainers.filter(service => service.endsWith('-service'));

  await stopContainers(serviceContainers);
}

async function cmdDevDown() {
  const allContainers = await getAllContainers();
  const devContainers = allContainers.filter(service => service.endsWith('-dev'));

  await stopContainers(devContainers);
  await removeContainers(devContainers);
}

async function cmdProdDown() {
  const allContainers = await getAllContainers();
  const prodContainers = allContainers.filter(service => service.endsWith('-prod'));

  await stopContainers(prodContainers);
  await removeContainers(prodContainers);
}

async function cmdDevUp() {
  const allContainers = await getAllContainers();
  const devContainers = allContainers.filter(service => service.endsWith('-dev'));

  await cmdProdDown();
  await runContainers(devContainers);
}

async function cmdProdUp() {
  const allContainers = await getAllContainers();
  const prodContainers = allContainers.filter(service => service.endsWith('-prod'));

  await cmdDevDown();
  await runContainers(prodContainers);
}

async function cmdDevBuild() {
  const allContainers = await getAllContainers();
  const devContainers = allContainers.filter(service => service.endsWith('-dev'));

  await buildContainers(devContainers);
}

async function cmdProdBuild() {
  const allContainers = await getAllContainers();
  const prodContainers = allContainers.filter(service => service.endsWith('-prod'));

  await buildContainers(prodContainers);
}

async function cmdDownAll() {
  const allContainers = await getAllContainers();

  await stopContainers(allContainers);
  await removeContainers(allContainers);
}

async function cmdLogs() {
  await execStream(`${DOCKER_COMPOSE_CMD} logs -f`);
}

function getCmdHandler(cmd) {
  return CMD_HANDLER_MAP[cmd.toLowerCase()] ?? raise(`'${cmd}' is not a supported command.`);
}

async function main(argc, argv) {
  if (argc !== 1) {
    return;
  }

  const requirements = await checkRequirements();
  if (!requirements.docker) raise('Docker is not installed or could not be found.');
  if (!requirements.compose) raise('Docker Compose is not installed or could not be found.');

  const [cmd] = argv;
  const handler = getCmdHandler(cmd);

  await handler();
}

main(process.argv.slice(2).length, process.argv.slice(2));
