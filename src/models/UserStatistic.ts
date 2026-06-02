"use server"
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function trackUserPrintActivity(actionType: 'PDF' | 'IMAGE' | 'PRINT') {
  const session = await auth();
  if (!session || !session.user?.id) return [];

  const now = new Date();
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const userId = session.user.id;

  const existingStat = await prisma.userStatistic.findUnique({
    where: {
      userId_date: {
        userId: userId,
        date: todayDate,
      },
    },
  });

  if (existingStat) {
    const updateData: any = {};
    if (actionType === 'PDF') updateData.pdfCount = { increment: 1 };
    if (actionType === 'IMAGE') updateData.imageCount = { increment: 1 };
    if (actionType === 'PRINT') updateData.directPrintCount = { increment: 1 };

    return await prisma.userStatistic.update({
      where: {
        userId_date: {
          userId: userId,
          date: todayDate,
        },
      },
      data: updateData,
    });
  } 

  else {
    return await prisma.userStatistic.create({
      data: {
        userId: userId,
        date: todayDate,
        pdfCount: actionType === 'PDF' ? 1 : 0,
        imageCount: actionType === 'IMAGE' ? 1 : 0,
        directPrintCount: actionType === 'PRINT' ? 1 : 0,
      },
    });
  }
}

export async function getUserDashboardStats({ 
  filter = 'semua' 
}: { 
  filter?: 'hari' | 'minggu' | 'bulan' | 'tahun' | 'semua' 
}) {
  const session = await auth();
  let userId: string | null = null;
  let isAdmin = false;

  if (session && session.user?.id) {
    userId = session.user.id ?? null;
    // Cek status admin dari object role baru kamu
    isAdmin = (session.user as any).role?.role === 'admin';
  }

  const now = new Date();
  let startDate: Date | undefined;
  let prevStartDate: Date | undefined;
  let prevEndDate: Date | undefined;
  let chartStartDate: Date;

  // =========================================================
  // 1. ATUR RENTANG WAKTU BERDASARKAN FILTER
  // =========================================================
  if (filter === 'hari') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    prevEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    chartStartDate = new Date();
    chartStartDate.setDate(now.getDate() - 6);
  } 
  else if (filter === 'minggu') {
    startDate = new Date();
    startDate.setDate(now.getDate() - 7);
    prevStartDate = new Date();
    prevStartDate.setDate(now.getDate() - 14);
    prevEndDate = new Date(startDate);

    chartStartDate = new Date();
    chartStartDate.setDate(now.getDate() - 28);
  } 
  else if (filter === 'bulan') {
    startDate = new Date();
    startDate.setDate(now.getDate() - 30);
    prevStartDate = new Date();
    prevStartDate.setDate(now.getDate() - 60);
    prevEndDate = new Date(startDate);

    chartStartDate = new Date(now.getFullYear(), 0, 1);
  } 
  else if (filter === 'tahun') {
    startDate = new Date(now.getFullYear(), 0, 1);
    prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
    prevEndDate = new Date(now.getFullYear(), 0, 1);

    chartStartDate = new Date(now.getFullYear() - 9, 0, 1);
  }
  else {
    startDate = undefined; 
    prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
    prevEndDate = new Date(now.getFullYear(), 0, 1);

    chartStartDate = new Date(now.getFullYear() - 4, 0, 1);
  }

  // =========================================================
  // 2. QUERY METRIK CARD UTAMA (CURRENT & PREVIOUS)
  // =========================================================
  let currentStats;
  let currentLayout;
  let currentUserCount = 0; // Inisialisasi awal metrik baru
  
  if(userId) {
    currentStats = await prisma.userStatistic.aggregate({
      where: {
        ...(userId && { userId: userId }),
        ...(startDate && { date: { gte: startDate } }),
      },
      _sum: { pdfCount: true, imageCount: true, directPrintCount: true },
    });
  
    currentLayout = await prisma.layout.count({
      where: {
        userId: userId,
        ...(startDate && { createdAt: { gte: startDate } }),
      },
    });
  } else {
    currentStats = await prisma.userStatistic.aggregate({
      where: {
        ...(startDate && { date: { gte: startDate } }),
      },
      _sum: { pdfCount: true, imageCount: true, directPrintCount: true },
    });
  
    currentLayout = await prisma.layout.count({
      where: {
        ...(startDate && { createdAt: { gte: startDate } }),
      },
    });
  }

  // QUERY TOTAL USER BARU (Hanya jika login sebagai Admin)
  if (isAdmin) {
    currentUserCount = await prisma.user.count({
      where: {
        ...(startDate && { createdAt: { gte: startDate } }),
      },
    });
  }

  const pdf = currentStats._sum.pdfCount || 0;
  const gambar = currentStats._sum.imageCount || 0;
  const print = currentStats._sum.directPrintCount || 0;
  const totalSemua = pdf + gambar + print;

  let prevPdf = 0, prevGambar = 0, prevPrint = 0;
  let prevUserCount = 0;

  if (prevStartDate && prevEndDate) {
    let prevStats;
    if(userId) {
      prevStats = await prisma.userStatistic.aggregate({
        where: {
          ...(userId && { userId: userId }),
          date: { gte: prevStartDate, lt: prevEndDate },
        },
        _sum: { pdfCount: true, imageCount: true, directPrintCount: true },
      });
    } else {
      prevStats = await prisma.userStatistic.aggregate({
        where: {
          date: { gte: prevStartDate, lt: prevEndDate },
        },
        _sum: { pdfCount: true, imageCount: true, directPrintCount: true },
      });
    }
    prevPdf = prevStats._sum.pdfCount || 0;
    prevGambar = prevStats._sum.imageCount || 0;
    prevPrint = prevStats._sum.directPrintCount || 0;

    // QUERY USER PERIODE SEBELUMNYA (Untuk hitung persentase naik/turun)
    if (isAdmin) {
      prevUserCount = await prisma.user.count({
        where: {
          createdAt: { gte: prevStartDate, lt: prevEndDate },
        },
      });
    }
  }

  // =========================================================
  // 3. QUERY DATA RAW DARI DATABASE (GRAFIK)
  // =========================================================
  const rawChartData = await prisma.userStatistic.findMany({
    where: {
      ...(userId && { userId: userId }),
      date: { gte: chartStartDate },
    },
    orderBy: { date: 'asc' },
  });

  // =========================================================
  // 4. GENERATOR TEMPLATE KOSONG OTOMATIS
  // =========================================================
  let chartData: Array<{ label: string; pdf: number; gambar: number; print: number; total: number }> = [];

  if (filter === 'hari') {
    const dayMap = new Map<string, any>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const labelStr = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      const dateKey = d.toISOString().split('T')[0]; 
      dayMap.set(dateKey, { label: labelStr, pdf: 0, gambar: 0, print: 0, total: 0 });
    }

    rawChartData.forEach(d => {
      const dateKey = new Date(d.date).toISOString().split('T')[0];
      if (dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          label: dayMap.get(dateKey).label,
          pdf: d.pdfCount,
          gambar: d.imageCount,
          print: d.directPrintCount,
          total: d.pdfCount + d.imageCount + d.directPrintCount
        });
      }
    });
    chartData = Array.from(dayMap.values());
  } 
  else if (filter === 'minggu') {
    const weekMap = new Map<string, any>();
    for (let i = 3; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - (i * 7));
      const wNumber = Math.ceil(d.getDate() / 7);
      const mName = d.toLocaleDateString('id-ID', { month: 'short' });
      const key = `W${wNumber} - ${mName}`;
      weekMap.set(key, { label: key, pdf: 0, gambar: 0, print: 0, total: 0 });
    }

    rawChartData.forEach(d => {
      const tgl = new Date(d.date);
      const wNumber = Math.ceil(tgl.getDate() / 7);
      const mName = tgl.toLocaleDateString('id-ID', { month: 'short' });
      const key = `W${wNumber} - ${mName}`;
      
      if (weekMap.has(key)) {
        const current = weekMap.get(key);
        weekMap.set(key, {
          ...current,
          pdf: current.pdf + d.pdfCount,
          gambar: current.gambar + d.imageCount,
          print: current.print + d.directPrintCount,
          total: current.total + d.pdfCount + d.imageCount + d.directPrintCount
        });
      }
    });
    chartData = Array.from(weekMap.values());
  } 
  else if (filter === 'bulan') {
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const monthMap = new Map<string, any>();
    
    monthNames.forEach(mName => {
      monthMap.set(mName, { label: mName, pdf: 0, gambar: 0, print: 0, total: 0 });
    });

    rawChartData.forEach(d => {
      const mName = new Date(d.date).toLocaleDateString('id-ID', { month: 'long' });
      if (monthMap.has(mName)) {
        const current = monthMap.get(mName);
        monthMap.set(mName, {
          ...current,
          pdf: current.pdf + d.pdfCount,
          gambar: current.gambar + d.imageCount,
          print: current.print + d.directPrintCount,
          total: current.total + d.pdfCount + d.imageCount + d.directPrintCount
        });
      }
    });
    chartData = Array.from(monthMap.values());
  } 
  else if (filter === 'tahun' || filter === 'semua') {
    const currentYear = now.getFullYear();
    const yearMap = new Map<string, any>();
    const startYear = filter === 'tahun' ? currentYear - 9 : currentYear - 4;

    for (let y = startYear; y <= currentYear; y++) {
      yearMap.set(y.toString(), { label: y.toString(), pdf: 0, gambar: 0, print: 0, total: 0 });
    }

    rawChartData.forEach(d => {
      const yName = new Date(d.date).getFullYear().toString();
      if (yearMap.has(yName)) {
        const current = yearMap.get(yName);
        yearMap.set(yName, {
          ...current,
          pdf: current.pdf + d.pdfCount,
          gambar: current.gambar + d.imageCount,
          print: current.print + d.directPrintCount,
          total: current.total + d.pdfCount + d.imageCount + d.directPrintCount
        });
      }
    });
    chartData = Array.from(yearMap.values());
  }

  // =========================================================
  // 5. SELESAI & RETURN DATA
  // =========================================================
  const calculatePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0; 
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    totalLayout: currentLayout,                    
    totalPdf: pdf,                 
    totalGambar: gambar,            
    totalPrint: print,      
    totalSemua: totalSemua,
    totalUser: currentUserCount, // Data total user baru yang ditambahkan
    
    percentPdf: calculatePercentage(pdf, prevPdf),
    percentGambar: calculatePercentage(gambar, prevGambar),
    percentPrint: calculatePercentage(print, prevPrint),
    percentUser: calculatePercentage(currentUserCount, prevUserCount), // Data persentase naik/turun user
    
    filterAman: filter,
    chartData
  };
}