import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { EstadoDispositivo } from '../entities/dispositivo.entity.js';

export class CreateDispositivoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  nombre: string;

  @Matches(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/, {
    message: 'mac debe tener el formato AA:BB:CC:DD:EE:FF',
  })
  mac: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  zona_id?: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(86400)
  intervalo_seg?: number;

  @IsOptional()
  @IsEnum(EstadoDispositivo)
  estado?: EstadoDispositivo;
}
