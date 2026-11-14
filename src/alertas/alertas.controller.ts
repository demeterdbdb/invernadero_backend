import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  MessageEvent,
  Param,
  Patch,
  Post,
  Query,
  Sse,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UsuarioActual, type UsuarioSesion } from '../common/usuario-actual.decorator.js';
import { RolEnum } from '../usuarios/entities/usuario.entity.js';
import { AlertasEventosService } from './alertas-eventos.service.js';
import { AlertasService } from './alertas.service.js';
import { AlertaIdParamDto } from './dto/alerta-id-param.dto.js';
import { AtenderAlertasDto } from './dto/atender-alertas.dto.js';
import { FiltrosAlertaDto } from './dto/filtros-alerta.dto.js';

/**
 * No hay POST /alertas: las alertas las crea el backend (AlertasService.evaluar
 * al recibir mediciones), no los clientes.
 * Las rutas fijas (resumen, stream, atender) van ANTES de ":id" para que no se confundan.
 */
@Controller('alertas')
export class AlertasController {
  constructor(
    private readonly alertas: AlertasService,
    private readonly eventos: AlertasEventosService,
  ) {}

  @Get()
  listar(@Query() filtros: FiltrosAlertaDto) {
    return this.alertas.listar(filtros);
  }

  @Get('resumen')
  resumen() {
    return this.alertas.resumen();
  }

  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.eventos.flujo();
  }

  @Post('atender')
  @HttpCode(200)
  @Roles(RolEnum.OPERADOR, RolEnum.ADMIN)
  atenderLote(@UsuarioActual() u: UsuarioSesion, @Body() dto: AtenderAlertasDto) {
    return this.alertas.atenderLote(u, dto.ids);
  }

  @Get(':id')
  obtener(@Param() { id }: AlertaIdParamDto) {
    return this.alertas.obtener(id);
  }

  @Patch(':id/atender')
  @Roles(RolEnum.OPERADOR, RolEnum.ADMIN)
  atender(@UsuarioActual() u: UsuarioSesion, @Param() { id }: AlertaIdParamDto) {
    return this.alertas.atender(u, id);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(RolEnum.ADMIN)
  eliminar(@UsuarioActual() u: UsuarioSesion, @Param() { id }: AlertaIdParamDto) {
    return this.alertas.eliminar(u, id);
  }
}
