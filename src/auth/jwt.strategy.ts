//archivo de estrategia que se encarga de validar el token JWT para proteger rutas y recursos en la aplicación
import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy} from 'passport-jwt';
import {ConfigService} from '@nestjs/config';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(configService: ConfigService){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') as string,
        });
    }
    async validate(payload: any){
        // id lo usan dispositivos/riego para auditoría; userId se mantiene por compatibilidad.
        return {id: payload.sub, userId: payload.sub, correo:payload.correo, rol:payload.rol};
    }
}