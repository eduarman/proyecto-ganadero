-- CreateTable
CREATE TABLE "celos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "celos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destetes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "animal_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "peso_destete" DECIMAL(7,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destetes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "celos_tenant_id_animal_id_idx" ON "celos"("tenant_id", "animal_id");

-- CreateIndex
CREATE UNIQUE INDEX "destetes_tenant_id_animal_id_key" ON "destetes"("tenant_id", "animal_id");

-- AddForeignKey
ALTER TABLE "celos" ADD CONSTRAINT "celos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "celos" ADD CONSTRAINT "celos_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destetes" ADD CONSTRAINT "destetes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "negocios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destetes" ADD CONSTRAINT "destetes_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
