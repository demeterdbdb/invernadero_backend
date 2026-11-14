import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import type { UsuarioSesion } from '../common/usuario-actual.decorator.js';
import { Umbral } from '../cultivos/entities/umbral.entity.js';
import { Zona } from '../dispositivos/entities/zona.entity.js';
import { AlertasEventosService } from './alertas-eventos.service.js';
import { FiltrosAlertaDto } from './dto/filtros-alerta.dto.js';
import { Alerta, NivelAlerta, TipoAlerta } from './entities/alerta.entity.js';

const MAX_RANGO_MS = 90 * 24 * 60 * 60 * 1000;

/** Lecturas recién guardadas que MedicionesService manda a evaluar. */
export interface EvaluacionAlertas {
  dispositivoId: number;
  zonaId: number | null;
  fechaHora: Date;
  lecturas: {
    sensorId: number;
    magnitudId: number;
    codigo: string;
    valor: number;
  }[];
}

/** Forma que ve el cliente (aplana las relaciones). */
function aRespuesta(a: Alerta) {
  return {
    id: a.id,
    tipo: a.tipo,
    nivel: a.nivel,
    mensaje: a.mensaje,
    valor: a.valor,
    limite: a.limite,
    fechaHora: a.fechaHora,
    atendida: a.atendida,
    atendidaEn: a.atendidaEn,
    atendidaPor: a.atendidaPor ? { id: a.atendidaPor.id, nombre: a.atendidaPor.nombre } : null,
    // Cerrada por el sistema porque la condición se normalizó (sin persona).
    cerradaAutomaticamente: a.atendida && a.atendidaPorId === null,
    zona: a.zona ? { id: a.zona.id, nombre: a.zona.nombre } : null,
    sensor: a.sensor
      ? {
          id: a.sensor.id,
          codigo: a.sensor.codigo,
          magnitud: a.sensor.magnitud
            ? {
                codigo: a.sensor.magnitud.codigo,
                nombre: a.sensor.magnitud.nombre,
                unidad: a.sensor.magnitud.unidad,
              }
            : null,
        }
      : null,
  };
}

