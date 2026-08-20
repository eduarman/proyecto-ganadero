-- CreateEnum
CREATE TYPE "TurnoOrdenio" AS ENUM ('MANANA', 'TARDE', 'UNICO');

-- CreateTable
CREATE TABLE "registros_leche" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "turno" "TurnoOrdenio" NOT NULL,
    "litros" DECIMAL(6,2) NOT NULL,
    "registrado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_leche_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registros_leche_tenant_id_fecha_idx" ON "registros_leche"("tenant_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "registros_leche_tenant_id_animal_id_fecha_turno_key" ON "registros_leche"("tenant_id", "animal_id", "fecha", "turno");

-- AddForeignKey
ALTER TABLE "registros_leche" ADD CONSTRAINT "registros_leche_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_leche" ADD CONSTRAINT "registros_leche_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_leche" ADD CONSTRAINT "registros_leche_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
