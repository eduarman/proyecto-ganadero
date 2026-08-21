-- CreateEnum
CREATE TYPE "TipoReporte" AS ENUM ('INVENTARIO_GANADO', 'NATALIDAD_MORTALIDAD', 'PRODUCCION', 'COSTOS_ALIMENTACION', 'CUMPLIMIENTO_SANITARIO', 'OCUPACION_POTREROS', 'COSTO_VS_PRODUCCION');

-- CreateEnum
CREATE TYPE "FormatoReporte" AS ENUM ('PDF', 'XLSX');

-- CreateEnum
CREATE TYPE "EstadoReporte" AS ENUM ('PENDIENTE', 'GENERANDO', 'LISTO', 'ERROR');

-- CreateTable
CREATE TABLE "reportes_generados" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tipo" "TipoReporte" NOT NULL,
    "filtros_json" JSONB NOT NULL,
    "formato" "FormatoReporte" NOT NULL,
    "estado" "EstadoReporte" NOT NULL DEFAULT 'PENDIENTE',
    "archivo_path" TEXT,
    "error_mensaje" TEXT,
    "solicitado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completado_en" TIMESTAMP(3),

    CONSTRAINT "reportes_generados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reportes_generados_tenant_id_created_at_idx" ON "reportes_generados"("tenant_id", "created_at");

-- AddForeignKey
ALTER TABLE "reportes_generados" ADD CONSTRAINT "reportes_generados_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reportes_generados" ADD CONSTRAINT "reportes_generados_solicitado_por_fkey" FOREIGN KEY ("solicitado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
