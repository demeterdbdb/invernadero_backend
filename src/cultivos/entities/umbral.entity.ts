import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from 'typeorm';
import { BaseAuditoria } from '../../common/base-auditoria.entity.js';
import { numericTransformer } from '../../common/numeric.transformer.js';
import { Magnitud } from '../../mediciones/entities/magnitud.entity.js';
import { Cultivo } from './cultivo.entity.js';

// Límites de una magnitud (magnitud.codigo, p. ej. temp_aire) para un cultivo.
// Clave primaria compuesta (cultivo_id, magnitud_id), sin id propio.
@Entity('umbral')
export class Umbral extends BaseAuditoria {
  @PrimaryColumn({ name: 'cultivo_id', type: 'int' })
  cultivoId: number;

  @PrimaryColumn({ name: 'magnitud_id', type: 'int' })
  magnitudId: number;

  @Column({ type: 'numeric', transformer: numericTransformer })
  minimo: number;

  @Column({ type: 'numeric', transformer: numericTransformer })
  maximo: number;

  @ManyToOne(() => Cultivo, (c) => c.umbrales)
  @JoinColumn({ name: 'cultivo_id' })
  cultivo: Relation<Cultivo>;

  @ManyToOne(() => Magnitud)
  @JoinColumn({ name: 'magnitud_id' })
  magnitud: Relation<Magnitud>;
}
