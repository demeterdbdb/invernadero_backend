import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {PassportModule} from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import {UsuariosModule} from '../usuarios/usuarios.module.js'
import { JwtStrategy } from './jwt.strategy.js';

@Module({
  imports: [UsuariosModule,
    PassportModule,
    //crecion de modulo para una firma JWT
    JwtModule.registerAsync({
      imports:[ConfigModule],
      inject:[ConfigService],
      useFactory: async(configService: ConfigService)=>({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions:{expiresIn:'2h'},
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
