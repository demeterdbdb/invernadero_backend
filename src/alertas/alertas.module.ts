import { Module } from '@nestjs/common';
import { AlertasService } from './alertas.service.js';

@Module({
  providers: [AlertasService],
  exports: [AlertasService],
})
export class AlertasModule {}
