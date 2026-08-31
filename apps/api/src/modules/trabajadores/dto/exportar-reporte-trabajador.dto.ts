import { IsDateString, IsIn, IsOptional } from 'class-validator';

export type FormatoReporteTrabajador = 'xlsx' | 'pdf' | 'csv';

export class ExportarReporteTrabajadorDto {
  @IsIn(['xlsx', 'pdf', 'csv'])
  formato!: FormatoReporteTrabajador;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;
}
