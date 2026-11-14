import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, Matches } from 'class-validator';

export class AtenderAlertasDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @Matches(/^\d{1,18}$/, { each: true, message: 'cada id debe ser un entero positivo' })
  ids: string[];
}
