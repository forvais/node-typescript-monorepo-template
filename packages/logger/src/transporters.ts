import winston, { format } from 'winston';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatMessage = (message: any): string => {
  if (typeof message === 'object') {
    return JSON.stringify(message, null, 2);
  }

  return message;
};

const consoleFormat = format.combine(
  format.splat(),
  format.timestamp(process.env.NODE_ENV !== 'production' ? { format: 'YYYY-MM-DD HH:mm:ss' } : undefined),
  format.errors({ stack: true }),
  format.printf(({ level, message, timestamp, stack }) => `[${timestamp}/${level.toUpperCase()}]: ${stack || formatMessage(message)}`),
);

const fileFormat = format.combine(
  format.timestamp(),
  format.json(),
);

const errorFileFormat = format.combine(
  format.errors({ stack: true }),
  fileFormat,
);

export const consoleTransporter = () => new winston.transports.Console({ format: consoleFormat, level: 'info' });
export const logFileTransporter = (filename: string) => new winston.transports.File({ format: fileFormat, filename, level: 'info' });
export const errorFileTransporter = (filename: string) => new winston.transports.File({ format: errorFileFormat, filename, level: 'error' });
