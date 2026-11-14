import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispositivosModule } from '../dispositivos/dispositivos.module.js';
import { Actuador } from './entities/actuador.entity.js';
import { ComandoActuador } from './entities/comando.entity.js';
import { RiegoController } from './riego.controller.js';
import { RiegoService } from './riego.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Actuador, ComandoActuador]), DispositivosModule],
  controllers: [RiegoController],
  providers: [RiegoService],
  exports: [RiegoService],
})
export class RiegoModule {}
