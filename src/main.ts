import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    throw new Error('Falta la variable de entorno JWT_SECRET');
  }

  const app = await NestFactory.create(AppModule);

  // Permite que el frontend (otro dominio) consuma la API.
  // CORS_ORIGIN: lista separada por comas; si no se define, se acepta cualquier origen.
  const origenes = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim());
  app.enableCors({ origin: origenes ?? true });

  // Valida los DTO que usan class-validator (dispositivos, mediciones, riego).
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // Los DTO de usuarios aún no tienen decoradores; esto evita rechazarlos.
      forbidUnknownValues: false,
    }),
  );

  // Render envía SIGTERM al redesplegar: cierra las conexiones a la BD limpiamente.
  app.enableShutdownHooks();

  // Render asigna el puerto en PORT y requiere escuchar en 0.0.0.0.
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
await bootstrap();
