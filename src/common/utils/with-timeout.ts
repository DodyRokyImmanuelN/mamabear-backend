// Stops waiting without aborting the request: aborting an OpenRouter SDK call mid-response
// leaves an unhandled rejection that crashes the process.
export function withTimeout<T>(request: Promise<T>, ms: number): Promise<T> {
  request.catch(() => {});
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          Object.assign(new Error(`AI request timed out after ${ms}ms`), {
            name: 'AiTimeoutError',
          }),
        ),
      ms,
    );
  });
  return Promise.race([request, timeout]).finally(() => clearTimeout(timer));
}
