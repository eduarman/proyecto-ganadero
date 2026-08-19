import { IsUUID } from 'class-validator';

export class SwitchTenantDto {
  @IsUUID()
  negocioId!: string;
}
