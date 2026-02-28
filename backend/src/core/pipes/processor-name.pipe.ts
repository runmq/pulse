import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

const PROCESSOR_NAME_PATTERN = /^[a-zA-Z0-9._\- ]+$/;
const MAX_LENGTH = 255;

@Injectable()
export class ParseProcessorNamePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value || value.length === 0) {
      throw new BadRequestException('processorName must not be empty');
    }

    const decoded = decodeURIComponent(value);
    if (!PROCESSOR_NAME_PATTERN.test(decoded)) {
      throw new BadRequestException(
        'processorName must only contain alphanumeric characters, hyphens, underscores, dots, and spaces',
      );
    }

    return decoded;
  }
}
