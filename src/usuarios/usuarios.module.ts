import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service.js';
import { UsuariosController } from './usuarios.controller.js';
import {Usuario} from './entities/usuario.entity.js'

@Module({
  imports: [TypeOrmModule.forFeature([Usuario])],//conexión de entidad al módulo
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports:[UsuariosService],
})
export class UsuariosModule {}
