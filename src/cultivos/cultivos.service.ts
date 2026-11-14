import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { esViolacionUnique } from '../common/pg-errores.js';
import type { UsuarioSesion } from '../common/usuario-actual.decorator.js';
import { Dispositivo } from '../dispositivos/entities/dispositivo.entity.js';
import { Zona } from '../dispositivos/entities/zona.entity.js';
import { CreateCultivoDto } from './dto/create-cultivo.dto.js';
import { SetUmbralesDto } from './dto/set-umbrales.dto.js';
import { UpdateCultivoDto } from './dto/update-cultivo.dto.js';
import { Cultivo } from './entities/cultivo.entity.js';
import { Umbral } from './entities/umbral.entity.js';
import { Magnitud } from '../mediciones/entities/magnitud.entity.js';

export interface UmbralResumen {
  variable: string;
  minimo: number;
  maximo: number;
}

@Injectable()
export class CultivosService {
  constructor(
    @InjectRepository(Cultivo) private readonly cultivos: Repository<Cultivo>,
    @InjectRepository(Umbral) private readonly umbrales: Repository<Umbral>,
    @InjectRepository(Magnitud) private readonly magnitudes: Repository<Magnitud>,
    @InjectRepository(Zona) private readonly zonas: Repository<Zona>,
    @InjectRepository(Dispositivo) private readonly dispositivos: Repository<Dispositivo>,
  ) {}

  private async validarNombreUnico(nombre: string, ignorarId?: number) {
    // El índice único de la BD es sobre lower(nombre) entre los no eliminados.
    const existente = await this.cultivos
      .createQueryBuilder('c')
      .where('lower(c.nombre) = lower(:nombre) AND c.eliminado = false', { nombre })
      .getOne();
    if (existente && existente.id !== ignorarId) {
      throw new ConflictException(`Ya existe un cultivo llamado "${nombre}"`);
    }
  }

  async crear(dto: CreateCultivoDto, usuario: UsuarioSesion) {
    await this.validarNombreUnico(dto.nombre);
    try {
      return await this.cultivos.save(this.cultivos.create({ ...dto, creadoPor: usuario.id }));
    } catch (e) {
      if (esViolacionUnique(e)) throw new ConflictException(`Ya existe un cultivo llamado "${dto.nombre}"`);
      throw e;
    }
  }

  findAll() {
    return this.cultivos.find({ where: { eliminado: false }, order: { nombre: 'ASC' } });
  }

  async findOne(id: number) {
    const c = await this.cultivos.findOne({ where: { id, eliminado: false } });
    if (!c) throw new NotFoundException(`Cultivo ${id} no existe`);
    return c;
  }

  async detalle(id: number) {
    const cultivo = await this.findOne(id);
    return { ...cultivo, umbrales: await this.umbralesDe(id) };
  }

  async actualizar(id: number, dto: UpdateCultivoDto, usuario: UsuarioSesion) {
    const cultivo = await this.findOne(id);
    if (dto.nombre !== undefined) await this.validarNombreUnico(dto.nombre, id);
    return this.cultivos.save(Object.assign(cultivo, dto, { editadoPor: usuario.id, editadoEn: new Date() }));
  }

  async eliminar(id: number, usuario: UsuarioSesion) {
    await this.findOne(id);
    const asignadas = await this.zonas.count({ where: { cultivoId: id, eliminado: false } });
    if (asignadas > 0) {
      throw new ConflictException(
        `No se puede eliminar: ${asignadas} zona(s) tienen asignado este cultivo. Desasígnalo primero.`,
      );
    }
    await this.cultivos.update({ id }, { eliminado: true, editadoPor: usuario.id, editadoEn: new Date() });
  }

  async getUmbrales(cultivoId: number): Promise<UmbralResumen[]> {
    await this.findOne(cultivoId);
    return this.umbralesDe(cultivoId);
  }

