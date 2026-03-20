import { ZodError } from 'zod'
import { AppError } from '../utils/appError.js'

const isDev = process.env.NODE_ENV === 'development'

export const errorHandler = (err, req, res, _next) => {
  // ── Zod validation error ──────────────────────────────────
  if (err instanceof ZodError) {
    return res.status(400).json({
      status:    'error',
      errorCode: 'VALIDATION_ERROR',
      message:   'Invalid request data.',
      errors:    err.errors.map((e) => ({
        field:   e.path.join('.'),
        message: e.message,
      })),
    })
  }

  // ── Malformed JSON body ───────────────────────────────────
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      status:    'error',
      errorCode: 'INVALID_JSON',
      message:   'Request body contains invalid JSON.',
    })
  }

  // ── Mongoose duplicate key ────────────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    return res.status(409).json({
      status:    'error',
      errorCode: 'DUPLICATE_KEY',
      message:   `${field} already exists.`,
    })
  }

  // ── Mongoose cast error (invalid ObjectId) ────────────────
  if (err.name === 'CastError') {
    return res.status(400).json({
      status:    'error',
      errorCode: 'INVALID_ID',
      message:   `Invalid value for field: ${err.path}`,
    })
  }

  // ── Known operational error ───────────────────────────────
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status:    'error',
      errorCode: err.errorCode,
      message:   err.message,
      ...(isDev && { stack: err.stack }),
    })
  }

  // ── Unknown / programming error ───────────────────────────
  console.error('[Unhandled Error]', err)

  return res.status(500).json({
    status:    'error',
    errorCode: 'INTERNAL_SERVER_ERROR',
    message:   'Something went wrong. Please try again later.',
    ...(isDev && { stack: err.stack, detail: err.message }),
  })
}
