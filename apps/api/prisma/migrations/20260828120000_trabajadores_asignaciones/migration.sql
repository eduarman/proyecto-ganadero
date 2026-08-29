-- CreateTable
CREATE TABLE "asignaciones" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "trabajador_id" TEXT NOT NULL,
    "cargo_id" TEXT,
    "potrero_id" TEXT,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asignaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asignaciones_tenant_id_trabajador_id_idx" ON "asignaciones"("tenant_id", "trabajador_id");

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_cargo_id_fkey" FOREIGN KEY ("cargo_id") REFERENCES "cargos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_potrero_id_fkey" FOREIGN KEY ("potrero_id") REFERENCES "potreros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Nunca expuesta vía la API REST de PostgREST/Supabase (ver migración de RLS).
ALTER TABLE "public"."asignaciones" ENABLE ROW LEVEL SECURITY;
