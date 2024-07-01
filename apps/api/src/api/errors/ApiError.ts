export class ApiError extends Error {
  constructor(msg: string) {
    super(msg);

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
