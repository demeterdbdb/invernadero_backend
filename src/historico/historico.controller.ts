import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { HistoricoService } from './historico.service.js';
import { GraficaQueryDto, HistorialQueryDto, ResumenQueryDto } from './dto/historico-query.dto.js';

// Consultas históricas de mediciones. Todas requieren sesión (JwtAuthGuard global).
// Comparte el prefijo 'mediciones' con MedicionesController (POST /mediciones y
// GET /mediciones/actual); por eso HistoricoModule se importa DESPUÉS de
// MedicionesModule en AppModule, para que 'actual' no caiga en ':id'.
@Controller('mediciones')
export class HistoricoController {
  constructor(private readonly service: HistoricoService) {}

  // Historial con filtros
  @Get()
  historial(@Query() q: HistorialQueryDto) {
    return this.service.historial(q);
  }

  // Datos agrupados para gráfica
  @Get('grafica')
  grafica(@Query() q: GraficaQueryDto) {
    return this.service.grafica(q);
  }

  // Promedio, máximo y mínimo por periodo
  @Get('resumen')
  resumen(@Query() q: ResumenQueryDto) {
    return this.service.resumen(q);
  }

  // Una medición. Express 5 ya no acepta regex en la ruta (':id(\\d+)'),
  // así que el formato se valida aquí: solo dígitos y que quepa en bigint.
  @Get(':id')
  una(@Param('id') id: string) {
    if (!/^\d{1,18}$/.test(id)) throw new BadRequestException('id inválido');
    return this.service.una(id);
  }
}
