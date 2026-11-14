import { IsInt, ValidateIf } from 'class-validator';

export class AsignarCultivoDto {
  @ValidateIf((o) => o.cultivo_id !== null)
  @IsInt()
  cultivo_id: number | null;
}
