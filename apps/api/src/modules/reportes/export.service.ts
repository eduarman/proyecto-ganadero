import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { TIPOS_REPORTE, type DatosReporte } from './reportes.types';

// `puppeteer` es un paquete ESM puro ("type": "module") — un `import`
// estático se compila a `require()` bajo el `module: commonjs` de Nest y
// rompe con ERR_REQUIRE_ESM tanto en runtime como en Jest. El `import()`
// dinámico no se downlevea a `require` y sí lo puede cargar.
async function cargarPuppeteer() {
  return import('puppeteer');
}

function nombreTipo(datos: DatosReporte): string {
  return TIPOS_REPORTE.find((t) => t.tipo === datos.tipo)?.nombre ?? datos.tipo;
}

@Injectable()
export class ExportService {
  async renderXlsx(datos: DatosReporte): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Proyecto Ganadero';
    workbook.created = new Date();

    const resumenSheet = workbook.addWorksheet('Resumen');
    resumenSheet.addRow([nombreTipo(datos)]);
    resumenSheet.addRow([`Generado: ${new Date(datos.generadoEn).toLocaleString('es-ES')}`]);
    resumenSheet.addRow([]);
    for (const [clave, valor] of Object.entries(datos.resumen)) {
      resumenSheet.addRow([clave, valor]);
    }

    for (const tabla of datos.tablas) {
      const nombreHoja = tabla.titulo.slice(0, 31);
      const sheet = workbook.addWorksheet(nombreHoja);
      sheet.addRow(tabla.columnas).font = { bold: true };
      for (const fila of tabla.filas) sheet.addRow(fila);
      sheet.columns.forEach((col) => {
        col.width = 22;
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  renderCsv(datos: DatosReporte): string {
    const filas: string[] = [];
    const celda = (valor: string | number): string => {
      const texto = String(valor);
      return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
    };

    filas.push(celda(nombreTipo(datos)));
    filas.push(celda(`Generado: ${new Date(datos.generadoEn).toLocaleString('es-ES')}`));
    filas.push('');
    for (const [clave, valor] of Object.entries(datos.resumen)) {
      filas.push(`${celda(clave)},${celda(valor)}`);
    }

    for (const tabla of datos.tablas) {
      filas.push('');
      filas.push(celda(tabla.titulo));
      filas.push(tabla.columnas.map(celda).join(','));
      for (const fila of tabla.filas) {
        filas.push(fila.map(celda).join(','));
      }
    }

    return filas.join('\n');
  }

  private renderHtml(datos: DatosReporte): string {
    const filaResumen = Object.entries(datos.resumen)
      .map(([k, v]) => `<tr><td>${k}</td><td><strong>${v}</strong></td></tr>`)
      .join('');

    const tablasHtml = datos.tablas
      .map((tabla) => {
        const filas = tabla.filas
          .map((fila) => `<tr>${fila.map((c) => `<td>${c}</td>`).join('')}</tr>`)
          .join('');
        return `
          <h2>${tabla.titulo}</h2>
          <table>
            <thead><tr>${tabla.columnas.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
            <tbody>${filas}</tbody>
          </table>
        `;
      })
      .join('');

    return `
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; color: #283618; padding: 24px; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            .fecha { font-size: 11px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
            th { background: #f2efdd; }
          </style>
        </head>
        <body>
          <h1>${nombreTipo(datos)}</h1>
          <div class="fecha">Generado: ${new Date(datos.generadoEn).toLocaleString('es-ES')}</div>
          <table><tbody>${filaResumen}</tbody></table>
          ${tablasHtml}
        </body>
      </html>
    `;
  }

  async renderPdf(datos: DatosReporte): Promise<Buffer> {
    const { default: puppeteer } = await cargarPuppeteer();
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.setContent(this.renderHtml(datos), { waitUntil: 'load' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
