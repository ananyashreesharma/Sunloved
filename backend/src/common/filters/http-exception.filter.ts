import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

/**
 * Global HTTP Exception Filter
 * 
 * Catches all exceptions (HTTP and otherwise) and returns them in a standardized format:
 * {
 *   "data": null,
 *   "meta": null,
 *   "error": {
 *     "statusCode": 404,
 *     "message": "Product not found",
 *     "path": "/api/products/xyz"
 *   }
 * }
 * 
 * Also logs errors for debugging.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle HttpException (most common)
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || message;
    } else if (exception instanceof Error) {
      // Request errors from the body parser (e.g. 413 too large, 400 bad JSON) carry their status.
      const status = (exception as { status?: number; statusCode?: number }).status ?? (exception as { statusCode?: number }).statusCode;
      if (status && status >= 400 && status < 500) {
        statusCode = status;
        message = status === 413 ? 'That is too long. Paste just the ingredient list.' : 'That request could not be read.';
      } else {
        // Anything else is ours: log the details, but never send internals (database errors etc.) to users.
        message = 'Something went wrong on our side. Please try again.';
      }
    }

    // Log error for debugging
    console.error({
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      statusCode,
      message,
      exception: exception instanceof Error ? exception.stack : String(exception),
    });

    // Return standardized error response
    response.status(statusCode).json({
      data: null,
      meta: null,
      error: {
        statusCode,
        message,
        path: request.url,
      },
    });
  }
}

