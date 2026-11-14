import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditoria } from '../../common/base-auditoria.entity.js';
import { numericTransformer } from '../../common/numeric.transformer.js';
import { Zona } from '../../dispositivos/entities/zona.entity.js';
import { Sensor } from '../../mediciones/entities/sensor.entity.js';
import { Usuario } from '../../usuarios/entities/usuario.entity.js';

export enum NivelAlerta {
  INFO = 'info',
  ADVERTENCIA = 'advertencia',
  CRITICA = 'critica',
}

export enum TipoAlerta {
  UMBRAL_MINIMO = 'umbral_minimo',
  UMBRAL_MAXIMO = 'umbral_maximo',
  SENSOR_FALLO = 'sensor_fallo',
  DISPOSITIVO_OFFLINE = 'dispositivo_offline',
}

@Entity('alerta')
export class Alerta extends BaseAuditoria {
  // bigint: pg lo devuelve como string, igual que los ids de los DTO.
  @PrimaryGeneratedColumn('identity', { type: 'bigint', generatedIdentity: 'ALWAYS' })
  id: string;

  @Column({ name: 'zona_id', type: 'int', nullable: true })
  zonaId: number | null;

  @Column({ name: 'sensor_id', type: 'int', nullable: true })
  sensorId: number | null;

  @Column({ type: 'enum', enum: TipoAlerta, enumName: 'tipo_alerta' })
  tipo: TipoAlerta;

  @Column({ type: 'enum', enum: NivelAlerta, enumName: 'nivel_alerta', default: NivelAlerta.ADVERTENCIA })
  nivel: NivelAlerta;

  @Column({ type: 'varchar', length: 200 })
  mensaje: string;

  @Column({ type: 'numeric', nullable: true, transformer: numericTransformer })
  valor: number | null;

  @Column({ type: 'numeric', nullable: true, transformer: numericTransformer })
  limite: number | null;

  @Column({ name: 'fecha_hora', type: 'timestamptz', default: () => 'now()' })
  fechaHora: Date;

  @Column({ type: 'boolean', default: false })
  atendida: boolean;

  @Column({ name: 'atendida_en', type: 'timestamptz', nullable: true })
  atendidaEn: Date | null;

  @Column({ name: 'atendida_por', type: 'int', nullable: true })
  atendidaPorId: number | null;

  @ManyToOne(() => Zona, { nullable: true })
  @JoinColumn({ name: 'zona_id' })
  zona: Zona | null;

  @ManyToOne(() => Sensor, { nullable: true })
  @JoinColumn({ name: 'sensor_id' })
  sensor: Sensor | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'atendida_por' })
  atendidaPor: Usuario | null;
}
