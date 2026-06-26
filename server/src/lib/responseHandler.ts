import type { Response } from "express";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200,
  meta?: Record<string, unknown>
) {
  const response: ApiResponse<T> = { success: true, message, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T, message = "Created successfully") {
  return sendSuccess(res, data, message, 201);
}

export function sendError(
  res: Response,
  message = "Something went wrong",
  statusCode = 500,
  error?: string
) {
  const response: ApiResponse = { success: false, message };
  if (error) response.error = error;
  return res.status(statusCode).json(response);
}

export function sendNotFound(res: Response, resource = "Resource") {
  return sendError(res, `${resource} not found`, 404);
}

export function sendBadRequest(res: Response, message = "Bad request", error?: string) {
  return sendError(res, message, 400, error);
}

export function sendUnauthorized(res: Response, message = "Unauthorized") {
  return sendError(res, message, 401);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = "Success"
) {
  return sendSuccess(res, data, message, 200, {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  });
}