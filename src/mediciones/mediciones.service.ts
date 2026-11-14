import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { AlertasService } from '../alertas/alertas.service.js';
import { DispositivosService } from '../dispositivos/dispositivos.service.js';
import { Dispositivo } from '../dispositivos/entities/dispositivo.entity.js';
import { ActualQueryDto } from './dto/actual-query.dto.js';
import { CreateMedicionDto } from './dto/create-medicion.dto.js';
import { LecturaActual } from './entities/lectura-actual.entity.js';
import { Lectura } from './entities/lectura.entity.js';
import { Magnitud } from './entities/magnitud.entity.js';
import { Sensor } from './entities/sensor.entity.js';

export interface LecturaAceptada {
  sensor: Sensor;
  valor: number;
}

export interface LecturaRechazada {
  codigo: string;
  motivo: string;
}

@Injectable()
export class MedicionesService {
  private readonly logger = new Logger(MedicionesService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Sensor) private readonly sensores: Repository<Sensor>,
    private readonly dispositivos: DispositivosService,
    private readonly alertas: AlertasService,
  ) {}

  async registrar(dto: CreateMedicionDto, apiKey: string | undefined) {
    const dispositivo = await this.dispositivos.autenticarDispositivo(dto.dispositivo_id, apiKey);
    const fecha = dto.fecha_hora ? new Date(dto.fecha_hora) : new Date();

    const sensores = await this.sensores.find({
      where: {
        dispositivoId: dispositivo.id,
        activo: true,
        eliminado: false,
        codigo: In(dto.lecturas.map((l) => l.codigo)),
      },
      relations: { magnitud: true },
    });
    const porCodigo = new Map(sensores.map((s) => [s.codigo, s]));

    const aceptadas: LecturaAceptada[] = [];
    const rechazadas: LecturaRechazada[] = [];
    const vistos = new Set<string>();

    for (const l of dto.lecturas) {
      const sensor = porCodigo.get(l.codigo);
      if (vistos.has(l.codigo)) {
        rechazadas.push({ codigo: l.codigo, motivo: 'Código repetido en la misma medición' });
      } else if (!sensor) {
        rechazadas.push({ codigo: l.codigo, motivo: 'Sensor no registrado o inactivo en este dispositivo' });
      } else if (this.fueraDeRango(l.valor, sensor.magnitud)) {
        const { rangoMin, rangoMax, unidad } = sensor.magnitud;
        rechazadas.push({
          codigo: l.codigo,
          motivo: `Valor fuera del rango físico (${rangoMin ?? '-∞'} a ${rangoMax ?? '∞'} ${unidad})`,
        });
      } else {
        aceptadas.push({ sensor, valor: Math.round(l.valor * 100) / 100 });
      }
      vistos.add(l.codigo);
    }

    if (aceptadas.length === 0) {
      throw new BadRequestException({ message: 'Ninguna lectura válida', rechazadas });
    }

    await this.dataSource.transaction(async (m) => {
      await m.insert(
        Lectura,
        aceptadas.map((a) => ({
          sensorId: a.sensor.id,
          valor: a.valor,
          fechaHora: fecha,
          creadoPor: null,
        })),
      );
      for (const a of aceptadas) {
        await m.query(
          `INSERT INTO lectura_actual (sensor_id, valor, fecha_hora)
           VALUES ($1, $2, $3)
           ON CONFLICT (sensor_id) DO UPDATE
             SET valor = EXCLUDED.valor,
                 fecha_hora = EXCLUDED.fecha_hora,
                 editado_en = now(),
                 eliminado = false
           WHERE lectura_actual.fecha_hora <= EXCLUDED.fecha_hora`,
          [a.sensor.id, a.valor, fecha],
        );
      }
      await m.update(Dispositivo, { id: dispositivo.id }, { ultimaConexion: new Date() });
    });

    try {
      await this.alertas.evaluar({
        dispositivoId: dispositivo.id,
        zonaId: dispositivo.zonaId,
        fechaHora: fecha,
        lecturas: aceptadas.map((a) => ({
          sensorId: a.sensor.id,
          magnitudId: a.sensor.magnitudId,
          codigo: a.sensor.codigo,
          valor: a.valor,
        })),
      });
    } catch (e) {
      this.logger.error(`Falló la evaluación de alertas: ${(e as Error).message}`);
    }

    return {
      dispositivo_id: dispositivo.id,
      fecha_hora: fecha,
      guardadas: aceptadas.length,
      rechazadas,
      intervalo_seg: dispositivo.intervaloSeg,
    };
  }

  async actual(filtros: ActualQueryDto) {
    const qb = this.dataSource
      .createQueryBuilder()
      .select('la.sensor_id', 'sensor_id')
      .addSelect('d.id', 'dispositivo_id')
      .addSelect('d.nombre', 'dispositivo')
      .addSelect('d.zona_id', 'zona_id')
      .addSelect('s.codigo', 'codigo')
      .addSelect('m.codigo', 'magnitud_codigo')
      .addSelect('m.nombre', 'magnitud')
      .addSelect('m.unidad', 'unidad')
      .addSelect('la.valor', 'valor')
      .addSelect('la.fecha_hora', 'fecha_hora')
      .from(LecturaActual, 'la')
      .innerJoin(Sensor, 's', 's.id = la.sensor_id')
      .innerJoin(Magnitud, 'm', 'm.id = s.magnitud_id')
      .innerJoin(Dispositivo, 'd', 'd.id = s.dispositivo_id')
      .where('la.eliminado = false AND s.eliminado = false AND d.eliminado = false')
      .orderBy('d.id', 'ASC')
      .addOrderBy('s.id', 'ASC');

    if (filtros.dispositivo_id) qb.andWhere('d.id = :dis', { dis: filtros.dispositivo_id });
    if (filtros.zona_id) qb.andWhere('d.zona_id = :zona', { zona: filtros.zona_id });

    const filas = await qb.getRawMany<Record<string, unknown> & { valor: string }>();
    return filas.map((f) => ({ ...f, valor: Number(f.valor) }));
  }

  private fueraDeRango(valor: number, m: Magnitud): boolean {
    return (m.rangoMin !== null && valor < m.rangoMin) || (m.rangoMax !== null && valor > m.rangoMax);
  }
}
