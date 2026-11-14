import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCultivoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  nombre: string;
}
