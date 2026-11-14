import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditoria } from '../../common/base-auditoria.entity.js';
import { numericTransformer } from '../../common/numeric.transformer.js';

@Entity('magnitud')
export class Magnitud extends BaseAuditoria {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Column({ type: 'varchar', unique: true })
  codigo: string;

  @Column({ type: 'varchar' })
  nombre: string;

  @Column({ type: 'varchar' })
  unidad: string;

  @Column({ name: 'rango_min', type: 'numeric', nullable: true, transformer: numericTransformer })
  rangoMin: number | null;

  @Column({ name: 'rango_max', type: 'numeric', nullable: true, transformer: numericTransformer })
  rangoMax: number | null;
}
