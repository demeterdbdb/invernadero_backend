import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class LecturaItemDto {
  @IsString()
  @MaxLength(30)
  codigo: string;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  valor: number;
}

export class CreateMedicionDto {
  @IsInt()
  @Min(1)
  dispositivo_id: number;

  @IsOptional()
  @IsDateString()
  fecha_hora?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => LecturaItemDto)
  lecturas: LecturaItemDto[];
}
