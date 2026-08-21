import { FormatoReporte } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { FiltrosReporteDto } from './filtros-reporte.dto';

export class GenerarReporteDto {
  @IsEnum(FormatoReporte)
  formato!: FormatoReporte;

  @IsOptional()
  @ValidateNested()
  @Type(() => FiltrosReporteDto)
  filtros?: FiltrosReporteDto;
}
