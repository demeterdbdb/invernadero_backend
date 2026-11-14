import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { UsuarioActual, type UsuarioSesion } from '../common/usuario-actual.decorator.js';
import { DispositivosService } from './dispositivos.service.js';
import { CreateDispositivoDto } from './dto/create-dispositivo.dto.js';
import { ListarDispositivosDto } from './dto/listar-dispositivos.dto.js';
import { UpdateDispositivoDto } from './dto/update-dispositivo.dto.js';

// Todas las rutas requieren sesión (JwtAuthGuard global).
@Controller('dispositivos')
export class DispositivosController {
  constructor(private readonly service: DispositivosService) {}

  @Post()
  crear(@Body() dto: CreateDispositivoDto, @UsuarioActual() usuario: UsuarioSesion) {
    return this.service.crear(dto, usuario);
  }

  @Get()
  listar(@Query() q: ListarDispositivosDto) {
    return this.service.listar(q.zona_id);
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtener(id);
  }

  @Patch(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDispositivoDto,
    @UsuarioActual() usuario: UsuarioSesion,
  ) {
    return this.service.actualizar(id, dto, usuario);
  }

  @Delete(':id')
  @HttpCode(204)
  eliminar(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: UsuarioSesion) {
    return this.service.eliminar(id, usuario);
  }
}
