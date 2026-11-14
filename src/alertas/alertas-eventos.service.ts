import { Injectable, MessageEvent } from '@nestjs/common';
import { interval, map, merge, Observable, Subject } from 'rxjs';

export interface EventoAlerta {
  tipo: 'nueva' | 'atendida' | 'eliminada';
  alertaId: string;
}

/**
 * Bus en memoria para el stream SSE. AlertasService.evaluar() emite
 * { tipo: 'nueva', ... } después de insertar una alerta.
 * Solo viajan ids: el cliente pide el detalle con GET /alertas/:id.
 *
 * Límite: vive en el proceso. Con varias instancias del backend haría falta
 * un bus compartido (Redis, o Supabase Realtime).
 */
@Injectable()
export class AlertasEventosService {
  private readonly eventos$ = new Subject<EventoAlerta>();

  emitir(evento: EventoAlerta): void {
    this.eventos$.next(evento);
  }

  /** Flujo de eventos + latido cada 25 s para que los proxies no cierren la conexión. */
  flujo(): Observable<MessageEvent> {
    const eventos = this.eventos$.pipe(
      map((e): MessageEvent => ({ type: e.tipo, data: { alertaId: e.alertaId } })),
    );
    const latido = interval(25_000).pipe(map((): MessageEvent => ({ type: 'ping', data: {} })));
    return merge(eventos, latido);
  }
}
