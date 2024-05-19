import { Resources } from '../../api.js';

export class HelloWorldService {
  /* eslint-disable-next-line no-useless-constructor */
  constructor(private readonly resources: Resources) { }

  public greet(name: string) {
    return `Hello ${name}`;
  }
}
