import {SetMetadata} from '@nestjs/common';
import {RolEnum} from '../../usuarios/entities/usuario.entity.js';
export const roles_key = 'roles';
export const Roles = (...roles: RolEnum[])=>SetMetadata(roles_key, roles);