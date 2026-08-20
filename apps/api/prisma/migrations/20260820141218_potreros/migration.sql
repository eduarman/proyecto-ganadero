/*
  Warnings:

  - You are about to drop the column `potrero_actual` on the `animales` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EstadoPotrero" AS ENUM ('ACTIVO', 'INACTIVO');

-- AlterTable
ALTER TABLE "animales" DROP COLUMN "potrero_actual",
ADD COLUMN     "potrero_actual_id" TEXT;

-- CreateTable
CREATE TABLE "potreros" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "area_hectareas" DECIMAL(8,2) NOT NULL,
    "tipo_pasto" TEXT,
    "capacidad_carga" DECIMAL(6,2),
    "estado" "EstadoPotrero" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "potreros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "potreros_tenant_id_nombre_key" ON "potreros"("tenant_id", "nombre");

-- AddForeignKey
ALTER TABLE "animales" ADD CONSTRAINT "animales_potrero_actual_id_fkey" FOREIGN KEY ("potrero_actual_id") REFERENCES "potreros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "potreros" ADD CONSTRAINT "potreros_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
