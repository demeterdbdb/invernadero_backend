import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispositivo } from '../dispositivos/entities/dispositivo.entity.js';
import { Lectura } from '../mediciones/entities/lectura.entity.js';
import { Magnitud } from '../mediciones/entities/magnitud.entity.js';
import { Sensor } from '../mediciones/entities/sensor.entity.js';
import { HistoricoController } from './historico.controller.js';
import { HistoricoService } from './historico.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Lectura, Sensor, Magnitud, Dispositivo])],
  controllers: [HistoricoController],
  providers: [HistoricoService],
})
export class HistoricoModule {}
