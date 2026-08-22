import { ConflictException } from '@nestjs/common';
import { GanadoImportacionService } from './ganado-importacion.service';

function buildDeps() {
  const ganadoService = { crear: jest.fn() };
  const service = new GanadoImportacionService(ganadoService as any);
  return { service, ganadoService };
}

const TENANT_A = 'tenant-a';

describe('GanadoImportacionService.generarPlantilla', () => {
  it('genera un CSV con cabecera y una fila de ejemplo', async () => {
    const { service } = buildDeps();

    const buffer = await service.generarPlantilla();
    const texto = buffer.toString('utf-8');

    expect(texto).toContain('identificador');
    expect(texto).toContain('especie');
    expect(texto.split('\n').filter((l) => l.trim()).length).toBeGreaterThanOrEqual(2);
  });
});

describe('GanadoImportacionService.importar', () => {
  it('procesa filas válidas e informa las inválidas sin abortar el resto del archivo', async () => {
    const { service, ganadoService } = buildDeps();
    ganadoService.crear
      .mockResolvedValueOnce({ id: 'a1' })
      .mockRejectedValueOnce(
        new ConflictException({ code: 'IDENTIFICADOR_DUPLICADO', message: 'Ya existe un animal con ese identificador.' }),
      )
      .mockResolvedValueOnce({ id: 'a3' });

    const csv = [
      'identificador,especie,sexo,fechaNacimiento,raza,color,pesoNacimiento,madreRefExterna,padreRefExterna,potreroActualId',
      '001,BOVINO,HEMBRA,2023-01-01,Holstein,Negro,35,,,',
      '001,BOVINO,HEMBRA,2023-01-01,Holstein,Negro,35,,,',
      '003,BOVINO,MACHO,,,,,,,',
    ].join('\n');

    const resultado = await service.importar(TENANT_A, Buffer.from(csv, 'utf-8'));

    expect(resultado.creados).toBe(2);
    expect(resultado.errores).toHaveLength(1);
    expect(resultado.errores[0]).toMatchObject({ fila: 3, motivo: expect.stringContaining('identificador') });
    expect(ganadoService.crear).toHaveBeenCalledTimes(3);
  });

  it('rechaza una fila con especie inválida sin llamar a crear()', async () => {
    const { service, ganadoService } = buildDeps();

    const csv = [
      'identificador,especie,sexo,fechaNacimiento,raza,color,pesoNacimiento,madreRefExterna,padreRefExterna,potreroActualId',
      '001,VACA,HEMBRA,,,,,,,',
    ].join('\n');

    const resultado = await service.importar(TENANT_A, Buffer.from(csv, 'utf-8'));

    expect(resultado.creados).toBe(0);
    expect(resultado.errores).toHaveLength(1);
    expect(resultado.errores[0].fila).toBe(2);
    expect(ganadoService.crear).not.toHaveBeenCalled();
  });
});
