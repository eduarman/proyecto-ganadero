-- CreateEnum
CREATE TYPE "MonedaTrabajador" AS ENUM ('USD', 'VES');

-- CreateTable
CREATE TABLE "adelantos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "trabajador_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "moneda" "MonedaTrabajador" NOT NULL,
    "tasa_cambio" DECIMAL(12,4),
    "monto_equivalente_usd" DECIMAL(12,2),
    "motivo" TEXT NOT NULL,
    "metodo_entrega" TEXT,
    "observaciones" TEXT,
    "monto_descontado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "registrado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adelantos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestamos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "trabajador_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto_original" DECIMAL(12,2) NOT NULL,
    "moneda" "MonedaTrabajador" NOT NULL,
    "tasa_cambio" DECIMAL(12,4),
    "monto_equivalente_usd" DECIMAL(12,2),
    "numero_cuotas" INTEGER NOT NULL,
    "valor_cuota" DECIMAL(12,2) NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "observaciones" TEXT,
    "registrado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prestamos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestamo_abonos" (
    "id" TEXT NOT NULL,
    "prestamo_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prestamo_abonos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "adelantos_tenant_id_trabajador_id_idx" ON "adelantos"("tenant_id", "trabajador_id");

-- CreateIndex
CREATE INDEX "prestamos_tenant_id_trabajador_id_idx" ON "prestamos"("tenant_id", "trabajador_id");

-- AddForeignKey
ALTER TABLE "adelantos" ADD CONSTRAINT "adelantos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adelantos" ADD CONSTRAINT "adelantos_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adelantos" ADD CONSTRAINT "adelantos_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamo_abonos" ADD CONSTRAINT "prestamo_abonos_prestamo_id_fkey" FOREIGN KEY ("prestamo_id") REFERENCES "prestamos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Nunca expuestas vía la API REST de PostgREST/Supabase (ver migración de RLS).
ALTER TABLE "public"."adelantos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."prestamos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."prestamo_abonos" ENABLE ROW LEVEL SECURITY;
