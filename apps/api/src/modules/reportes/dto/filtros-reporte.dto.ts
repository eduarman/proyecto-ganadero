import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class FiltrosReporteDto {
  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @IsUUID()
  potreroId?: string;
}
