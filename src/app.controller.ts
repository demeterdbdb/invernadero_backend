import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppService } from './app.service.js';
import { Public } from './auth/decorators/public.decorator.js';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Health check para Render: público y sin datos sensibles.
  @Public()
  @Get('health')
  async health() {
    await this.dataSource.query('SELECT 1');
    return { status: 'ok' };
  }
}
