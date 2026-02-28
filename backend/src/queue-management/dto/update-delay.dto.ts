import { IsNumber, IsPositive } from 'class-validator';

export class UpdateDelayDto {
  @IsNumber()
  @IsPositive()
  delayMs: number;
}
