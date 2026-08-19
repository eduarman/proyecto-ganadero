import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Catálogo mínimo de planes (.claude/steering/subscriptions.md). Precios y
// límites son placeholders razonables — a ajustar cuando se defina pricing real.
const PLANES = [
  { nombre: 'Plan 1', maxUsuarios: 1, maxNegocios: 1, precioMensual: 19.99 },
  { nombre: 'Plan 2', maxUsuarios: 10, maxNegocios: 1, precioMensual: 49.99 },
  { nombre: 'Plan 3', maxUsuarios: 50, maxNegocios: 5, precioMensual: 99.99 },
];

async function main(): Promise<void> {
  for (const plan of PLANES) {
    await prisma.plan.upsert({
      where: { nombre: plan.nombre },
      update: plan,
      create: plan,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
