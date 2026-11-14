import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Umbral } from '../cultivos/entities/umbral.entity.js';
import { Zona } from '../dispositivos/entities/zona.entity.js';
import { AlertasController } from './alertas.controller.js';
import { AlertasEventosService } from './alertas-eventos.service.js';
import { AlertasService } from './alertas.service.js';
import { Alerta } from './entities/alerta.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Alerta, Umbral, Zona])],
  controllers: [AlertasController],
  providers: [AlertasService, AlertasEventosService],
  // MedicionesModule usa AlertasService.evaluar() al registrar lecturas.
  exports: [AlertasService, AlertasEventosService],
})
export class AlertasModule {}
