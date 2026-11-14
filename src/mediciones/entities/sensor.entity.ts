import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditoria } from '../../common/base-auditoria.entity.js';
import { Magnitud } from './magnitud.entity.js';

@Entity('sensor')
export class Sensor extends BaseAuditoria {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Column({ name: 'dispositivo_id', type: 'int' })
  dispositivoId: number;

  @Column({ name: 'magnitud_id', type: 'int' })
  magnitudId: number;

  @Column({ type: 'varchar' })
  codigo: string;

  @Column({ type: 'varchar', nullable: true })
  modelo: string | null;

  @Column({ name: 'cal_seco', type: 'int', nullable: true })
  calSeco: number | null;

  @Column({ name: 'cal_mojado', type: 'int', nullable: true })
  calMojado: number | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @ManyToOne(() => Magnitud)
  @JoinColumn({ name: 'magnitud_id' })
  magnitud: Magnitud;
}
