import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CrearComandoDto {
  @IsInt()
  @Min(1)
  dispositivo_id: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3600)
  duracion_seg?: number;
}

export class ConfirmarComandoDto {
  @IsBoolean()
  ejecutado: boolean;
}

export class HistorialQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  dispositivo_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limite?: number;
}
