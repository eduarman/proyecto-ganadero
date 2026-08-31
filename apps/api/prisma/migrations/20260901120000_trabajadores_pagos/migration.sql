-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('SALARIO', 'JORNAL', 'POR_ACTIVIDAD', 'BONO', 'COMISION', 'OTRO');

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "trabajador_id" TEXT NOT NULL,
    "tipo" "TipoPago" NOT NULL,
    "periodo_desde" TIMESTAMP(3) NOT NULL,
    "periodo_hasta" TIMESTAMP(3) NOT NULL,
    "monto_base" DECIMAL(12,2) NOT NULL,
    "bonificaciones" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "adelantos_descontados" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "prestamos_descontados" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otros_descuentos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monto_total" DECIMAL(12,2) NOT NULL,
    "moneda" "MonedaTrabajador" NOT NULL,
    "tasa_cambio" DECIMAL(12,4),
    "monto_equivalente_usd" DECIMAL(12,2),
    "detalle_json" JSONB NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "observaciones" TEXT,
    "confirmado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "prestamo_abonos" ADD COLUMN "pago_id" TEXT;

-- CreateIndex
CREATE INDEX "pagos_tenant_id_trabajador_id_idx" ON "pagos"("tenant_id", "trabajador_id");

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_confirmado_por_fkey" FOREIGN KEY ("confirmado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamo_abonos" ADD CONSTRAINT "prestamo_abonos_pago_id_fkey" FOREIGN KEY ("pago_id") REFERENCES "pagos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Nunca expuesta vía la API REST de PostgREST/Supabase (ver migración de RLS).
ALTER TABLE "public"."pagos" ENABLE ROW LEVEL SECURITY;
