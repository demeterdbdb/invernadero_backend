import { Matches } from 'class-validator';

export class AlertaIdParamDto {
  @Matches(/^\d{1,18}$/, { message: 'id debe ser un entero positivo' })
  id: string;
}
