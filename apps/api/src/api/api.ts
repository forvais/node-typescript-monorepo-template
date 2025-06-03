import express, { Request, Response } from 'express';

// Middleware
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import env from '@node-typescript-monorepo-template/env';
import { logger } from '@node-typescript-monorepo-template/logger';
import { sendResponse } from './utils.js';

export type Resources = object;

export type Route = {
  path: string,
  router: express.Router
}

export class Api {
  public readonly app: express.Application;
  private server: ReturnType<express.Application['listen']> | null = null;

  private readonly services: Record<string, URL> = {};

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(routes: Route[], resources: Resources) {
    this.app = express();

    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(morgan(env.IS_DEV ? 'dev' : 'combined', {
      stream: {
        write: (msg: string) => logger.info(msg.trim()),
      },
    }));

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    for (const route of routes) {
      this.app.use(route.path, route.router);
    }

    this.app.get('/healthz', sendResponse(200, 'OK!'));
    this.app.all('*', (req: Request, res: Response) => sendResponse(404, `Route '${req.url}' not found.`)(req, res));
  }

  public start(host: string, port: number, cb?: () => void) {
    const defaultCb = () => {
      logger.info(`Listening on http://${host}:${port} in ${env.NODE_ENV} mode.`);
    };

    this.server = this.app.listen(port, host, cb || defaultCb);
  }

  public stop() {
    if (this.server) this.server.close();
  }
}
