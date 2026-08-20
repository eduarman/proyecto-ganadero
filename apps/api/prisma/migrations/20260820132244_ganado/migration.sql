-- CreateEnum
CREATE TYPE "Especie" AS ENUM ('BOVINO', 'BUFALINO');

-- CreateEnum
CREATE TYPE "SexoAnimal" AS ENUM ('MACHO', 'HEMBRA');

-- CreateEnum
CREATE TYPE "EstadoAnimal" AS ENUM ('ACTIVO', 'VENDIDO', 'MUERTO', 'EN_TRANSITO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "MotivoBaja" AS ENUM ('VENTA', 'MUERTE', 'TRASLADO', 'OTRO');

-- CreateTable
CREATE TABLE "animales" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "identificador" TEXT NOT NULL,
    "especie" "Especie" NOT NULL,
    "sexo" "SexoAnimal" NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3),
    "categoria" TEXT,
    "raza" TEXT,
    "color" TEXT,
    "peso_nacimiento" DECIMAL(6,2),
    "madre_ref_externa" TEXT,
    "padre_ref_externa" TEXT,
    "foto_url" TEXT,
    "potrero_actual" TEXT,
    "estado" "EstadoAnimal" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_bajas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "motivo" "MotivoBaja" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "observaciones" TEXT,
    "usuario_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "animal_bajas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "animales_tenant_id_estado_idx" ON "animales"("tenant_id", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "animales_tenant_id_identificador_key" ON "animales"("tenant_id", "identificador");

-- CreateIndex
CREATE INDEX "animal_bajas_tenant_id_animal_id_idx" ON "animal_bajas"("tenant_id", "animal_id");

-- AddForeignKey
ALTER TABLE "animales" ADD CONSTRAINT "animales_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_bajas" ADD CONSTRAINT "animal_bajas_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