  private async umbralesDe(cultivoId: number): Promise<UmbralResumen[]> {
    const filas = await this.umbrales.find({
      where: { cultivoId, eliminado: false },
      relations: { magnitud: true },
    });
    return filas
      .map((u) => ({ variable: u.magnitud.codigo, minimo: u.minimo, maximo: u.maximo }))
      .sort((a, b) => a.variable.localeCompare(b.variable));
  }

  async setUmbrales(cultivoId: number, dto: SetUmbralesDto, usuario: UsuarioSesion) {
    await this.findOne(cultivoId);

    const vistas = new Set<string>();
    for (const u of dto.umbrales) {
      if (vistas.has(u.variable)) throw new BadRequestException(`Variable repetida: ${u.variable}`);
      vistas.add(u.variable);
      if (u.minimo > u.maximo) {
        throw new BadRequestException(`En "${u.variable}" el mínimo no puede ser mayor que el máximo`);
      }
    }

    const catalogo = await this.magnitudes.find({
      where: { codigo: In([...vistas]), eliminado: false },
    });
    const idPorCodigo = new Map(catalogo.map((m) => [m.codigo, m.id]));
    const desconocidas = [...vistas].filter((v) => !idPorCodigo.has(v));
    if (desconocidas.length > 0) {
      throw new BadRequestException(`Variable(s) desconocida(s): ${desconocidas.join(', ')}`);
    }

    // Reemplaza el conjunto: upsert de los recibidos y borrado lógico de los demás.
    await this.umbrales.manager.transaction(async (m) => {
      const ahora = new Date();
      for (const u of dto.umbrales) {
        const magnitudId = idPorCodigo.get(u.variable)!;
        const existente = await m.findOne(Umbral, { where: { cultivoId, magnitudId } });
        if (existente) {
          Object.assign(existente, {
            minimo: u.minimo,
            maximo: u.maximo,
            eliminado: false,
            editadoPor: usuario.id,
            editadoEn: ahora,
          });
          await m.save(Umbral, existente);
        } else {
          await m.save(
            Umbral,
            m.create(Umbral, { cultivoId, magnitudId, minimo: u.minimo, maximo: u.maximo, creadoPor: usuario.id }),
          );
        }
      }
      await m.update(
        Umbral,
        { cultivoId, magnitudId: Not(In([...idPorCodigo.values()])), eliminado: false },
        { eliminado: true, editadoPor: usuario.id, editadoEn: ahora },
      );
    });
    return this.umbralesDe(cultivoId);
  }

  /** Asigna (o quita, con null) el cultivo de la zona a la que pertenece el dispositivo. */
  async asignarADispositivo(dispositivoId: number, cultivoId: number | null, usuario: UsuarioSesion) {
    const dispositivo = await this.dispositivos.findOne({ where: { id: dispositivoId, eliminado: false } });
    if (!dispositivo) throw new NotFoundException(`Dispositivo ${dispositivoId} no encontrado`);
    if (dispositivo.zonaId === null) {
      throw new BadRequestException('El dispositivo no pertenece a ninguna zona; asígnale una zona primero');
    }
    if (cultivoId !== null) await this.findOne(cultivoId);

    await this.zonas.update(
      { id: dispositivo.zonaId },
      { cultivoId, editadoPor: usuario.id, editadoEn: new Date() },
    );
    return { dispositivo_id: dispositivo.id, zona_id: dispositivo.zonaId, cultivo_id: cultivoId };
  }

  /** Umbrales vigentes para una zona (los del cultivo asignado a ella). */
  async obtenerUmbralesPorZona(zonaId: number | null): Promise<UmbralResumen[]> {
    if (zonaId === null) return [];
    const zona = await this.zonas.findOne({ where: { id: zonaId, eliminado: false } });
    if (!zona || zona.cultivoId === null) return [];
    return this.umbralesDe(zona.cultivoId);
  }
}
