-- CreateEnum
CREATE TYPE "FrecuenciaSuministro" AS ENUM ('DIARIA', 'SEMANAL');

-- AlterTable
ALTER TABLE "suministros" ADD COLUMN     "es_recurrente" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurrencia_id" TEXT;

-- CreateTable
CREATE TABLE "suministros_recurrentes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "insumo_id" TEXT NOT NULL,
    "potrero_id" TEXT,
    "animal_ids" TEXT[],
    "cantidad" DECIMAL(10,2) NOT NULL,
    "frecuencia" "FrecuenciaSuministro" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "creado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suministros_recurrentes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "suministros_recurrentes_tenant_id_activo_idx" ON "suministros_recurrentes"("tenant_id", "activo");

-- AddForeignKey
ALTER TABLE "suministros" ADD CONSTRAINT "suministros_recurrencia_id_fkey" FOREIGN KEY ("recurrencia_id") REFERENCES "suministros_recurrentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suministros_recurrentes" ADD CONSTRAINT "suministros_recurrentes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suministros_recurrentes" ADD CONSTRAINT "suministros_recurrentes_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos_alimentacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suministros_recurrentes" ADD CONSTRAINT "suministros_recurrentes_potrero_id_fkey" FOREIGN KEY ("potrero_id") REFERENCES "potreros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suministros_recurrentes" ADD CONSTRAINT "suministros_recurrentes_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
