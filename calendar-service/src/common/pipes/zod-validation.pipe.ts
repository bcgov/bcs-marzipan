import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ZodType, ZodError } from 'zod';

/**
 * ZodValidationPipe
 *
 * A NestJS pipe that validates incoming request data against a Zod schema.
 * This ensures that request DTOs are automatically validated and typed correctly.
 *
 * Usage:
 * ```typescript
 * @Post()
 * @UsePipes(new ZodValidationPipe(createActivityRequestSchema))
 * async create(@Body() body: CreateActivityRequest) {
 *   // body is now validated and typed
 * }
 * ```
 *
 * Or for query parameters:
 * ```typescript
 * @Get()
 * async findAll(
 *   @Query(new ZodValidationPipe(filterActivitiesSchema)) query: FilterActivities
 * ) {
 *   // query is validated and typed
 * }
 * ```
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
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
