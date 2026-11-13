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
    @Column({type:'enum', enum: RolEnum, default: RolEnum.VISOR})
    rol: RolEnum;
    @Column({type:'boolean', default: true})
    activo: boolean;
    @Column({type:'int4', nullable:true})
    creado_por: number;
    @Column({type:'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    creado_en: Date;
    @Column({type:'int4', nullable:true})
    editado_por: number;
    @Column({type:'timestamp', nullable:true})
    editado_en: Date;
    @Column({type:'boolean', default: false})
    eliminado: boolean;
}