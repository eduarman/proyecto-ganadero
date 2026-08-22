import { HttpException, Injectable } from '@nestjs/common';
import { Especie, SexoAnimal } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';
import { CrearAnimalDto } from './dto/crear-animal.dto';
import { GanadoService } from './ganado.service';

const COLUMNAS = [
  'identificador',
  'especie',
  'sexo',
  'fechaNacimiento',
  'raza',
  'color',
  'pesoNacimiento',
  'madreRefExterna',
  'padreRefExterna',
  'potreroActualId',
] as const;

export interface ResultadoImportacion {
  creados: number;
  errores: { fila: number; motivo: string }[];
}

// Por default exceljs intenta inferir tipo por celda (números, fechas), lo
// que rompe identificadores con ceros a la izquierda (ej. "001" -> 1) y
// devuelve fechas como Date en vez de ISO 8601. Con `map` identidad todo
// llega como el string literal del CSV.
const CSV_READ_OPTIONS = { map: (datum: string) => datum };

function extraerMensaje(error: unknown): string {
  if (error instanceof HttpException) {
    const respuesta = error.getResponse();
    if (typeof respuesta === 'string') return respuesta;
    const mensaje = (respuesta as { message?: string | string[] }).message;
    if (Array.isArray(mensaje)) return mensaje.join('; ');
    if (mensaje) return mensaje;
  }
  return error instanceof Error ? error.message : 'Error desconocido.';
}

@Injectable()
export class GanadoImportacionService {
  constructor(private readonly ganadoService: GanadoService) {}

  async generarPlantilla(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('animales');
    sheet.addRow([...COLUMNAS]);
    sheet.addRow(['004829', 'BOVINO', 'HEMBRA', '2023-05-10', 'Holstein', 'Negro', '35', '', '', '']);
    const buffer = await workbook.csv.writeBuffer();
    return Buffer.from(buffer);
  }

  async importar(tenantId: string, archivo: Buffer): Promise<ResultadoImportacion> {
    const workbook = new ExcelJS.Workbook();
    await workbook.csv.read(Readable.from(archivo), CSV_READ_OPTIONS);
    const sheet = workbook.worksheets[0];

    let creados = 0;
    const errores: { fila: number; motivo: string }[] = [];

    for (let fila = 2; fila <= sheet.rowCount; fila++) {
      const row = sheet.getRow(fila);
      if (!Array.isArray(row.values) || row.values.length <= 1) continue;

      const valores = COLUMNAS.reduce<Record<string, string>>((acc, columna, idx) => {
        const celda = row.getCell(idx + 1).text?.trim();
        if (celda) acc[columna] = celda;
        return acc;
      }, {});

      if (Object.keys(valores).length === 0) continue;

      try {
        const dto = plainToInstance(CrearAnimalDto, {
          identificador: valores.identificador,
          especie: valores.especie as Especie,
          sexo: valores.sexo as SexoAnimal,
          fechaNacimiento: valores.fechaNacimiento || undefined,
          raza: valores.raza || undefined,
          color: valores.color || undefined,
          pesoNacimiento: valores.pesoNacimiento ? Number(valores.pesoNacimiento) : undefined,
          madreRefExterna: valores.madreRefExterna || undefined,
          padreRefExterna: valores.padreRefExterna || undefined,
          potreroActualId: valores.potreroActualId || undefined,
        });

        const erroresValidacion = await validate(dto);
        if (erroresValidacion.length > 0) {
          const motivo = erroresValidacion
            .flatMap((e) => Object.values(e.constraints ?? {}))
            .join('; ');
          errores.push({ fila, motivo: motivo || 'Datos inválidos.' });
          continue;
        }

        await this.ganadoService.crear(tenantId, dto);
        creados += 1;
      } catch (error) {
        errores.push({ fila, motivo: extraerMensaje(error) });
      }
    }

    return { creados, errores };
  }
}
