import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator.js';
import { ActualQueryDto } from './dto/actual-query.dto.js';
import { CreateMedicionDto } from './dto/create-medicion.dto.js';
import { MedicionesService } from './mediciones.service.js';

@Controller('mediciones')
export class MedicionesController {
  constructor(private readonly service: MedicionesService) {}

  // Lo llama el ESP32: no usa sesión JWT, se autentica con su api key
  // (header x-api-key), que el servicio valida contra la base de datos.
  @Public()
  @Post()
  registrar(@Body() dto: CreateMedicionDto, @Headers('x-api-key') apiKey: string) {
    return this.service.registrar(dto, apiKey);
  }

  // Requiere sesión (JwtAuthGuard global).
  @Get('actual')
  actual(@Query() filtros: ActualQueryDto) {
    return this.service.actual(filtros);
  }
}
