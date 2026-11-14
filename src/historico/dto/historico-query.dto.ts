import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// Filtros
class FiltrosBaseDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  dispositivo_id?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  zona_id?: number;

  @IsOptional() @IsDateString()
  fecha_inicio?: string;

  @IsOptional() @IsDateString()
  fecha_fin?: string;
}

// GET historial
export class HistorialQueryDto extends FiltrosBaseDto {
  @IsOptional() @IsString() @MaxLength(30)
  variable?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000)
  limite?: number;
}

// GET grafica
export class GraficaQueryDto extends FiltrosBaseDto {
  @IsString() @MaxLength(30)
  variable: string;

  @IsOptional() @IsIn(['hora', 'dia'])
  intervalo?: 'hora' | 'dia';
}

// GET resumen
export class ResumenQueryDto extends FiltrosBaseDto {
  @IsOptional() @IsString() @MaxLength(30)
  variable?: string;

  @IsOptional() @IsIn(['hora', 'dia'])
  periodo?: 'hora' | 'dia';
}
