import express from 'express';

import { HelloWorldController } from './HelloWorld/helloWorld.controller.js';
import { Resources } from '../api.js';
import { use } from '../utils.js';

export const createRoutes = (resources: Resources) => {
  const helloWorld = new HelloWorldController(resources);

  // eslint-disable-next-line new-cap
  const router = express.Router();

  router.post('/greet', use(helloWorld.greet.bind(helloWorld)));

  return router;
};
