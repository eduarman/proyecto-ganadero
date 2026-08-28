import { ModalidadPago, TipoContratacion } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearTrabajadorDto {
  @IsNotEmpty()
  @MaxLength(100)
  nombres!: string;

  @IsNotEmpty()
  @MaxLength(100)
  apellidos!: string;

  @IsNotEmpty()
  @MaxLength(50)
  documento!: string;

  @IsUUID()
  cargoId!: string;

  @IsDateString()
  fechaIngreso!: string;

  @IsEnum(TipoContratacion)
  tipoContratacion!: TipoContratacion;

  @IsEnum(ModalidadPago)
  modalidadPago!: ModalidadPago;

  @IsNumber()
  @Min(0)
  salarioOJornal!: number;

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
