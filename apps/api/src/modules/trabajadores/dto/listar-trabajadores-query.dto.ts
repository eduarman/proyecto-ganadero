import { EstadoTrabajador } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class ListarTrabajadoresQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 20;

  @IsOptional()
  @IsEnum(EstadoTrabajador)
  estado?: EstadoTrabajador;

  @IsOptional()
  @IsUUID()
  cargoId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
