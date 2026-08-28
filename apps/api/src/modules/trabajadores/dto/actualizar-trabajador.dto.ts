import { ModalidadPago, TipoContratacion } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class ActualizarTrabajadorDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nombres?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apellidos?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  documento?: string;

  @IsOptional()
  @IsUUID()
  cargoId?: string;

  @IsOptional()
  @IsDateString()
  fechaIngreso?: string;

  @IsOptional()
  @IsEnum(TipoContratacion)
  tipoContratacion?: TipoContratacion;

  @IsOptional()
  @IsEnum(ModalidadPago)
  modalidadPago?: ModalidadPago;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salarioOJornal?: number;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  direccion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  contactoEmergenciaNombre?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  contactoEmergenciaTelefono?: string;
}
