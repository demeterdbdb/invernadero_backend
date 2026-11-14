import { Body, Controller, Get, Headers, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator.js';
import { UsuarioActual, type UsuarioSesion } from '../common/usuario-actual.decorator.js';
import { ConfirmarComandoDto, CrearComandoDto, HistorialQueryDto } from './dto/crear-comando.dto.js';
import { AccionComando } from './entities/comando.entity.js';
import { RiegoService } from './riego.service.js';

@Controller()
export class RiegoController {
  constructor(private readonly riegoService: RiegoService) {}

  // ─── Rutas para usuarios: requieren sesión (JwtAuthGuard global) ───

  @Post('riego/encender')
  encender(@Body() dto: CrearComandoDto, @UsuarioActual() usuario: UsuarioSesion) {
    return this.riegoService.crearComando(AccionComando.ENCENDER, dto, usuario);
  }

  @Post('riego/apagar')
  apagar(@Body() dto: CrearComandoDto, @UsuarioActual() usuario: UsuarioSesion) {
    return this.riegoService.crearComando(AccionComando.APAGAR, dto, usuario);
  }

  @Get('riego/estado')
  estado(@Query('dispositivo_id', ParseIntPipe) dispositivoId: number) {
    return this.riegoService.obtenerEstado(dispositivoId);
  }

  @Get('riego/historial')
  historial(@Query() q: HistorialQueryDto) {
    return this.riegoService.obtenerHistorial(q.dispositivo_id, q.limite);
  }

  // ─── Rutas para el ESP32: sin sesión JWT, se autentican con x-api-key ───

  @Public()
  @Get('dispositivos/:id/comandos/pendiente')
  comandoPendiente(@Param('id', ParseIntPipe) id: number, @Headers('x-api-key') apiKey: string) {
    return this.riegoService.obtenerPendienteParaESP32(id, apiKey);
  }

  @Public()
  @Patch('riego/comandos/:id/confirmar')
  confirmarComando(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmarComandoDto,
    @Headers('x-api-key') apiKey: string,
  ) {
    return this.riegoService.confirmarComando(String(id), dto.ejecutado, apiKey);
  }
}
