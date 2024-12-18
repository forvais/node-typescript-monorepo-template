import z from 'zod';
import { Request } from 'express';

import { Resources } from '../../api.js';

import { HelloWorldService } from './helloWorld.service.js';

export const greetSchema = z.object({
  name: z.string(),
});

export class HelloWorldController {
  private readonly helloWorldService: HelloWorldService;

  constructor(private readonly resources: Resources) {
    this.helloWorldService = new HelloWorldService(this.resources);
  }

  public greet(req: Request) {
    const body = greetSchema.parse(req.body);

    return this.helloWorldService.greet(body.name);
  }
}
