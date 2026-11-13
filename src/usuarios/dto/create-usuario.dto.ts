import {RolEnum} from '../entities/usuario.entity.js';

export class CreateUsuarioDto {
    nombre: string;
    correo: string;
    password_hash: string;
    rol?: RolEnum;
}

export class LoginDto{
    correo: string;
    password: string;
}
