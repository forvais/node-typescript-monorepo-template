const createLogger = () => ({
  info: (message: string) => console.log(message),
  error: (message: string) => console.error(message),
  warn: (message: string) => console.warn(message),
});

export const logger = createLogger();
