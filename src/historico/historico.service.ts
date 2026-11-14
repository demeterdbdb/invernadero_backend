import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { Dispositivo } from '../dispositivos/entities/dispositivo.entity.js';
import { Lectura } from '../mediciones/entities/lectura.entity.js';
import { Magnitud } from '../mediciones/entities/magnitud.entity.js';
import { Sensor } from '../mediciones/entities/sensor.entity.js';
import { GraficaQueryDto, HistorialQueryDto, ResumenQueryDto } from './dto/historico-query.dto.js';

type Filtros = {
  dispositivo_id?: number;
  zona_id?: number;
  variable?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
};

const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const HORA_MS = 3600 * 1000;

@Injectable()
export class HistoricoService {
  private readonly tz: string;

  constructor(private readonly dataSource: DataSource, config: ConfigService) {
    this.tz = config.get<string>('APP_TIMEZONE', 'America/Mexico_City');
  }

// GET Historial
  async historial(q: HistorialQueryDto) {
    this.validarRango(q);
    const qb = this.base(q)
      .select('l.id', 'id')
      .addSelect('l.sensor_id', 'sensor_id')
      .addSelect('d.id', 'dispositivo_id')
      .addSelect('d.zona_id', 'zona_id')
      .addSelect('s.codigo', 'codigo')
      .addSelect('m.codigo', 'magnitud_codigo')
      .addSelect('m.unidad', 'unidad')
      .addSelect('l.valor', 'valor')
      .addSelect('l.fecha_hora', 'fecha_hora')
      .orderBy('l.fecha_hora', 'DESC')
      .addOrderBy('l.id', 'DESC')
      .limit(q.limite ?? 100);
    this.aplicarRango(qb, q);

    const filas = await qb.getRawMany();
    return filas.map((f) => ({ ...f, id: Number(f.id), valor: Number(f.valor) }));
  }

// GET Una medición
  async una(id: string) {
    const fila = await this.base({})
      .select('l.id', 'id')
      .addSelect('l.sensor_id', 'sensor_id')
      .addSelect('d.id', 'dispositivo_id')
      .addSelect('d.nombre', 'dispositivo')
      .addSelect('d.zona_id', 'zona_id')
      .addSelect('s.codigo', 'codigo')
      .addSelect('m.codigo', 'magnitud_codigo')
      .addSelect('m.nombre', 'magnitud')
      .addSelect('m.unidad', 'unidad')
      .addSelect('l.valor', 'valor')
      .addSelect('l.fecha_hora', 'fecha_hora')
      .andWhere('l.id = :id', { id })
      .getRawOne();
    if (!fila) throw new NotFoundException(`Medición ${id} no encontrada`);
    return { ...fila, id: Number(fila.id), valor: Number(fila.valor) };
  }

// GET Grafica
  async grafica(q: GraficaQueryDto) {
    this.validarRango(q);
    const intervalo = q.intervalo ?? 'hora';
    const qb = this.base(q)
      .select(`date_trunc('${this.truncar(intervalo)}', l.fecha_hora, :tz)`, 'periodo')
      .addSelect('ROUND(AVG(l.valor), 2)', 'valor')
      .addSelect('MAX(m.unidad)', 'unidad')
      .addSelect('COUNT(*)', 'muestras')
      .setParameter('tz', this.tz)
      .groupBy('periodo')
      .orderBy('periodo', 'ASC');
    this.aplicarRango(qb, q, intervalo === 'dia' ? 7 * 24 * HORA_MS : 24 * HORA_MS);

    const filas = await qb.getRawMany();
    return filas.map((f) => ({ ...f, valor: Number(f.valor), muestras: Number(f.muestras) }));
  }

// GET resumen
  async resumen(q: ResumenQueryDto) {
    this.validarRango(q);
    const periodo = q.periodo ?? 'dia';
    const qb = this.base(q)
      .select(`date_trunc('${this.truncar(periodo)}', l.fecha_hora, :tz)`, 'periodo')
      .addSelect('s.codigo', 'variable')
      .addSelect('m.nombre', 'magnitud')
      .addSelect('m.unidad', 'unidad')
      .addSelect('ROUND(AVG(l.valor), 2)', 'promedio')
      .addSelect('MAX(l.valor)', 'maximo')
      .addSelect('MIN(l.valor)', 'minimo')
      .addSelect('COUNT(*)', 'muestras')
      .setParameter('tz', this.tz)
      .groupBy('periodo')
      .addGroupBy('s.codigo')
      .addGroupBy('m.nombre')
      .addGroupBy('m.unidad')
      .orderBy('periodo', 'ASC')
      .addOrderBy('s.codigo', 'ASC');
    this.aplicarRango(qb, q, periodo === 'dia' ? 7 * 24 * HORA_MS : 24 * HORA_MS);

    const filas = await qb.getRawMany();
    return filas.map((f) => ({
      ...f,
      promedio: Number(f.promedio),
      maximo: Number(f.maximo),
      minimo: Number(f.minimo),
      muestras: Number(f.muestras),
    }));
  }

// Helpers
  private base(q: Filtros): SelectQueryBuilder<any> {
    const qb = this.dataSource
      .createQueryBuilder()
      .from(Lectura, 'l')
      .innerJoin(Sensor, 's', 's.id = l.sensor_id')
      .innerJoin(Magnitud, 'm', 'm.id = s.magnitud_id')
      .innerJoin(Dispositivo, 'd', 'd.id = s.dispositivo_id')
      .where('l.eliminado = false AND s.eliminado = false AND d.eliminado = false');

    if (q.dispositivo_id) qb.andWhere('d.id = :dis', { dis: q.dispositivo_id });
    if (q.zona_id) qb.andWhere('d.zona_id = :zona', { zona: q.zona_id });
    if (q.variable) qb.andWhere('(s.codigo = :variable OR m.codigo = :variable)', { variable: q.variable });
    return qb;
  }

  private aplicarRango(qb: SelectQueryBuilder<any>, q: Filtros, porDefectoMs?: number) {
    if (q.fecha_inicio) {
      if (SOLO_FECHA.test(q.fecha_inicio)) {
        qb.andWhere('l.fecha_hora >= (CAST(:ini AS date)::timestamp AT TIME ZONE :tzr)', {
          ini: q.fecha_inicio,
          tzr: this.tz,
        });
      } else {
        qb.andWhere('l.fecha_hora >= :ini', { ini: new Date(q.fecha_inicio) });
      }
    } else if (porDefectoMs) {
      qb.andWhere('l.fecha_hora >= :ini', { ini: new Date(Date.now() - porDefectoMs) });
    }

    if (q.fecha_fin) {
      if (SOLO_FECHA.test(q.fecha_fin)) {
        qb.andWhere('l.fecha_hora < ((CAST(:fin AS date) + 1)::timestamp AT TIME ZONE :tzr)', {
          fin: q.fecha_fin,
          tzr: this.tz,
        });
      } else {
        qb.andWhere('l.fecha_hora <= :fin', { fin: new Date(q.fecha_fin) });
      }
    }
  }

  private validarRango(q: Filtros) {
    if (q.fecha_inicio && q.fecha_fin && new Date(q.fecha_inicio) > new Date(q.fecha_fin)) {
      throw new BadRequestException('fecha_inicio no puede ser posterior a fecha_fin');
    }
  }

  private truncar(intervalo: 'hora' | 'dia'): 'hour' | 'day' {
    return intervalo === 'hora' ? 'hour' : 'day';
  }
}
