import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertasModule } from '../alertas/alertas.module.js';
import { DispositivosModule } from '../dispositivos/dispositivos.module.js';
import { LecturaActual } from './entities/lectura-actual.entity.js';
import { Lectura } from './entities/lectura.entity.js';
import { Magnitud } from './entities/magnitud.entity.js';
import { Sensor } from './entities/sensor.entity.js';
import { MedicionesController } from './mediciones.controller.js';
import { MedicionesService } from './mediciones.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sensor, Magnitud, Lectura, LecturaActual]),
    DispositivosModule,
    AlertasModule,
  ],
  controllers: [MedicionesController],
  providers: [MedicionesService],
})
export class MedicionesModule {}
