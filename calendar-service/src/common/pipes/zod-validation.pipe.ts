import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ZodError, ZodTypeAny } from 'zod';

/**
 * ZodValidationPipe
 *
 * A NestJS pipe that validates incoming request data against a Zod schema.
 * This ensures that request DTOs are automatically validated and typed correctly.
 *
 * Apply the pipe on the specific parameter (e.g. @Body or @Query), not with
 * @UsePipes at method level. Method-level @UsePipes runs the pipe for every
 * parameter (including @CurrentUser()), causing validation to run against
 * the wrong value and fail.
 *
 * Usage (body):
 * ```typescript
 * @Post()
 * async create(
 *   @Body(new ZodValidationPipe(createActivityRequestSchema)) body: CreateActivityRequest,
 *   @CurrentUser() user: AuthUser
 * ) {
 *   // body is validated and typed
 * }
 * ```
 *
 * Usage (query):
 * ```typescript
 * @Get()
 * async findAll(
 *   @Query(new ZodValidationPipe(filterActivitiesQuerySchema)) query: FilterActivitiesQueryParams
 * ) {
 *   // query is validated and typed
 * }
 * ```
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodTypeAny) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      // Parse and validate the value against the schema
      // This will throw a ZodError if validation fails
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors into a user-friendly format
        // ZodError uses 'issues' property, not 'errors'
        const formattedErrors = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));

        throw new BadRequestException({
          message: 'Validation failed',
          errors: formattedErrors,
          // Include the full error details in development for debugging
          ...(process.env.NODE_ENV === 'development' && {
            details: error.issues,
          }),
        });
      }

      // If it's not a ZodError, re-throw as a generic validation error
      throw new BadRequestException('Validation failed');
    }
  }
}
