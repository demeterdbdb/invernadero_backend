import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ActualQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dispositivo_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  zona_id?: number;
}
