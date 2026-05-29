"use server"
import { prisma } from "@/lib/prisma";
import { getDeviceIdentifier } from "@/lib/getDeviceIdentifier"; // Import helper global kamu

export async function trackUserPrintActivity(actionType: 'PDF' | 'IMAGE' | 'PRINT') {
  try {
    // 1. Ambil ID unik perangkat dari cookie browser via helper global
    const deviceId = await getDeviceIdentifier();

    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 2. Cari data statistik perangkat berdasarkan komposit ID & Tanggal hari ini
    const existingStat = await prisma.userStatistic.findUnique({
      where: {
        userId_date: {
          userId: deviceId, // Disinkronkan dengan data string fingerprint perangkat
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
            userId: deviceId,
            date: todayDate,
          },
        },
        data: updateData,
      });
    } 
    
    else {
      // Jika data statistik hari ini belum ada, buat baris baru khusus perangkat ini
      return await prisma.userStatistic.create({
        data: {
          userId: deviceId,
          date: todayDate,
          pdfCount: actionType === 'PDF' ? 1 : 0,
          imageCount: actionType === 'IMAGE' ? 1 : 0,
          directPrintCount: actionType === 'PRINT' ? 1 : 0,
        },
      });
    }
  } catch (error: any) {
    console.error("Gagal mencatat statistik aktivitas cetak:", error.message);
    return error;
  }
}

export async function getUserDashboardStats({ 
  filter = 'semua' 
}: { 
  filter?: 'hari' | 'minggu' | 'bulan' | 'tahun' | 'semua' 
}) {
  const deviceId = await getDeviceIdentifier();

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

    chartStartDate = new Date(now.getFullYear() - 9, 0, 1); // 10 tahun terakhir terhitung tahun ini
  }
  else {
    startDate = undefined; 
    prevStartDate = new Date(now.getFullYear() - 1, 0, 1);
    prevEndDate = new Date(now.getFullYear(), 0, 1);

    chartStartDate = new Date(now.getFullYear() - 4, 0, 1); // Default ringkas: 5 tahun ke belakang untuk mode semua
  }

  // =========================================================
  // 2. QUERY METRIK CARD UTAMA (CURRENT & PREVIOUS)
  // =========================================================
  const currentStats = await prisma.userStatistic.aggregate({
    where: {
      ...(deviceId && { userId: deviceId }),
      ...(startDate && { date: { gte: startDate } }),
    },
    _sum: { pdfCount: true, imageCount: true, directPrintCount: true },
  });

  const currentLayout = await prisma.layout.count({
    where: {
      userId: deviceId,
      ...(startDate && { createdAt: { gte: startDate } }),
    },
  });

  const pdf = currentStats._sum.pdfCount || 0;
  const gambar = currentStats._sum.imageCount || 0;
  const print = currentStats._sum.directPrintCount || 0;
  const totalSemua = pdf + gambar + print;

  let prevPdf = 0, prevGambar = 0, prevPrint = 0;
  if (prevStartDate && prevEndDate) {
    const prevStats = await prisma.userStatistic.aggregate({
      where: {
        ...(deviceId && { userId: deviceId }),
        date: { gte: prevStartDate, lt: prevEndDate },
      },
      _sum: { pdfCount: true, imageCount: true, directPrintCount: true },
    });
    prevPdf = prevStats._sum.pdfCount || 0;
    prevGambar = prevStats._sum.imageCount || 0;
    prevPrint = prevStats._sum.directPrintCount || 0;
  }

  // =========================================================
  // 3. QUERY DATA RAW DARI DATABASE
  // =========================================================
  const rawChartData = await prisma.userStatistic.findMany({
    where: {
      ...(deviceId && { userId: deviceId }),
      date: { gte: chartStartDate },
    },
    orderBy: { date: 'asc' },
  });

  // =========================================================
  // 4. GENERATOR TEMPLATE KOSONG OTOMATIS (SINKRONISASI GRAFIK)
  // =========================================================
  let chartData: Array<{ label: string; pdf: number; gambar: number; print: number; total: number }> = [];

  if (filter === 'hari') {
    // Buat template map untuk 7 hari terakhir berturut-turut
    const dayMap = new Map<string, any>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const labelStr = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      // Simpan format murni tanggal database YYYY-MM-DD sebagai key pencocokan
      const dateKey = d.toISOString().split('T')[0]; 
      dayMap.set(dateKey, { label: labelStr, pdf: 0, gambar: 0, print: 0, total: 0 });
    }

    // Suntikkan data asli database jika ada yang tanggalnya pas
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
    // Template 4 Minggu Terakhir
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
    // Template 12 Bulan Penuh dari Januari s/d Desember Tahun Ini
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
    // Template Tahun (Misal: Ambil jangkauan 5 tahun kebelakang secara berurutan)
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
    
    percentPdf: calculatePercentage(pdf, prevPdf),
    percentGambar: calculatePercentage(gambar, prevGambar),
    percentPrint: calculatePercentage(print, prevPrint),
    
    filterAman: filter,
    chartData
  };
}