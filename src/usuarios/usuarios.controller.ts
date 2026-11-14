import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import {Roles} from '../auth/decorators/roles.decorator.js';
import {RolEnum} from './entities/usuario.entity.js';
import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto, EliminarUsuarioDto } from './dto/update-usuario.dto.js';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }
  
  // @Roles(RolEnum.ADMIN || RolEnum.OPERADOR)
  @Roles(RolEnum.ADMIN, RolEnum.OPERADOR)
  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(+id);
  }

  @Roles(RolEnum.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuariosService.update(+id, updateUsuarioDto);
  }

  @Roles(RolEnum.ADMIN)
  @Patch(':id')
  eliminar(@Param('id') id: string) {
    return this.usuariosService.eliminar(+id);
  }
}
