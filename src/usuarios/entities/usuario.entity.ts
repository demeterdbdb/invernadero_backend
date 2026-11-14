import {Entity, Column, PrimaryGeneratedColumn} from 'typeorm';

export enum RolEnum{
    ADMIN = 'admin',
    OPERADOR = 'operador',
    VISOR = 'visor',
}

@Entity('usuario')
export class Usuario {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({type:'varchar', length: 80})
    nombre: string;
    @Column({type:'varchar', length: 120})
    correo: string;
    @Column({type:'varchar', length: 255})
    password_hash: string;
    // enumName debe coincidir con el tipo enum que ya existe en Supabase.
    @Column({type:'enum', enum: RolEnum, enumName: 'rol_usuario', default: RolEnum.VISOR})
    rol: RolEnum;
    @Column({type:'boolean', default: true})
    activo: boolean;
    @Column({type:'int4', nullable:true})
    creado_por: number;
    @Column({type:'timestamptz', default: () => 'CURRENT_TIMESTAMP'})
    creado_en: Date;
    @Column({type:'int4', nullable:true})
    editado_por: number;
    @Column({type:'timestamptz', nullable:true})
    editado_en: Date;
    @Column({type:'boolean', default: false})
    eliminado: boolean;
}