import { IsDateString, IsOptional } from 'class-validator';

export class FiltrosReporteTrabajadorDto {
  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;
}
