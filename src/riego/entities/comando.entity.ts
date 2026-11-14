import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditoria } from '../../common/base-auditoria.entity.js';
import { Actuador } from './actuador.entity.js';

// Los valores de estos enums son idénticos a los tipos enum de la base de datos.
export enum AccionComando {
  ENCENDER = 'encender',
  APAGAR = 'apagar',
}

export enum OrigenComando {
  MANUAL = 'manual',
  AUTOMATICO = 'automatico',
  PROGRAMADO = 'programado',
}

export enum EstadoComando {
  PENDIENTE = 'pendiente',
  ENVIADO = 'enviado',
  CONFIRMADO = 'confirmado',
  FALLIDO = 'fallido',
}

@Entity('comando_actuador')
export class ComandoActuador extends BaseAuditoria {
  // bigint llega como string desde pg
  @PrimaryGeneratedColumn('identity', { type: 'bigint', generatedIdentity: 'BY DEFAULT' })
  id: string;

  @Column({ name: 'usuario_id', type: 'int', nullable: true })
  usuarioId: number | null;

  @Column({ name: 'actuador_id', type: 'int' })
  actuadorId: number;

  @Column({ type: 'enum', enum: AccionComando, enumName: 'accion_comando' })
  accion: AccionComando;

  @Column({ name: 'duracion_seg', type: 'int', nullable: true })
  duracionSeg: number | null;

  @Column({ type: 'enum', enum: OrigenComando, enumName: 'origen_comando', default: OrigenComando.MANUAL })
  origen: OrigenComando;

  @Column({ type: 'enum', enum: EstadoComando, enumName: 'estado_comando', default: EstadoComando.PENDIENTE })
  estado: EstadoComando;

  @Column({ name: 'confirmado_en', type: 'timestamptz', nullable: true })
  confirmadoEn: Date | null;

  @ManyToOne(() => Actuador)
  @JoinColumn({ name: 'actuador_id' })
  actuador: Actuador;
}
