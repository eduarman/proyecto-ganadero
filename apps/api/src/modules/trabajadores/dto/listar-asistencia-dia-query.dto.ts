import { IsDateString } from 'class-validator';

export class ListarAsistenciaDiaQueryDto {
  @IsDateString()
  fecha!: string;
}