@Injectable()
export class AlertasService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Alerta) private readonly repo: Repository<Alerta>,
    @InjectRepository(Umbral) private readonly umbrales: Repository<Umbral>,
    @InjectRepository(Zona) private readonly zonas: Repository<Zona>,
    private readonly eventos: AlertasEventosService,
  ) {}

  private consultaBase(m: EntityManager = this.dataSource.manager) {
    return m
      .getRepository(Alerta)
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.zona', 'z')
      .leftJoinAndSelect('a.sensor', 's')
      .leftJoinAndSelect('s.magnitud', 'mg')
      .leftJoinAndSelect('a.atendidaPor', 'u')
      .where('a.eliminado = false');
  }

  // ---------- GET /alertas ----------
  async listar(f: FiltrosAlertaDto) {
    const limite = f.limite ?? 20;

    if (f.desde && f.hasta) {
      const desde = new Date(f.desde).getTime();
      const hasta = new Date(f.hasta).getTime();
      if (hasta < desde) throw new BadRequestException('"hasta" no puede ser anterior a "desde"');
      if (hasta - desde > MAX_RANGO_MS) {
        throw new BadRequestException('El rango máximo de consulta es de 90 días');
      }
    }

    const qb = this.consultaBase().orderBy('a.id', 'DESC').take(limite + 1);

    if (f.atendida !== undefined) qb.andWhere('a.atendida = :atendida', { atendida: f.atendida });
    if (f.nivel) qb.andWhere('a.nivel = :nivel', { nivel: f.nivel });
    if (f.tipo) qb.andWhere('a.tipo = :tipo', { tipo: f.tipo });
    if (f.zonaId) qb.andWhere('a.zonaId = :zonaId', { zonaId: f.zonaId });
    if (f.sensorId) qb.andWhere('a.sensorId = :sensorId', { sensorId: f.sensorId });
    if (f.desde) qb.andWhere('a.fechaHora >= :desde', { desde: f.desde });
    if (f.hasta) qb.andWhere('a.fechaHora <= :hasta', { hasta: f.hasta });
    // Cursor por id (identidad creciente): exacto, sin perder microsegundos de fecha_hora.
    if (f.cursor) qb.andWhere('a.id < :cursor', { cursor: f.cursor });

    const filas = await qb.getMany();
    const hayMas = filas.length > limite;
    const pagina = hayMas ? filas.slice(0, limite) : filas;
    return {
      datos: pagina.map(aRespuesta),
      siguienteCursor: hayMas ? pagina[pagina.length - 1].id : null,
    };
  }

  // ---------- GET /alertas/resumen ----------
  async resumen() {
    const m = this.dataSource.manager;
    const porNivelFilas: { nivel: string; total: number }[] = await m.query(
      `SELECT nivel::text AS nivel, COUNT(*)::int AS total
         FROM alerta WHERE NOT eliminado AND NOT atendida GROUP BY nivel`,
    );
    const porZona: { zonaId: number | null; zona: string | null; total: number }[] = await m.query(
      `SELECT a.zona_id AS "zonaId", z.nombre AS zona, COUNT(*)::int AS total
         FROM alerta a LEFT JOIN zona z ON z.id = a.zona_id
        WHERE NOT a.eliminado AND NOT a.atendida
        GROUP BY a.zona_id, z.nombre ORDER BY total DESC`,
    );

    const porNivel = { info: 0, advertencia: 0, critica: 0 };
    for (const fila of porNivelFilas) porNivel[fila.nivel as keyof typeof porNivel] = fila.total;
    const pendientes = porNivel.info + porNivel.advertencia + porNivel.critica;

    return { pendientes, porNivel, porZona };
  }

  // ---------- GET /alertas/:id ----------
  async obtener(id: string) {
    const alerta = await this.consultaBase().andWhere('a.id = :id', { id }).getOne();
    if (!alerta) throw new NotFoundException('Alerta no encontrada');
    return aRespuesta(alerta);
  }

  // ---------- PATCH /alertas/:id/atender (idempotente) ----------
  async atender(u: UsuarioSesion, id: string) {
    const { alerta, cambio } = await this.dataSource.transaction(async (m) => {
      const r = await this.marcarAtendidas(m, u, [id]);
      const alerta = await this.consultaBase(m).andWhere('a.id = :id', { id }).getOne();
      if (!alerta) throw new NotFoundException('Alerta no encontrada');
      return { alerta, cambio: r.length > 0 };
    });
    // Se emite después del commit, y solo si esta llamada fue la que cambió el estado.
    if (cambio) this.eventos.emitir({ tipo: 'atendida', alertaId: id });
    return aRespuesta(alerta);
  }

  // ---------- POST /alertas/atender (lote) ----------
  async atenderLote(u: UsuarioSesion, ids: string[]) {
    const atendidas = await this.dataSource.transaction((m) => this.marcarAtendidas(m, u, ids));
    for (const alertaId of atendidas) this.eventos.emitir({ tipo: 'atendida', alertaId });
    return { atendidas, omitidas: ids.filter((id) => !atendidas.includes(id)) };
  }

  // ---------- DELETE /alertas/:id (borrado lógico) ----------
  async eliminar(u: UsuarioSesion, id: string) {
    const r = await this.repo
      .createQueryBuilder()
      .update(Alerta)
      .set({ eliminado: true, editadoPor: u.id, editadoEn: () => 'now()' })
      .where('id = :id AND eliminado = false', { id })
      .returning(['id'])
      .execute();
    if ((r.raw as unknown[]).length === 0) throw new NotFoundException('Alerta no encontrada');
    this.eventos.emitir({ tipo: 'eliminada', alertaId: id });
  }

  // ---------- Evaluación de umbrales (la llama MedicionesService) ----------
  /**
   * Compara cada lectura con los umbrales del cultivo asignado a la zona del dispositivo.
   * - Fuera de rango y sin alerta pendiente del mismo tipo → crea una alerta.
   * - Dentro de rango → cierra automáticamente las alertas pendientes de ese sensor.
   */
  async evaluar(ev: EvaluacionAlertas): Promise<void> {
    if (ev.zonaId === null) return;
    const zona = await this.zonas.findOne({ where: { id: ev.zonaId, eliminado: false } });
    if (!zona || zona.cultivoId === null) return;

    const umbrales = await this.umbrales.find({ where: { cultivoId: zona.cultivoId, eliminado: false } });
    const porVariable = new Map(umbrales.map((u) => [u.magnitudId, u]));

    for (const l of ev.lecturas) {
      const umbral = porVariable.get(l.magnitudId);
      if (!umbral) continue;

      const tipo =
        l.valor < umbral.minimo
          ? TipoAlerta.UMBRAL_MINIMO
          : l.valor > umbral.maximo
            ? TipoAlerta.UMBRAL_MAXIMO
            : null;

      const pendientes = await this.repo.find({
        where: { sensorId: l.sensorId, atendida: false, eliminado: false },
      });

      if (tipo === null) {
        for (const p of pendientes) {
          await this.repo.update(
            { id: p.id, atendida: false },
            { atendida: true, atendidaEn: ev.fechaHora, atendidaPorId: null },
          );
          this.eventos.emitir({ tipo: 'atendida', alertaId: p.id });
        }
        continue;
      }

      if (pendientes.some((p) => p.tipo === tipo)) continue;

      const limite = tipo === TipoAlerta.UMBRAL_MINIMO ? umbral.minimo : umbral.maximo;
      const desviacion = Math.abs(l.valor - limite);
      const ancho = umbral.maximo - umbral.minimo;
      const guardada = await this.repo.save(
        this.repo.create({
          zonaId: ev.zonaId,
          sensorId: l.sensorId,
          tipo,
          nivel: desviacion > ancho * 0.25 ? NivelAlerta.CRITICA : NivelAlerta.ADVERTENCIA,
          mensaje: `${l.codigo}: ${l.valor} ${tipo === TipoAlerta.UMBRAL_MINIMO ? 'por debajo del mínimo' : 'por encima del máximo'} (${limite})`.slice(0, 200),
          valor: l.valor,
          limite,
          fechaHora: ev.fechaHora,
        }),
      );
      this.eventos.emitir({ tipo: 'nueva', alertaId: guardada.id });
    }
  }

  /** Solo toca las que siguen pendientes; devuelve los ids realmente actualizados. */
  private async marcarAtendidas(m: EntityManager, u: UsuarioSesion, ids: string[]) {
    const r = await m
      .createQueryBuilder()
      .update(Alerta)
      .set({
        atendida: true,
        atendidaEn: () => 'now()',
        atendidaPorId: u.id,
        editadoPor: u.id,
        editadoEn: () => 'now()',
      })
      .where('id IN (:...ids) AND eliminado = false AND atendida = false', { ids })
      .returning(['id'])
      .execute();
    return (r.raw as { id: string }[]).map((fila) => String(fila.id));
  }
}
