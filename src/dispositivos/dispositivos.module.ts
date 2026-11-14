import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispositivosController } from './dispositivos.controller.js';
import { DispositivosService } from './dispositivos.service.js';
import { Dispositivo } from './entities/dispositivo.entity.js';
import { Zona } from './entities/zona.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Dispositivo, Zona])],
  controllers: [DispositivosController],
  providers: [DispositivosService],
  exports: [DispositivosService],
})
export class DispositivosModule {}
