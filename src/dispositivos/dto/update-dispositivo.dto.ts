import { PartialType } from '@nestjs/mapped-types';
import { CreateDispositivoDto } from './create-dispositivo.dto.js';

export class UpdateDispositivoDto extends PartialType(CreateDispositivoDto) {}
