export function raise<T extends Error>(ErrorInstance: T): never {
  throw ErrorInstance;
}

export function tryCatch<T, E = Error>(fn: () => T) {
  type Result<TResult, EResult> =
    | { data: TResult; error: null }
    | { data: null; error: EResult };
  type ReturnType =
    T extends Promise<infer P> ? Promise<Result<P, E>> : Result<T, E>;

  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then((data: Promise<unknown>) => ({ data, error: null }))
        .catch((e: unknown) => ({ data: null, error: e as E })) as ReturnType;
    }
    return { data: result, error: null } as ReturnType;
  } catch (e: unknown) {
    return { data: null, error: e as E } as ReturnType;
  }
}
