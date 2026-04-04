// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../util/error';

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  stack?: string;
}

// Handle Prisma specific errors
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      return new AppError(
        `Duplicate field value: ${(error.meta?.target as string[])?.join(', ')}`,
        409,
        'DUPLICATE_ERROR',
        { fields: error.meta?.target }
      );
    case 'P2014':
      return new AppError(
        'Invalid ID: This record is referenced by other records',
        400,
        'INVALID_ID_ERROR'
      );
    case 'P2003':
      return new AppError(
        'Foreign key constraint failed',
        400,
        'FOREIGN_KEY_ERROR'
      );
    case 'P2025':
      return new AppError(
        'Record not found',
        404,
        'NOT_FOUND_ERROR'
      );
    default:
      return new AppError(
        `Database error: ${error.message}`,
        500,
        'DATABASE_ERROR'
      );
  }
};

// Handle validation errors from express-validator or similar
const handleValidationError = (error: any): AppError => {
  const errors = error.errors?.map((err: any) => ({
    field: err.param,
    message: err.msg
  })) || [];
  
  return new AppError(
    'Validation failed',
    400,
    'VALIDATION_ERROR',
    { errors }
  );
};

// Handle JWT errors
const handleJWTError = (): AppError => {
  return new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
};

// Handle JWT expiration
const handleJWTExpiredError = (): AppError => {
  return new AppError('Your token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
};

// Main error handler
export const errorHandler = (
  err: Error | AppError | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // Log error for debugging
  console.error('Error:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    user: (req as any).user
  });

  // Handle specific error types
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaError(error);
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    error = new AppError('Invalid data provided', 400, 'VALIDATION_ERROR');
  }
  
  if (error.name === 'ValidationError') {
    error = handleValidationError(error);
  }
  
  if (error.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }
  
  if (error.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Ensure error is AppError instance
  if (!(error instanceof AppError)) {
    error = new AppError(
      error.message || 'Internal server error',
      500,
      'INTERNAL_ERROR'
    );
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: error.message,
    code: error.code
  };

  // Add details if available
  if (error.data) {
    errorResponse.details = error.data;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  // Send response
  res.status(error.statusCode).json(errorResponse);
};

// Async wrapper to catch errors in route handlers
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Cannot find ${req.originalUrl} on this server`, 404, 'NOT_FOUND');
  next(error);
};