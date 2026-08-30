import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiSuccessResponse } from '../interfaces/api-response.interface';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'data' in data
        ) {
          return data as unknown as ApiSuccessResponse<T>;
        }

        if (
          data &&
          typeof data === 'object' &&
          'items' in data &&
          'meta' in data
        ) {
          const paginated = data as {
            items: T;
            meta: Record<string, unknown>;
          };
          return {
            success: true,
            data: paginated.items,
            meta: paginated.meta,
            error: null,
          };
        }

        return {
          success: true,
          data,
          meta: null,
          error: null,
        };
      }),
    );
  }
}
