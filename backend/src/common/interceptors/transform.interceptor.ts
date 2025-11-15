import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T | null;
  meta?: Record<string, any> | null;
  error?: {
    statusCode: number;
    message: string;
    path: string;
  } | null;
}

/**
 * Global Response Transform Interceptor
 * 
 * Ensures all API responses follow the same structure:
 * {
 *   "data": {...} | [...] | null,
 *   "meta": {...} | null,
 *   "error": null
 * }
 * 
 * This makes the API predictable for frontend, mobile apps, and third-party integrations.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        // If response already has data + meta + error structure, return as-is
        if (
          response &&
          typeof response === 'object' &&
          'data' in response &&
          ('meta' in response || 'error' in response)
        ) {
          return {
            data: response.data ?? null,
            meta: response.meta ?? null,
            error: response.error ?? null,
          };
        }

        // If response is an array, wrap in data with count meta
        if (Array.isArray(response)) {
          return {
            data: response,
            meta: {
              count: response.length,
            },
            error: null,
          };
        }

        // If response is null/undefined, return empty data
        if (response === null || response === undefined) {
          return {
            data: null,
            meta: null,
            error: null,
          };
        }

        // Otherwise wrap in data
        return {
          data: response,
          meta: null,
          error: null,
        };
      }),
    );
  }
}

