import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { NivelAlerta, TipoAlerta } from '../entities/alerta.entity.js';

export class FiltrosAlertaDto {
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  atendida?: boolean;

  @IsOptional()
  @IsEnum(NivelAlerta)
  nivel?: NivelAlerta;

  @IsOptional()
  @IsEnum(TipoAlerta)
  tipo?: TipoAlerta;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  zonaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sensorId?: number;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  /** id de la ultima alerta de la pagina anterior (viene en "siguienteCursor"). */
  @IsOptional()
  @Matches(/^\d{1,18}$/)
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite?: number;
}
