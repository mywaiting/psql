

export interface Deferred<T> extends Promise<T> {
    resolve: (value?: T | PromiseLike<T>) => void;
    // deno-lint-ignore no-explicit-any
    reject: (reason?: any) => void;
  }