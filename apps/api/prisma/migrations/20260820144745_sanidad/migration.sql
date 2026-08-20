-- CreateEnum
CREATE TYPE "TipoProductoSanitario" AS ENUM ('VACUNA', 'ANTIPARASITARIO', 'MEDICAMENTO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoProductoSanitario" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateTable
CREATE TABLE "productos_sanitarios" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoProductoSanitario" NOT NULL,
    "dosis_recomendada" TEXT,
    "intervalo_refuerzo_dias" INTEGER,
    "estado" "EstadoProductoSanitario" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_sanitarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aplicaciones_sanitarias" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "dosis_aplicada" TEXT,
    "responsable_id" TEXT NOT NULL,
    "proxima_fecha_esperada" TIMESTAMP(3),
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aplicaciones_sanitarias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "productos_sanitarios_tenant_id_nombre_key" ON "productos_sanitarios"("tenant_id", "nombre");

-- CreateIndex
CREATE INDEX "aplicaciones_sanitarias_tenant_id_animal_id_idx" ON "aplicaciones_sanitarias"("tenant_id", "animal_id");

-- CreateIndex
CREATE INDEX "aplicaciones_sanitarias_tenant_id_proxima_fecha_esperada_idx" ON "aplicaciones_sanitarias"("tenant_id", "proxima_fecha_esperada");

-- AddForeignKey
ALTER TABLE "productos_sanitarios" ADD CONSTRAINT "productos_sanitarios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aplicaciones_sanitarias" ADD CONSTRAINT "aplicaciones_sanitarias_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aplicaciones_sanitarias" ADD CONSTRAINT "aplicaciones_sanitarias_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aplicaciones_sanitarias" ADD CONSTRAINT "aplicaciones_sanitarias_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos_sanitarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aplicaciones_sanitarias" ADD CONSTRAINT "aplicaciones_sanitarias_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
