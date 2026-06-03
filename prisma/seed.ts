import { prisma } from "@/lib/prisma";

async function main() {
  console.log('🌱 Memulai proses seeding database...');

  // 1. SEEDING ROLES (Mengunci ID agar sinkron dengan @default di schema)
  await prisma.rolesUser.upsert({
    where: { role: 'admin' },
    update: {},
    create: { id: 'cl-admin', role: 'admin' },
  });

  await prisma.rolesUser.upsert({
    where: { role: 'user' },
    update: {},
    create: { id: 'cl-user', role: 'user' },
  });

  // 2. SEEDING LICENSES
  await prisma.license.upsert({
    where: { id: 'l-free-tier' },
    update: {},
    create: {
      id: 'l-free-tier',
      name: 'Free Tier',
      description: 'Sempurna untuk mencoba kehebatan fitur dasar StrukApp',
      features: { token_perhari_yang_didapat: "10", maksimal_layout: "3" },
      colorTheme: "border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900",
      buttonTheme: "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white",
      priceMonthly: 0,
      priceYearly: 0,
      discount: 0,
      icon: `<svg className="w-6 h-6 text-slate-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" rx="1" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" /></svg>`
    }
  });
  await prisma.license.upsert({
    where: { id: 'l-silver-tier' },
    update: {},
    create: {
      id: 'l-silver-tier',
      name: 'Silver Tier',
      description: 'Cocok untuk UMKM dengan transaksi harian skala sedang',
      features: { token_perhari_yang_didapat: "30", maksimal_layout: "5" },
      colorTheme: "border-blue-200 dark:border-blue-900/50 text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900",
      buttonTheme: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20",
      priceMonthly: 29000,
      priceYearly: 278000,
      discount: 0,
      icon: `<svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>`
    }
  });
  await prisma.license.upsert({
    where: { id: 'l-gold-tier' },
    update: {},
    create: {
      id: 'l-gold-tier',
      name: 'Gold Tier',
      description: 'Paling populer untuk kasir & ritel profesional tingkat lanjut',
      features: { token_perhari_yang_didapat: "100", maksimal_layout: "10" },
      colorTheme: "border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/40 dark:ring-amber-500/30 text-slate-800 dark:text-zinc-100 bg-amber-50/10 dark:bg-amber-500/[0.02]",
      buttonTheme: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20",
      priceMonthly: 79000,
      priceYearly: 758000,
      discount: 0,
      popular: true,
      icon: `<svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>`
    }
  });
  await prisma.license.upsert({
    where: { id: 'l-platinum-tier' },
    update: {},
    create: {
      id: 'l-platinum-tier',
      name: 'Platinum Tier',
      description: 'Sempurna untuk pengguna yang membutuhkan semua fitur dan dukungan eksklusif',
      features: { token_perhari_yang_didapat: "Unlimited", maksimal_layout: "20" },
      colorTheme: "border-purple-300 dark:border-purple-900/50 text-slate-800 dark:text-zinc-100 bg-white dark:bg-zinc-900",
      buttonTheme: "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20",
      priceMonthly: 149000,
      priceYearly: 1428000,
      discount: 0,
      icon: `<svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4M4 19h4m12-12v4m-2-2h4m-5 9l-3-3m0 0l-3 3m3-3V8m0 0l-3 3m3-3l3 3" /></svg>`
    }
  });

  console.log('✅ Roles dan Lisensi berhasil dibuat.');
}

main()
  .catch((e) => {
    console.error('❌ Gagal menjalankan seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });