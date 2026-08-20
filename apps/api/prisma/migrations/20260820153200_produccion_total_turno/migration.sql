-- CreateTable
CREATE TABLE "registros_leche_total" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "turno" "TurnoOrdenio" NOT NULL,
    "litros_total" DECIMAL(8,2) NOT NULL,
    "registrado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_leche_total_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registros_leche_total_tenant_id_fecha_idx" ON "registros_leche_total"("tenant_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "registros_leche_total_tenant_id_fecha_turno_key" ON "registros_leche_total"("tenant_id", "fecha", "turno");

-- AddForeignKey
ALTER TABLE "registros_leche_total" ADD CONSTRAINT "registros_leche_total_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_leche_total" ADD CONSTRAINT "registros_leche_total_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
