import env from '@node-typescript-monorepo-template/env';

import { Api, Resources, Route } from './api/api.js';
import { createRoutes } from './api/v1/index.js';

const resources: Resources = {};
const routes: Route[] = [
  {
    path: '/api/v1',
    router: createRoutes(resources),
  },
];

const api = new Api(routes, resources);
api.start(env.API_HOST, env.API_PORT);
