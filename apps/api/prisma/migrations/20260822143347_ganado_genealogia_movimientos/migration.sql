-- AlterTable
ALTER TABLE "animales" ADD COLUMN     "madre_id" TEXT,
ADD COLUMN     "padre_id" TEXT;

-- CreateTable
CREATE TABLE "animal_movimientos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "potrero_origen_id" TEXT,
    "potrero_destino_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "animal_movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "animal_movimientos_tenant_id_animal_id_idx" ON "animal_movimientos"("tenant_id", "animal_id");

-- CreateIndex
CREATE INDEX "animal_movimientos_tenant_id_potrero_destino_id_idx" ON "animal_movimientos"("tenant_id", "potrero_destino_id");

-- AddForeignKey
ALTER TABLE "animales" ADD CONSTRAINT "animales_madre_id_fkey" FOREIGN KEY ("madre_id") REFERENCES "animales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animales" ADD CONSTRAINT "animales_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "animales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_movimientos" ADD CONSTRAINT "animal_movimientos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_movimientos" ADD CONSTRAINT "animal_movimientos_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_movimientos" ADD CONSTRAINT "animal_movimientos_potrero_origen_id_fkey" FOREIGN KEY ("potrero_origen_id") REFERENCES "potreros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_movimientos" ADD CONSTRAINT "animal_movimientos_potrero_destino_id_fkey" FOREIGN KEY ("potrero_destino_id") REFERENCES "potreros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_movimientos" ADD CONSTRAINT "animal_movimientos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
