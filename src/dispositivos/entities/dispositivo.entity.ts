import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditoria } from '../../common/base-auditoria.entity.js';

export enum EstadoDispositivo {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  MANTENIMIENTO = 'mantenimiento',
}

@Entity('dispositivo')
export class Dispositivo extends BaseAuditoria {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Column({ name: 'zona_id', type: 'int', nullable: true })
  zonaId: number | null;

  @Column({ type: 'varchar' })
  nombre: string;

  @Column({ type: 'varchar', unique: true })
  mac: string;

  @Column({ name: 'api_key_hash', type: 'char', length: 64, select: false })
  apiKeyHash: string;

  @Column({ name: 'intervalo_seg', type: 'int', default: 60 })
  intervaloSeg: number;

  @Column({
    type: 'enum',
    enum: EstadoDispositivo,
    enumName: 'estado_dispositivo',
    default: EstadoDispositivo.ACTIVO,
  })
  estado: EstadoDispositivo;

  @Column({ name: 'ultima_conexion', type: 'timestamptz', nullable: true })
  ultimaConexion: Date | null;
}
