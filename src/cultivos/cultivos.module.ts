import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispositivo } from '../dispositivos/entities/dispositivo.entity.js';
import { Magnitud } from '../mediciones/entities/magnitud.entity.js';
import { Zona } from '../dispositivos/entities/zona.entity.js';
import { CultivosController, DispositivoCultivoController } from './cultivos.controller.js';
import { CultivosService } from './cultivos.service.js';
import { Cultivo } from './entities/cultivo.entity.js';
import { Umbral } from './entities/umbral.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Cultivo, Umbral, Magnitud, Zona, Dispositivo])],
  controllers: [CultivosController, DispositivoCultivoController],
  providers: [CultivosService],
  exports: [CultivosService],
})
export class CultivosModule {}
