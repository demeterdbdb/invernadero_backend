import { Column, Entity, OneToMany, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { BaseAuditoria } from '../../common/base-auditoria.entity.js';
import { Umbral } from './umbral.entity.js';

@Entity('cultivo')
export class Cultivo extends BaseAuditoria {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id: number;

  @Column({ type: 'varchar', length: 60 })
  nombre: string;

  @OneToMany(() => Umbral, (u) => u.cultivo)
  umbrales: Relation<Umbral[]>;
}
