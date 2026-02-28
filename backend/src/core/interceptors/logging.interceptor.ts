import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { sanitizeBody } from '../helpers/sanitizer.helper.js';

@Injectable()
export default class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, handler: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, body } = request;

    this.logger.log(
      `→ ${method} ${originalUrl} ${Object.keys(body || {}).length ? JSON.stringify(sanitizeBody(body)) : ''}`.trim(),
    );

    return handler.handle().pipe(
      tap(() => {
        const { statusCode } = context.switchToHttp().getResponse();
        const duration = Date.now() - now;
        this.logger.log(`← ${method} ${originalUrl} ${statusCode} ${duration}ms`);
      }),
      catchError((error) => {
        const duration = Date.now() - now;
        this.logger.error(
          `← ${method} ${originalUrl} ${duration}ms - ${error.message}`,
        );
        return throwError(() => error);
      }),
    );
  }
}
