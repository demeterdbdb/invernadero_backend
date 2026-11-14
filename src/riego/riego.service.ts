import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import type { UsuarioSesion } from '../common/usuario-actual.decorator.js';
import { DispositivosService } from '../dispositivos/dispositivos.service.js';
import { CrearComandoDto } from './dto/crear-comando.dto.js';
import { Actuador, EstadoActuador, TIPOS_RIEGO } from './entities/actuador.entity.js';
import { AccionComando, ComandoActuador, EstadoComando, OrigenComando } from './entities/comando.entity.js';

@Injectable()
export class RiegoService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Actuador) private readonly actuadores: Repository<Actuador>,
    @InjectRepository(ComandoActuador) private readonly comandos: Repository<ComandoActuador>,
    private readonly dispositivos: DispositivosService,
  ) {}

  async crearComando(
    accion: AccionComando,
    dto: CrearComandoDto,
    usuario: UsuarioSesion | null,
    origen: OrigenComando = OrigenComando.MANUAL,
  ) {
    if (accion === AccionComando.APAGAR && dto.duracion_seg) {
      throw new BadRequestException('duracion_seg solo aplica al encender');
    }
    await this.dispositivos.buscarEntidad(dto.dispositivo_id);
    const bomba = await this.bombaDe(dto.dispositivo_id);

    const comando = await this.dataSource.transaction(async (m) => {
      if (accion === AccionComando.APAGAR) {
        // Un "apagar" anula los "encender" que el ESP32 aún no recogió.
        // La BD no tiene estado 'cancelado', así que se marcan como 'fallido'.
        await m.update(
          ComandoActuador,
          { actuadorId: bomba.id, accion: AccionComando.ENCENDER, estado: EstadoComando.PENDIENTE },
          { estado: EstadoComando.FALLIDO, editadoPor: usuario?.id ?? null, editadoEn: new Date() },
        );
      }
      return m.save(
        m.create(ComandoActuador, {
          actuadorId: bomba.id,
          accion,
          duracionSeg: dto.duracion_seg ?? null,
          origen,
          usuarioId: usuario?.id ?? null,
          creadoPor: usuario?.id ?? null,
          estado: EstadoComando.PENDIENTE,
        }),
      );
    });

    return this.aRespuesta(comando, bomba.dispositivoId);
  }

  async obtenerEstado(dispositivoId: number) {
    const bomba = await this.bombaDe(dispositivoId);
    const ultimo = await this.comandos.findOne({
      where: { actuadorId: bomba.id, eliminado: false },
      order: { creadoEn: 'DESC', id: 'DESC' },
    });
    const pendientes = await this.comandos.count({
      where: { actuadorId: bomba.id, estado: EstadoComando.PENDIENTE, eliminado: false },
    });
    return {
      dispositivo_id: dispositivoId,
      actuador_id: bomba.id,
      nombre: bomba.nombre,
      estado: bomba.estado,
      comandos_pendientes: pendientes,
      ultimo_comando: ultimo ? this.aRespuesta(ultimo, dispositivoId) : null,
    };
  }

  async obtenerHistorial(dispositivoId?: number, limite = 50) {
    const qb = this.comandos
      .createQueryBuilder('c')
      .innerJoinAndSelect('c.actuador', 'a')
      .where('a.tipo IN (:...tipos)', { tipos: TIPOS_RIEGO })
      .andWhere('c.eliminado = false')
      .orderBy('c.creadoEn', 'DESC')
      .addOrderBy('c.id', 'DESC')
      .take(limite);
    if (dispositivoId) qb.andWhere('a.dispositivoId = :d', { d: dispositivoId });

    const filas = await qb.getMany();
    return filas.map((c) => this.aRespuesta(c, c.actuador.dispositivoId));
  }

  // El ESP32 consulta si hay un comando pendiente y lo marca como enviado.
  async obtenerPendienteParaESP32(dispositivoId: number, apiKey: string | undefined) {
    const dispositivo = await this.dispositivos.autenticarDispositivo(dispositivoId, apiKey);
    await this.dispositivos.registrarConexion(dispositivo.id);
    const bomba = await this.bombaDe(dispositivo.id);

    const comando = await this.comandos.findOne({
      where: { actuadorId: bomba.id, estado: EstadoComando.PENDIENTE, eliminado: false },
      order: { creadoEn: 'ASC', id: 'ASC' },
    });
    if (!comando) return { hay_comando: false, intervalo_seg: dispositivo.intervaloSeg };

    // Update condicional: evita entregar el mismo comando dos veces.
    const r = await this.comandos.update(
      { id: comando.id, estado: EstadoComando.PENDIENTE },
      { estado: EstadoComando.ENVIADO, editadoEn: new Date() },
    );
    if (!r.affected) return { hay_comando: false, intervalo_seg: dispositivo.intervaloSeg };

    comando.estado = EstadoComando.ENVIADO;
    return {
      hay_comando: true,
      intervalo_seg: dispositivo.intervaloSeg,
      comando: this.aRespuesta(comando, dispositivo.id),
    };
  }

  async confirmarComando(id: string, ejecutado: boolean, apiKey: string | undefined) {
    const comando = await this.comandos.findOne({
      where: { id, eliminado: false },
      relations: { actuador: true },
    });
    if (!comando) throw new NotFoundException('Comando no encontrado');

    const dispositivoId = comando.actuador.dispositivoId;
    await this.dispositivos.autenticarDispositivo(dispositivoId, apiKey);

    if (comando.estado !== EstadoComando.ENVIADO) {
      throw new BadRequestException(`El comando está en estado '${comando.estado}', no se puede confirmar`);
    }

    const ahora = new Date();
    const nuevoEstado = ejecutado ? EstadoComando.CONFIRMADO : EstadoComando.FALLIDO;

    await this.dataSource.transaction(async (m) => {
      const r = await m.update(
        ComandoActuador,
        { id: comando.id, estado: EstadoComando.ENVIADO },
        { estado: nuevoEstado, confirmadoEn: ahora, editadoEn: ahora },
      );
      if (!r.affected) throw new ConflictException('El comando ya fue confirmado');

      if (ejecutado) {
        await m.update(
          Actuador,
          { id: comando.actuadorId },
          {
            estado: comando.accion === AccionComando.ENCENDER ? EstadoActuador.ENCENDIDO : EstadoActuador.APAGADO,
            editadoEn: ahora,
          },
        );
      }
    });

    await this.dispositivos.registrarConexion(dispositivoId);
    comando.estado = nuevoEstado;
    comando.confirmadoEn = ahora;
    return this.aRespuesta(comando, dispositivoId);
  }

  private async bombaDe(dispositivoId: number): Promise<Actuador> {
    const bomba = await this.actuadores.findOne({
      where: { dispositivoId, tipo: In(TIPOS_RIEGO), eliminado: false },
      order: { id: 'ASC' },
    });
    if (!bomba) throw new NotFoundException('Ese dispositivo no tiene actuador de riego (bomba o válvula)');
    return bomba;
  }

  private aRespuesta(c: ComandoActuador, dispositivoId: number) {
    return {
      id: c.id,
      dispositivo_id: dispositivoId,
      actuador_id: c.actuadorId,
      accion: c.accion,
      duracion_seg: c.duracionSeg,
      origen: c.origen,
      estado: c.estado,
      usuario_id: c.usuarioId,
      creado_en: c.creadoEn,
      confirmado_en: c.confirmadoEn,
    };
  }
}
