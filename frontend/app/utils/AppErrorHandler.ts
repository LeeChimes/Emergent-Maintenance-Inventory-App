// frontend/app/utils/AppErrorHandler.ts
/**
 * Tiny, dependency-free error helper used by screens.
 * Keep it simple for now; you can wire to a backend later.
 */
export const AppErrorHandler = {
  handleError(err: unknown, context?: string) {
    const e = err instanceof Error ? err : new Error(String(err));
    // Always log to console for dev
    // eslint-disable-next-line no-console
    console.error(`[AppError]${context ? ` (${context})` : ''}:`, e.message, e.stack);
    // TODO: send to your backend or monitoring service here if needed
  },

  guard<T extends (...args: any[]) => any>(fn: T, context?: string) {
    return (...args: Parameters<T>): ReturnType<T> | undefined => {
      try {
        // @ts-expect-error - allow any return
        return fn(...args);
      } catch (err) {
        this.handleError(err, context);
        return undefined;
      }
    };
  },
};
