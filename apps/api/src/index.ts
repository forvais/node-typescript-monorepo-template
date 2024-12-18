import { Api, Resources, Route } from './api/api.js';
import { createRoutes } from './api/v1/index.js';

import { env } from './env.js';

const HOST = env.API_HOST;
const PORT = env.API_PORT;

const resources: Resources = {};
const routes: Route[] = [
  {
    path: '/api/v1',
    router: createRoutes(resources),
  },
];

const api = new Api(routes, resources);
api.start(HOST, PORT);
