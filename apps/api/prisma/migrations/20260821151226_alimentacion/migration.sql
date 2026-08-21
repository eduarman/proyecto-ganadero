-- CreateEnum
CREATE TYPE "EstadoInsumo" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoPlanAlimentacion" AS ENUM ('PASTOREO', 'SUPLEMENTACION', 'ESTABULADO', 'MIXTO');

-- CreateEnum
CREATE TYPE "EstadoPlanAlimentacion" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "UnidadTiempoPlan" AS ENUM ('DIA', 'SEMANA');

-- CreateEnum
CREATE TYPE "DestinoPlanItem" AS ENUM ('ANIMAL', 'LOTE');

-- CreateTable
CREATE TABLE "insumos_alimentacion" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidad_medida" TEXT NOT NULL,
    "costo_unitario" DECIMAL(10,2),
    "estado" "EstadoInsumo" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insumos_alimentacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planes_alimentacion" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoPlanAlimentacion" NOT NULL,
    "estado" "EstadoPlanAlimentacion" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planes_alimentacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_alimentacion_items" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "insumo_id" TEXT NOT NULL,
    "cantidad" DECIMAL(10,2) NOT NULL,
    "unidad_tiempo" "UnidadTiempoPlan" NOT NULL,
    "por" "DestinoPlanItem" NOT NULL,

    CONSTRAINT "plan_alimentacion_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_asignaciones" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "potrero_id" TEXT,
    "animal_ids" TEXT[],
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_asignaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suministros" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "insumo_id" TEXT NOT NULL,
    "potrero_id" TEXT,
    "animal_ids" TEXT[],
    "cantidad" DECIMAL(10,2) NOT NULL,
    "registrado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suministros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insumos_alimentacion_tenant_id_nombre_key" ON "insumos_alimentacion"("tenant_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "planes_alimentacion_tenant_id_nombre_key" ON "planes_alimentacion"("tenant_id", "nombre");

-- CreateIndex
CREATE INDEX "plan_asignaciones_tenant_id_plan_id_idx" ON "plan_asignaciones"("tenant_id", "plan_id");

-- CreateIndex
CREATE INDEX "suministros_tenant_id_fecha_idx" ON "suministros"("tenant_id", "fecha");

-- AddForeignKey
ALTER TABLE "insumos_alimentacion" ADD CONSTRAINT "insumos_alimentacion_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_alimentacion" ADD CONSTRAINT "planes_alimentacion_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_alimentacion_items" ADD CONSTRAINT "plan_alimentacion_items_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes_alimentacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_alimentacion_items" ADD CONSTRAINT "plan_alimentacion_items_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos_alimentacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_asignaciones" ADD CONSTRAINT "plan_asignaciones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_asignaciones" ADD CONSTRAINT "plan_asignaciones_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes_alimentacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_asignaciones" ADD CONSTRAINT "plan_asignaciones_potrero_id_fkey" FOREIGN KEY ("potrero_id") REFERENCES "potreros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suministros" ADD CONSTRAINT "suministros_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suministros" ADD CONSTRAINT "suministros_insumo_id_fkey" FOREIGN KEY ("insumo_id") REFERENCES "insumos_alimentacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suministros" ADD CONSTRAINT "suministros_potrero_id_fkey" FOREIGN KEY ("potrero_id") REFERENCES "potreros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suministros" ADD CONSTRAINT "suministros_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
