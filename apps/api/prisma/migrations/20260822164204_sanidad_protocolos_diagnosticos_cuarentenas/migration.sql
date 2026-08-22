-- CreateEnum
CREATE TYPE "EstadoProtocoloSanitario" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "GravedadDiagnostico" AS ENUM ('LEVE', 'MODERADA', 'GRAVE');

-- CreateTable
CREATE TABLE "protocolos_sanitarios" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "edad_inicio_dias" INTEGER,
    "frecuencia_dias" INTEGER,
    "especie" "Especie",
    "sexo" "SexoAnimal",
    "categoria" TEXT,
    "estado" "EstadoProtocoloSanitario" NOT NULL DEFAULT 'ACTIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocolos_sanitarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosticos_sanitarios" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "condicion" TEXT NOT NULL,
    "gravedad" "GravedadDiagnostico" NOT NULL,
    "tratamiento_aplicacion_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnosticos_sanitarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuarentenas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin_estimada" TIMESTAMP(3),
    "fecha_fin_real" TIMESTAMP(3),
    "motivo" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cuarentenas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "protocolos_sanitarios_tenant_id_estado_idx" ON "protocolos_sanitarios"("tenant_id", "estado");

-- CreateIndex
CREATE INDEX "diagnosticos_sanitarios_tenant_id_animal_id_idx" ON "diagnosticos_sanitarios"("tenant_id", "animal_id");

-- CreateIndex
CREATE INDEX "cuarentenas_tenant_id_animal_id_idx" ON "cuarentenas"("tenant_id", "animal_id");

-- CreateIndex
CREATE INDEX "cuarentenas_tenant_id_activa_idx" ON "cuarentenas"("tenant_id", "activa");

-- AddForeignKey
ALTER TABLE "protocolos_sanitarios" ADD CONSTRAINT "protocolos_sanitarios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocolos_sanitarios" ADD CONSTRAINT "protocolos_sanitarios_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos_sanitarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_sanitarios" ADD CONSTRAINT "diagnosticos_sanitarios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_sanitarios" ADD CONSTRAINT "diagnosticos_sanitarios_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_sanitarios" ADD CONSTRAINT "diagnosticos_sanitarios_tratamiento_aplicacion_id_fkey" FOREIGN KEY ("tratamiento_aplicacion_id") REFERENCES "aplicaciones_sanitarias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuarentenas" ADD CONSTRAINT "cuarentenas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cuarentenas" ADD CONSTRAINT "cuarentenas_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
