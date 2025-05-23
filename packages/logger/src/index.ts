import path from 'path';
import fs from 'fs';

import type Transport from 'winston-transport';
import winston from 'winston';

import { consoleTransporter, errorFileTransporter, logFileTransporter } from './transporters.js';

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace Logger {
  type Options = Partial<{
    path: string
  }>
}

export const configureLogger = (opts: Logger.Options = {}) => {
  const transporters: Transport[] = [
    consoleTransporter(),
  ];

  if (opts.path && opts.path.length > 0) {
    const logFilepath = path.join(opts.path, 'info.log');
    const errorLogFilepath = path.join(opts.path, 'error.log');

    try {
      if (!fs.existsSync(opts.path)) {
        fs.mkdirSync(opts.path);
      }

      // These file writes technically don't need to exist but I'm trying
      // to purposely trigger fs write permission issues
      if (!fs.existsSync(logFilepath)) {
        fs.writeFileSync(logFilepath, '');
      }

      if (!fs.existsSync(errorLogFilepath)) {
        fs.writeFileSync(errorLogFilepath, '');
      }

      transporters.push(logFileTransporter(logFilepath));
      transporters.push(errorFileTransporter(errorLogFilepath));
    } catch {
      // Likely to throw on system that do not allow writing files
    }
  }

  winston.configure({
    defaultMeta: { environment: process.env.NODE_ENV },
    transports: transporters,
  });
};

configureLogger();
export const logger = winston;
