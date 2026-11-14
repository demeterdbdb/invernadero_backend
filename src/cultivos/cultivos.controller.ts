import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UsuarioActual, type UsuarioSesion } from '../common/usuario-actual.decorator.js';
import { RolEnum } from '../usuarios/entities/usuario.entity.js';
import { CultivosService } from './cultivos.service.js';
import { AsignarCultivoDto } from './dto/asignar-cultivo.dto.js';
import { CreateCultivoDto } from './dto/create-cultivo.dto.js';
import { SetUmbralesDto } from './dto/set-umbrales.dto.js';
import { UpdateCultivoDto } from './dto/update-cultivo.dto.js';

// Todas las rutas requieren sesión (JwtAuthGuard global).
@Controller('cultivos')
export class CultivosController {
  constructor(private readonly service: CultivosService) {}

  @Post()
  @Roles(RolEnum.ADMIN, RolEnum.OPERADOR)
  crear(@Body() dto: CreateCultivoDto, @UsuarioActual() usuario: UsuarioSesion) {
    return this.service.crear(dto, usuario);
  }

  @Get()
  listar() {
    return this.service.findAll();
  }

  @Get(':id')
  detalle(@Param('id', ParseIntPipe) id: number) {
    return this.service.detalle(id);
  }

  @Patch(':id')
  @Roles(RolEnum.ADMIN, RolEnum.OPERADOR)
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCultivoDto,
    @UsuarioActual() usuario: UsuarioSesion,
  ) {
    return this.service.actualizar(id, dto, usuario);
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles(RolEnum.ADMIN)
  eliminar(@Param('id', ParseIntPipe) id: number, @UsuarioActual() usuario: UsuarioSesion) {
    return this.service.eliminar(id, usuario);
  }

  @Get(':id/umbrales')
  verUmbrales(@Param('id', ParseIntPipe) id: number) {
    return this.service.getUmbrales(id);
  }

  @Put(':id/umbrales')
  @Roles(RolEnum.ADMIN, RolEnum.OPERADOR)
  definirUmbrales(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetUmbralesDto,
    @UsuarioActual() usuario: UsuarioSesion,
  ) {
    return this.service.setUmbrales(id, dto, usuario);
  }
}

@Controller('dispositivos')
export class DispositivoCultivoController {
  constructor(private readonly service: CultivosService) {}

  // El cultivo se guarda en la zona (zona.cultivo_id): afecta a todos los dispositivos de esa zona.
  @Patch(':id/cultivo')
  @Roles(RolEnum.ADMIN, RolEnum.OPERADOR)
  asignar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarCultivoDto,
    @UsuarioActual() usuario: UsuarioSesion,
  ) {
    return this.service.asignarADispositivo(id, dto.cultivo_id, usuario);
  }
}
