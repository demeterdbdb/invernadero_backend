import {RolEnum} from '../entities/usuario.entity.js';

export class UpdateUsuarioDto {
    nombre: string;
    correo: string;
    password_hash: string;
    rol?: RolEnum;
    activo: boolean;
    editado_por: number;
    editado_en: Date;
}

export class EliminarUsuarioDto {
    eliminado:boolean;
}