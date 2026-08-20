-- CreateEnum
CREATE TYPE "TipoServicio" AS ENUM ('MONTA_NATURAL', 'IA', 'TE');

-- CreateEnum
CREATE TYPE "EstadoServicio" AS ENUM ('PENDIENTE_DIAGNOSTICO', 'CONFIRMADO_PRENADA', 'VACIO');

-- CreateEnum
CREATE TYPE "ResultadoDiagnostico" AS ENUM ('PRENADA', 'VACIA', 'DUDOSO');

-- CreateEnum
CREATE TYPE "MetodoDiagnostico" AS ENUM ('PALPACION', 'ECOGRAFIA', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoParto" AS ENUM ('NORMAL', 'DISTOCICO', 'CESAREA');

-- CreateTable
CREATE TABLE "servicios" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "tipo" "TipoServicio" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "macho_id" TEXT,
    "semen_referencia" TEXT,
    "estado" "EstadoServicio" NOT NULL DEFAULT 'PENDIENTE_DIAGNOSTICO',
    "fecha_estimada_diagnostico" TIMESTAMP(3) NOT NULL,
    "fecha_probable_parto" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnosticos_gestacion" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "servicio_id" TEXT NOT NULL,
    "resultado" "ResultadoDiagnostico" NOT NULL,
    "metodo" "MetodoDiagnostico" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diagnosticos_gestacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "servicio_id" TEXT,
    "madre_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoParto" NOT NULL,
    "cria_animal_id" TEXT,
    "mortinato" BOOLEAN NOT NULL DEFAULT false,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "servicios_tenant_id_animal_id_idx" ON "servicios"("tenant_id", "animal_id");

-- CreateIndex
CREATE INDEX "diagnosticos_gestacion_tenant_id_servicio_id_idx" ON "diagnosticos_gestacion"("tenant_id", "servicio_id");

-- CreateIndex
CREATE UNIQUE INDEX "partos_servicio_id_key" ON "partos"("servicio_id");

-- CreateIndex
CREATE UNIQUE INDEX "partos_cria_animal_id_key" ON "partos"("cria_animal_id");

-- CreateIndex
CREATE INDEX "partos_tenant_id_madre_id_idx" ON "partos"("tenant_id", "madre_id");

-- AddForeignKey
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_macho_id_fkey" FOREIGN KEY ("macho_id") REFERENCES "animales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_gestacion" ADD CONSTRAINT "diagnosticos_gestacion_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnosticos_gestacion" ADD CONSTRAINT "diagnosticos_gestacion_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partos" ADD CONSTRAINT "partos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partos" ADD CONSTRAINT "partos_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partos" ADD CONSTRAINT "partos_madre_id_fkey" FOREIGN KEY ("madre_id") REFERENCES "animales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partos" ADD CONSTRAINT "partos_cria_animal_id_fkey" FOREIGN KEY ("cria_animal_id") REFERENCES "animales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
