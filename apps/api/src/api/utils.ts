import { logger } from '@node-typescript-monorepo-template/logger';
import express from 'express';
import { ZodError } from 'zod';
import { ApiError } from './errors/ApiError.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Express {
    export interface Request {
      page: number;
      limit: number;
    }
  }
}

export const DEFAULT_PAGE = 0;
export const DEFAULT_LIMIT = 25;

type ResponseData = string | number | object | Error
type Handler<T extends ResponseData> = (req: express.Request, res: express.Response, next: express.NextFunction) => T
type HandlerPromise<T extends ResponseData> = (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<T>

export type ResponseBody = {
  err?: unknown,
  data: unknown,
  pagination?: {
    prev?: string | null
    next?: string | null
  }
}

/**
 * Creates a subset of an array from the n-th element [from] to the m-th element [to].
 */
export function arraySubset<T>(data: T[], from: number, to: number) {
  const _data: T[] = [];

  for (let index = from; index < to; index++) {
    _data[index - from] = data[index];
  }

  return _data;
}

export function createPaginationLink(url: string, dataLength: number, page: number, limit: number) {
  const maxPages = Math.ceil(dataLength / limit);

  if (page < 0 || page >= maxPages) return null;

  const _url = new URL(url);
  _url.searchParams.set('page', page.toString());
  _url.searchParams.set('limit', limit.toString());

  return _url.toString();
}

function isError(err: unknown): err is Error {
  return err instanceof Error;
}

export function sendResponse<T extends ResponseData>(status: number, data: T) {
  return (req: express.Request, res: express.Response) => {
    const responseBody: ResponseBody = {
      data: null,
      pagination: {
        prev: null,
        next: null,
      },
    };

    let err: unknown;

    if (data instanceof ZodError) {
      err = data;
    } else if (data instanceof Error) {
      err = data.message;
    } else {
      err = 'Unknown error';
    }

    if (isError(data)) {
      responseBody.err = err;
    }

    if (Array.isArray(data)) {
      const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = req;
      const subsetFrom = page * limit;
      const subsetTo = Math.min(data.length, subsetFrom + limit);

      const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const _createPaginationLink = createPaginationLink.bind(null, fullUrl, data.length);
      const prev = _createPaginationLink(page - 1, limit);
      const next = _createPaginationLink(page + 1, limit);

      responseBody.data = arraySubset(data, subsetFrom, subsetTo);
      responseBody.pagination = { next, prev };
    } else {
      responseBody.data = data;

      // NOTE: Want to remove paginations on non-array responses?
      // delete responseBody.pagination;
    }

    res.status(status).json(responseBody);
  };
}

export function use<T extends ResponseData>(handler: Handler<T> | HandlerPromise<T>) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      let data = handler(req, res, next);

      // A flakey test to determine is the handler returned a promise
      if (data && typeof (data as Promise<T>).then === 'function') {
        data = await data;
      }

      if (isError(data)) throw data;

      // Rare, but we should handle arrays of errors as well
      if (Array.isArray(data)) {
        data.filter(isError).forEach(err => {
          throw err;
        });
      }

      sendResponse(200, data)(req, res);
    } catch (err) {
      if (err instanceof Error) logger.error(err.stack);

      if (err instanceof ApiError) {
        sendResponse(err.httpStatus, err)(req, res);
        return;
      }

      sendResponse(500, new Error('Internal Server Error'))(req, res);
    }
  };
}
