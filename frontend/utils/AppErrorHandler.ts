// frontend/app/utils/AppErrorHandler.ts
export class AppErrorHandler {
  static handleError(error: Error, context: string) {
    console.error(`[Error in ${context}]`, error.message);
  }
}
