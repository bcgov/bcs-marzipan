import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

/**
 * ParsePositiveIntPipe
 *
 * A NestJS pipe that parses a string to a positive integer.
 * Throws BadRequestException if the value is not a valid positive integer.
 */
@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(
        `Validation failed: ${metadata.data} must be a positive integer`
      );
    }

    return parsed;
  }
}
