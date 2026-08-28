-- CreateEnum
CREATE TYPE "EstadoCargo" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoTrabajador" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoContratacion" AS ENUM ('MENSUAL', 'JORNAL', 'POR_ACTIVIDAD', 'TEMPORAL', 'OTRO');

-- CreateEnum
CREATE TYPE "ModalidadPago" AS ENUM ('MENSUAL', 'SEMANAL', 'QUINCENAL', 'DIARIO', 'POR_ACTIVIDAD');

-- CreateTable
CREATE TABLE "cargos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "estado" "EstadoCargo" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cargos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trabajadores" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3),
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "contacto_emergencia_nombre" TEXT,
    "contacto_emergencia_telefono" TEXT,
    "cargo_id" TEXT NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL,
    "tipo_contratacion" "TipoContratacion" NOT NULL,
    "modalidad_pago" "ModalidadPago" NOT NULL,
    "salario_o_jornal" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoTrabajador" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trabajadores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cargos_tenant_id_nombre_key" ON "cargos"("tenant_id", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "trabajadores_tenant_id_documento_key" ON "trabajadores"("tenant_id", "documento");

-- CreateIndex
CREATE INDEX "trabajadores_tenant_id_estado_idx" ON "trabajadores"("tenant_id", "estado");

-- AddForeignKey
ALTER TABLE "cargos" ADD CONSTRAINT "cargos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "cargos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Trabajadores (ver security-roles.md): nunca expuesto vía la API REST de
-- PostgREST/Supabase — mismo criterio que el resto de las tablas de negocio
-- desde la migración de RLS.
ALTER TABLE "public"."cargos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."trabajadores" ENABLE ROW LEVEL SECURITY;
