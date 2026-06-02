import { prisma } from "@/lib/prisma";

async function main() {
  console.log('🌱 Memulai proses seeding database...');

  // 1. SEEDING ROLES (Mengunci ID agar sinkron dengan @default di schema)
  const roleAdmin = await prisma.rolesUser.upsert({
    where: { role: 'admin' },
    update: {},
    create: { id: 'cl-admin', role: 'admin' },
  });

  const roleUser = await prisma.rolesUser.upsert({
    where: { role: 'user' },
    update: {},
    create: { id: 'cl-user', role: 'user' },
  });

  console.log('✅ Roles berhasil dibuat.');
}

main()
  .catch((e) => {
    console.error('❌ Gagal menjalankan seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });