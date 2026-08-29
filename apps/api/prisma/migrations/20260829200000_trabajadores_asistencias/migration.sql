-- CreateEnum
CREATE TYPE "EstadoAsistencia" AS ENUM ('PRESENTE', 'AUSENTE', 'PERMISO', 'VACACIONES', 'FALTA_JUSTIFICADA', 'FALTA_INJUSTIFICADA');

-- CreateTable
CREATE TABLE "asistencias" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "trabajador_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoAsistencia" NOT NULL,
    "hora_entrada" TEXT,
    "hora_salida" TEXT,
    "tipo_jornada" TEXT,
    "jornal_realizado" DECIMAL(5,2),
    "observaciones" TEXT,
    "registrado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asistencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asistencias_tenant_id_trabajador_id_fecha_key" ON "asistencias"("tenant_id", "trabajador_id", "fecha");

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Nunca expuesta vía la API REST de PostgREST/Supabase (ver migración de RLS).
ALTER TABLE "public"."asistencias" ENABLE ROW LEVEL SECURITY;
