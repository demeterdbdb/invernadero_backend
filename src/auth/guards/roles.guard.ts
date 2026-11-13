import {Injectable, CanActivate, ExecutionContext, ForbiddenException} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {roles_key} from '../decorators/roles.decorator.js';
import {RolEnum} from '../../usuarios/entities/usuario.entity.js';
@Injectable()
export class RolesGuard implements CanActivate{
    constructor(private reflector: Reflector){}
    canActivate(context:ExecutionContext):boolean{
        const rolesPermitidos = this.reflector.getAllAndOverride<RolEnum[]>(roles_key,[
            context.getHandler(),
            context.getClass(),
        ]);
        if(!rolesPermitidos){
            return true;
        }
        const {user} = context.switchToHttp().getRequest();
        const tieneRol = rolesPermitidos.some((rol)=>user?.rol === rol);
        if(!tieneRol){
            throw new ForbiddenException('No tienes permisos de administrador para esta acción');
        }
        return true;
    }
}