import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import { RolesGuard } from './auth/guards/roles.guard.js';
import { AlertasModule } from './alertas/alertas.module.js';
import { DispositivosModule } from './dispositivos/dispositivos.module.js';
import { MedicionesModule } from './mediciones/mediciones.module.js';
import { RiegoModule } from './riego/riego.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      // En Render no hay archivo .env: las variables vienen del entorno.
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const usarSsl = config.get<string>('DB_SSL', 'true') !== 'false';
        return {
          type: 'postgres' as const,
          // Supabase Session Pooler (puerto 5432, compatible con IPv4 → funciona en Render).
          url: config.get<string>('DATABASE_URL'),
          // Respaldo por si se usan variables separadas en lugar de DATABASE_URL.
          host: config.get<string>('DB_HOST'),
          port: Number(config.get<string>('DB_PORT', '5432')),
          username: config.get<string>('DB_USERNAME'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_NAME'),
          ssl: usarSsl ? { rejectUnauthorized: false } : false,
          // Registra automáticamente las entidades de cada TypeOrmModule.forFeature().
          autoLoadEntities: true,
          // El esquema lo administra Supabase. synchronize:true alteraría/borraría
          // columnas y enums de la BD, por eso queda apagado salvo que se pida.
          synchronize: config.get<string>('DB_SYNC', 'false') === 'true',
          extra: {
            // El Session Pooler limita las conexiones simultáneas del proyecto.
            max: Number(config.get<string>('DB_POOL_MAX', '5')),
            connectionTimeoutMillis: 10_000,
            idleTimeoutMillis: 30_000,
          },
        };
      },
    }),
    UsuariosModule,
    AuthModule,
    DispositivosModule,
    MedicionesModule,
    RiegoModule,
    AlertasModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guards globales: primero se verifica el token JWT y después los roles.
    // Para exceptuar una ruta, usar el decorador @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
