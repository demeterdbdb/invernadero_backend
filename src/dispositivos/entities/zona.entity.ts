import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditoria } from '../../common/base-auditoria.entity.js';

@Entity('zona')
export class Zona extends BaseAuditoria {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Column({ name: 'cultivo_id', type: 'int', nullable: true })
  cultivoId: number | null;

  @Column({ type: 'varchar' })
  nombre: string;
}
