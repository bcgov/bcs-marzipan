import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

/**
 * ParseOptionalIntPipe
 *
 * A NestJS pipe that optionally parses a string to an integer.
 * Returns undefined if the value is undefined, null, or empty string.
 * Throws BadRequestException if the value is provided but not a valid integer.
 */
@Injectable()
export class ParseOptionalIntPipe implements PipeTransform<
  string | undefined,
  number | undefined
> {
  transform(
    value: string | undefined,
    metadata: ArgumentMetadata
  ): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new BadRequestException(
        `Validation failed: ${metadata.data} must be a valid integer`
      );
    }

    return parsed;
  }
}
