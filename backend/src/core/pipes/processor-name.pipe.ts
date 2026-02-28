import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

const PROCESSOR_NAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const MAX_LENGTH = 255;

@Injectable()
export class ParseProcessorNamePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value || value.length === 0) {
      throw new BadRequestException('processorName must not be empty');
    }

    if (value.length > MAX_LENGTH) {
      throw new BadRequestException(
        `processorName must not exceed ${MAX_LENGTH} characters`,
      );
    }

    if (!PROCESSOR_NAME_PATTERN.test(value)) {
      throw new BadRequestException(
        'processorName must only contain alphanumeric characters, hyphens, underscores, and dots',
      );
    }

    return value;
  }
}
