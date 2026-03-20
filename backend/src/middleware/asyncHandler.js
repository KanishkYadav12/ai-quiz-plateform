/**
 * Wraps an async Express route handler.
 * Any thrown error is forwarded to the global error middleware automatically —
 * no try-catch needed in controllers.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
