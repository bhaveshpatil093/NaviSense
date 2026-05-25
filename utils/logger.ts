export const logger = {
  error: (context: string, error: unknown) => {
    if (__DEV__) {
      console.warn(`[${context}]`, error);
    }
  }
};
