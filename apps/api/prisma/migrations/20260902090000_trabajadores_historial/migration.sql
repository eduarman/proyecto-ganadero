-- CreateTable
CREATE TABLE "historial_trabajador" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "trabajador_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "data" JSONB,
    "usuario_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_trabajador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "historial_trabajador_tenant_id_trabajador_id_created_at_idx" ON "historial_trabajador"("tenant_id", "trabajador_id", "created_at");

-- AddForeignKey
ALTER TABLE "historial_trabajador" ADD CONSTRAINT "historial_trabajador_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_trabajador" ADD CONSTRAINT "historial_trabajador_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_trabajador" ADD CONSTRAINT "historial_trabajador_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Nunca expuesta vía la API REST de PostgREST/Supabase (ver migración de RLS).
ALTER TABLE "public"."historial_trabajador" ENABLE ROW LEVEL SECURITY;
