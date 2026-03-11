import { Response, NextFunction, Request } from 'express';
import logger from '../utils/logger';

export class ErrorHandler extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ErrorHandler';
  }
}

export function errorMiddleware(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof ErrorHandler) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
  });
}

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(fn: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
