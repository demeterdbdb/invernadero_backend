import { Column, CreateDateColumn } from 'typeorm';

// Columnas de auditoría compartidas por todas las tablas.
export abstract class BaseAuditoria {
  @Column({ name: 'creado_por', type: 'int', nullable: true })
  creadoPor: number | null;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn: Date;

  @Column({ name: 'editado_por', type: 'int', nullable: true })
  editadoPor: number | null;

  @Column({ name: 'editado_en', type: 'timestamptz', nullable: true })
  editadoEn: Date | null;

  @Column({ type: 'boolean', default: false })
  eliminado: boolean;
}
