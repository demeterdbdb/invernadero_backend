import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseAuditoria } from '../../common/base-auditoria.entity.js';

// Valores idénticos al enum tipo_actuador de la base de datos.
export enum TipoActuador {
  VALVULA = 'valvula',
  BOMBA = 'bomba',
  VENTILADOR = 'ventilador',
  LUZ = 'luz',
}

// Tipos de actuador que controlan el riego.
export const TIPOS_RIEGO = [TipoActuador.BOMBA, TipoActuador.VALVULA];

// Valores idénticos al enum estado_actuador de la base de datos.
export enum EstadoActuador {
  ENCENDIDO = 'encendido',
  APAGADO = 'apagado',
  ERROR = 'error',
}

@Entity('actuador')
export class Actuador extends BaseAuditoria {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'BY DEFAULT' })
  id: number;

  @Column({ name: 'dispositivo_id', type: 'int' })
  dispositivoId: number;

  @Column({ type: 'enum', enum: TipoActuador, enumName: 'tipo_actuador' })
  tipo: TipoActuador;

  @Column({ type: 'varchar' })
  nombre: string;

  @Column({
    type: 'enum',
    enum: EstadoActuador,
    enumName: 'estado_actuador',
    default: EstadoActuador.APAGADO,
  })
  estado: EstadoActuador;
}
