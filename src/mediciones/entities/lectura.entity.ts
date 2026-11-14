import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditoria } from '../../common/base-auditoria.entity.js';
import { numericTransformer } from '../../common/numeric.transformer.js';

@Entity('lectura')
export class Lectura extends BaseAuditoria {
  // bigint llega como string desde pg
  @PrimaryGeneratedColumn('identity', { type: 'bigint', generatedIdentity: 'BY DEFAULT' })
  id: string;

  @Column({ name: 'sensor_id', type: 'int' })
  sensorId: number;

  @Column({ type: 'numeric', transformer: numericTransformer })
  valor: number;

  @Column({ name: 'fecha_hora', type: 'timestamptz' })
  fechaHora: Date;
}
