import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  private safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private extractDbError(exception: QueryFailedError): Record<string, unknown> {
    const err = exception as QueryFailedError & {
      query?: string;
      parameters?: unknown[];
      driverError?: {
        code?: string;
        detail?: string;
        hint?: string;
        where?: string;
        position?: string;
        schema?: string;
        table?: string;
        column?: string;
        dataType?: string;
        constraint?: string;
        routine?: string;
      };
    };

    return {
      message: err.message,
      query: err.query,
      parameters: err.parameters,
      postgres: err.driverError
        ? {
            code: err.driverError.code,
            detail: err.driverError.detail,
            hint: err.driverError.hint,
            where: err.driverError.where,
            position: err.driverError.position,
            schema: err.driverError.schema,
            table: err.driverError.table,
            column: err.driverError.column,
            dataType: err.driverError.dataType,
            constraint: err.driverError.constraint,
            routine: err.driverError.routine,
          }
        : undefined,
    };
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number;
    let message: string;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as { message?: string | string[] }).message
            ? Array.isArray(
                (exceptionResponse as { message: string | string[] }).message,
              )
              ? (
                  exceptionResponse as { message: string[] }
                ).message.join(', ')
              : (exceptionResponse as { message: string }).message
            : exception.message;
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';

      if (exception instanceof QueryFailedError) {
        const db = this.extractDbError(exception);
        this.logger.error(`DB QueryFailedError on ${request.method} ${request.url}`);
        this.logger.error(this.safeStringify(db));
      } else {
        this.logger.error(`Unhandled exception on ${request.method} ${request.url}`);
        this.logger.error(this.safeStringify(exception));
      }
    }

    const payload: Record<string, unknown> = {
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Optional debug payload for local troubleshooting only.
    if (process.env.EXPOSE_ERROR_DETAILS === 'true') {
      if (exception instanceof QueryFailedError) {
        payload.debug = this.extractDbError(exception);
      } else if (!(exception instanceof HttpException)) {
        payload.debug = this.safeStringify(exception);
      }
    }

    response.status(statusCode).json(payload);
  }
}
