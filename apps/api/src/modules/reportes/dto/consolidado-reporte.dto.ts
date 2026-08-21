import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { FiltrosReporteDto } from './filtros-reporte.dto';

export class ConsolidadoReporteDto {
  @IsString()
  tipo!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FiltrosReporteDto)
  filtros?: FiltrosReporteDto;
}
