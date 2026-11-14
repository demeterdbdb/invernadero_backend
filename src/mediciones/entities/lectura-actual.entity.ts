import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BaseAuditoria } from '../../common/base-auditoria.entity.js';
import { numericTransformer } from '../../common/numeric.transformer.js';

@Entity('lectura_actual')
export class LecturaActual extends BaseAuditoria {
  @PrimaryColumn({ name: 'sensor_id', type: 'int' })
  sensorId: number;

  @Column({ type: 'numeric', transformer: numericTransformer })
  valor: number;

  @Column({ name: 'fecha_hora', type: 'timestamptz' })
  fechaHora: Date;
}
