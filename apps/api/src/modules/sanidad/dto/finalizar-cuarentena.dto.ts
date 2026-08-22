import { IsDateString, IsOptional } from 'class-validator';

export class FinalizarCuarentenaDto {
  @IsOptional()
  @IsDateString()
  fecha?: string;
}
