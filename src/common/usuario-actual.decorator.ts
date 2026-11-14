import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { RolEnum } from '../usuarios/entities/usuario.entity.js';

// Usuario autenticado que deja JwtStrategy en req.user.
export interface UsuarioSesion {
  id: number;
  userId: number;
  correo: string;
  rol: RolEnum;
}

export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioSesion => {
    const req = ctx.switchToHttp().getRequest<{ user?: UsuarioSesion }>();
    // Sin sesión no hay usuario: nunca se usa un usuario por defecto.
    if (!req.user) {
      throw new UnauthorizedException('Se requiere iniciar sesión');
    }
    return req.user;
  },
);
