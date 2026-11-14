import { Injectable, Logger } from '@nestjs/common';

export interface EntradaAlertas {
  dispositivoId: number;
  zonaId: number | null;
  fechaHora: Date;
  lecturas: { sensorId: number; magnitudId: number; codigo: string; valor: number }[];
}

@Injectable()
export class AlertasService {
  private readonly logger = new Logger(AlertasService.name);

  async evaluar(entrada: EntradaAlertas): Promise<void> {
    this.logger.debug(
      `Evaluar alertas: dispositivo ${entrada.dispositivoId}, ${entrada.lecturas.length} lecturas`,
    );
  }
}
