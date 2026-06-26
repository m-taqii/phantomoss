import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import { sendError } from "../lib/responseHandler";

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message = isAppError ? err.message : "Internal server error";

  logger.error(`${req.method} ${req.path} — ${err.message}`, {
    statusCode,
    stack: err.stack,
  });

  return sendError(res, message, statusCode, 
    process.env.NODE_ENV === "development" ? err.stack : undefined
  );
}