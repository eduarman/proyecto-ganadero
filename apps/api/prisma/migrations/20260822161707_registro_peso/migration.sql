-- CreateTable
CREATE TABLE "registros_peso" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "peso_kg" DECIMAL(7,2) NOT NULL,
    "registrado_por" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_peso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registros_peso_tenant_id_fecha_idx" ON "registros_peso"("tenant_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "registros_peso_tenant_id_animal_id_fecha_key" ON "registros_peso"("tenant_id", "animal_id", "fecha");

-- AddForeignKey
ALTER TABLE "registros_peso" ADD CONSTRAINT "registros_peso_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_peso" ADD CONSTRAINT "registros_peso_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_peso" ADD CONSTRAINT "registros_peso_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
