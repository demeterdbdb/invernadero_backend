import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsString, MaxLength, ValidateNested } from 'class-validator';

export class UmbralDto {
  /** Código de la magnitud (magnitud.codigo): temp_aire, hum_aire, hum_suelo, luz, temp_suelo... */
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  variable: string;

  @IsNumber()
  minimo: number;

  @IsNumber()
  maximo: number;
}

export class SetUmbralesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UmbralDto)
  umbrales: UmbralDto[];
}
