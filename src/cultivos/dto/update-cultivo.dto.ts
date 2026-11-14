import { PartialType } from '@nestjs/mapped-types';
import { CreateCultivoDto } from './create-cultivo.dto.js';

export class UpdateCultivoDto extends PartialType(CreateCultivoDto) {}
