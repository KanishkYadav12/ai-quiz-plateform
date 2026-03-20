import { AppError } from "./appError.js";

export class NotFoundException extends AppError {
  constructor(msg = "Resource not found") {
    super(msg, 404, "NOT_FOUND");
  }
}
export class UnauthorizedException extends AppError {
  constructor(msg = "Not authorized") {
    super(msg, 401, "UNAUTHORIZED");
  }
}
export class ForbiddenException extends AppError {
  constructor(msg = "Access forbidden") {
    super(msg, 403, "FORBIDDEN");
  }
}
export class BadRequestException extends AppError {
  constructor(msg = "Bad request") {
    super(msg, 400, "BAD_REQUEST");
  }
}
export class ConflictException extends AppError {
  constructor(msg = "Conflict") {
    super(msg, 409, "CONFLICT");
  }
}
