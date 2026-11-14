import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { esViolacionUnique } from '../common/pg-errores.js';
import type { UsuarioSesion } from '../common/usuario-actual.decorator.js';
import { CreateDispositivoDto } from './dto/create-dispositivo.dto.js';
import { UpdateDispositivoDto } from './dto/update-dispositivo.dto.js';
import { Dispositivo, EstadoDispositivo } from './entities/dispositivo.entity.js';
import { Zona } from './entities/zona.entity.js';

@Injectable()
export class DispositivosService {
  constructor(
    @InjectRepository(Dispositivo) private readonly repo: Repository<Dispositivo>,
    @InjectRepository(Zona) private readonly zonas: Repository<Zona>,
  ) {}

  async crear(dto: CreateDispositivoDto, usuario: UsuarioSesion) {
    const mac = dto.mac.toUpperCase();
    if (dto.zona_id !== undefined) await this.verificarZona(dto.zona_id);

    const existente = await this.repo.findOne({ where: { mac } });
    if (existente && !existente.eliminado) {
      throw new ConflictException(`Ya existe un dispositivo con la MAC ${mac}`);
    }

    const apiKey = randomBytes(32).toString('hex');
    const datos: Partial<Dispositivo> = {
      zonaId: dto.zona_id ?? null,
      nombre: dto.nombre,
      mac,
      apiKeyHash: this.hashKey(apiKey),
      intervaloSeg: dto.intervalo_seg ?? 60,
      estado: dto.estado ?? EstadoDispositivo.ACTIVO,
    };

    let guardado: Dispositivo;
    try {
      if (existente) {
        // Reactiva un dispositivo eliminado (soft delete) con la misma MAC.
        Object.assign(existente, datos, {
          eliminado: false,
          ultimaConexion: null,
          editadoPor: usuario.id,
          editadoEn: new Date(),
        });
        guardado = await this.repo.save(existente);
      } else {
        guardado = await this.repo.save(this.repo.create({ ...datos, creadoPor: usuario.id }));
      }
    } catch (e) {
      if (esViolacionUnique(e)) throw new ConflictException(`Ya existe un dispositivo con la MAC ${mac}`);
      throw e;
    }

    return {
      ...this.aRespuesta(guardado),
      api_key: apiKey,
      aviso: 'Guarda la api_key ahora: no se volverá a mostrar. Va en el header x-api-key del ESP32.',
    };
  }

  async listar(zonaId?: number) {
    const dispositivos = await this.repo.find({
      where: { eliminado: false, ...(zonaId ? { zonaId } : {}) },
      order: { id: 'ASC' },
    });
    return dispositivos.map((d) => this.aRespuesta(d));
  }

  async obtener(id: number) {
    return this.aRespuesta(await this.buscarEntidad(id));
  }

  async actualizar(id: number, dto: UpdateDispositivoDto, usuario: UsuarioSesion) {
    const d = await this.buscarEntidad(id);

    if (dto.mac) {
      const mac = dto.mac.toUpperCase();
      if (mac !== d.mac) {
        const otro = await this.repo.findOne({ where: { mac } });
        if (otro) throw new ConflictException(`La MAC ${mac} ya está registrada (dispositivo ${otro.id})`);
      }
      d.mac = mac;
    }
    if (dto.zona_id !== undefined) {
      await this.verificarZona(dto.zona_id);
      d.zonaId = dto.zona_id;
    }
    if (dto.nombre !== undefined) d.nombre = dto.nombre;
    if (dto.intervalo_seg !== undefined) d.intervaloSeg = dto.intervalo_seg;
    if (dto.estado !== undefined) d.estado = dto.estado;
    d.editadoPor = usuario.id;
    d.editadoEn = new Date();

    try {
      return this.aRespuesta(await this.repo.save(d));
    } catch (e) {
      if (esViolacionUnique(e)) throw new ConflictException(`La MAC ${d.mac} ya está registrada`);
      throw e;
    }
  }

  async eliminar(id: number, usuario: UsuarioSesion): Promise<void> {
    const d = await this.buscarEntidad(id);
    d.eliminado = true;
    d.estado = EstadoDispositivo.INACTIVO;
    d.editadoPor = usuario.id;
    d.editadoEn = new Date();
    await this.repo.save(d);
  }

  // Autenticación del ESP32 con su api key (header x-api-key).
  async autenticarDispositivo(dispositivoId: number, apiKey: string | undefined): Promise<Dispositivo> {
    const d = await this.repo
      .createQueryBuilder('d')
      .addSelect('d.apiKeyHash')
      .where('d.id = :id AND d.eliminado = false', { id: dispositivoId })
      .getOne();
    if (!d || !apiKey) throw new UnauthorizedException('Dispositivo o api key inválidos');

    const recibido = Buffer.from(this.hashKey(apiKey));
    const guardado = Buffer.from(d.apiKeyHash.trim());
    if (recibido.length !== guardado.length || !timingSafeEqual(recibido, guardado)) {
      throw new UnauthorizedException('Dispositivo o api key inválidos');
    }
    if (d.estado !== EstadoDispositivo.ACTIVO) {
      throw new ForbiddenException(`El dispositivo está ${d.estado}`);
    }
    return d;
  }

  async registrarConexion(dispositivoId: number): Promise<void> {
    await this.repo.update({ id: dispositivoId }, { ultimaConexion: new Date() });
  }

  async buscarEntidad(id: number): Promise<Dispositivo> {
    const d = await this.repo.findOne({ where: { id, eliminado: false } });
    if (!d) throw new NotFoundException(`Dispositivo ${id} no encontrado`);
    return d;
  }

  private async verificarZona(zonaId: number): Promise<void> {
    const existe = await this.zonas.exists({ where: { id: zonaId, eliminado: false } });
    if (!existe) throw new NotFoundException(`La zona ${zonaId} no existe`);
  }

  private hashKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }

  private aRespuesta(d: Dispositivo) {
    return {
      id: d.id,
      zona_id: d.zonaId,
      nombre: d.nombre,
      mac: d.mac,
      intervalo_seg: d.intervaloSeg,
      estado: d.estado,
      ultima_conexion: d.ultimaConexion,
      creado_en: d.creadoEn,
      editado_en: d.editadoEn,
    };
  }
}
