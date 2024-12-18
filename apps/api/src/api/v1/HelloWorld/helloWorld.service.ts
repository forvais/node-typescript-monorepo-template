import { Resources } from '../../api.js';

export class HelloWorldService {
  constructor(private readonly resources: Resources) { }

  // eslint-disable-next-line class-methods-use-this -- This is a demonstration and it can be used it would use `this.resources` at some point in actual implementations.
  public greet(name: string) {
    return `Hello ${name}`;
  }
}
