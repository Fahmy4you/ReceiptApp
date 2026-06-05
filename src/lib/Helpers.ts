import { ReceiptElement, SettingsData } from "@/lib/types";
import { Dispatch, SetStateAction } from "react";

export const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) {
    return "Selamat Pagi";
  } else if (hour >= 11 && hour < 15) {
    return "Selamat Siang";
  } else if (hour >= 15 && hour < 18) {
    return "Selamat Sore";
  } else {
    return "Selamat Malam";
  }
};

export const copyToClipboard = async (text: string, setCopied: Dispatch<SetStateAction<boolean>>) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Gagal menyalin teks: ', err);
    }
  };

export const cleanCurrencyInput = (text: string) => {
  const cleanNumber = String(text).replace(/[^0-9]/g, '');
  return cleanNumber === '' || cleanNumber === '0' ? '0' : cleanNumber;
};

export const formatIDR = (val: any) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('id-ID').format(num);
};

export const formatDateIndo = (
  dateInput: Date | string | null | undefined, 
  includeTime: boolean = false
): string => {
  if (!dateInput) return '-';

  // Mengubah ke Date object jika input berupa ISO string dari Prisma
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  // Validasi apakah string tanggal valid
  if (isNaN(date.getTime())) return '-';

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    // Menghilangkan penanda AM/PM agar menggunakan format 24 jam
    options.hour12 = false; 
  }

  // Menggunakan locale 'id-ID' untuk format Indonesia
  const formattedDate = new Intl.DateTimeFormat('id-ID', options).format(date);

  // Jika menyertakan waktu, ganti tanda koma (jika ada) atau sesuaikan format akhir
  if (includeTime) {
    return `${formattedDate.replace(',', '')} WIB`;
  }

  return formattedDate;
};

/**
 * Mengonversi tanggal (String format YYYY-MM-DD atau Objek Date murni) menjadi format Struk (DD-MMM-YYYY)
 * Contoh Input: "2026-04-12", "2026-04-12T04:14:00.000Z", atau new Date()
 * Contoh Hasil: 12-Apr-2026
 */
export const formatReceiptDate = (dateParam: string | Date | null | undefined): string => {
  if (!dateParam) return '-';

  let targetDate: Date;

  // 1. Deteksi jika parameter yang dikirim adalah Objek Date murni
  if (dateParam instanceof Date) {
    targetDate = dateParam;
  } else {
    // Jika berupa string, bersihkan space atau karakter jam sisa (misal sisa format ISO)
    const cleanDateStr = String(dateParam).trim().split(' ')[0];
    targetDate = new Date(cleanDateStr);
  }

  // 2. Validasi apakah objek Date tersebut valid (mencegah "Invalid Date")
  if (isNaN(targetDate.getTime())) {
    // Fallback jika parsing native gagal, coba lakukan pemisahan manual strip (-) khusus format kaku YYYY-MM-DD
    const parts = String(dateParam).split(' ')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      targetDate = new Date(year, monthIndex, day);
      if (isNaN(targetDate.getTime())) return String(dateParam);
    } else {
      return String(dateParam); // Kembalikan string asli jika benar-benar buntu
    }
  }

  // 3. Ambil data tanggal, bulan, dan tahun dari objek Date
  const day = targetDate.getDate();
  const monthIndex = targetDate.getMonth();
  const year = targetDate.getFullYear();

  // Array nama bulan singkatan sesuai pesanan struk kustom kamu
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const monthName = months[monthIndex] || String(monthIndex + 1);
  
  // Memastikan format tanggal selalu 2 digit angka (misal: 05)
  const formattedDay = day < 10 ? `0${day}` : `${day}`;

  return `${formattedDay} ${monthName} ${year}`;
};

export const getReceiptMetadata = (nominal: number, settings: SettingsData) => {
  // 1. Kalkulasi Biaya Admin
  let calculatedAdmin = settings.adminFee.fixedValue;

  if (settings.adminFee.type === 'range') {
    const matchedRange = settings.adminFee.ranges.find((r) => {
      // Pastikan nominal >= min
      const isAboveMin = nominal >= r.min;
      
      // Jika r.max null, anggap benar (unlimited). 
      // Jika tidak null, cek apakah nominal <= r.max
      const isBelowMax = r.max === null || nominal <= r.max;
      
      return isAboveMin && isBelowMax;
    });

    if (matchedRange) {
      calculatedAdmin = matchedRange.fee;
    } else {
      calculatedAdmin = 0;
    }
  } else if (settings.adminFee.type === 'multiplier') {
    // Contoh: tiap kelipatan 10.000 biaya 2.500
    const steps = Math.ceil(nominal / settings.adminFee.multiplier.step);
    calculatedAdmin = steps * settings.adminFee.multiplier.fee;
  }

  // 3. Return Object Gabungan
  return {
    shopName: settings.shopName,
    adminFee: calculatedAdmin,
    reference_set: settings.reference,
    logoPath: settings.logo,
    alamat: settings.alamat,
    totalAmount: nominal + calculatedAdmin, // Bonus: Memudahkan hitung total
  };
};

export const normalizeKey = (label?: string): string => {
  if (!label) return "unknown_field"; // Berikan fallback agar tidak null
  return label.toLowerCase().trim().replace(/\s+/g, '_');
};

interface CalculateReceiptParams {
  config: ReceiptElement[];
  formData: Record<string, any>;
  settings: SettingsData | null;
}

export const calculateReceiptTotal = ({ config, formData, settings }: CalculateReceiptParams) => {
  // 1. Cari field Nominal
  const nominalField = config.find(el => el.dataType === 'Nominal' || el.dataType === 'Currency');
  const nominalKey = nominalField ? normalizeKey(nominalField.label || "") : "nominal";
  let rawStr = (formData[nominalKey] || "").toString().trim()
  if (/,00$/.test(rawStr)) rawStr = rawStr.replace(/,00$/, "")
  rawStr = rawStr.replace(/[^0-9]/g, "")
  const nominalValue = Number(rawStr) || 0
  const nominalValue = Number(rawNominal) || 0;

  // 2. Cari field Admin
  const adminField = config.find(el => el.dataType === 'Admin_Fee');
  const adminKey = adminField ? normalizeKey(adminField.label || "") : "biaya_admin";

  let finalTotal = nominalValue;
  let updates: Record<string, any> = {};

  if (settings) {
    // Panggil metadata terpusat (Di sini logika admin bertingkat/rentang kamu diproses)
    const receiptMeta = getReceiptMetadata(nominalValue, settings);
    
    updates['logo'] = receiptMeta.logoPath;
    updates['reference_set'] = receiptMeta.reference_set;

    // Cek apakah ada input admin manual, jika tidak ada pakai kalkulasi dinamis dari settings DB
    const currentAdminFee = formData[adminKey] !== undefined && formData[adminKey] !== ''
      ? Number(formData[adminKey].toString().replace(/[^0-9]/g, "")) || 0
      : receiptMeta.adminFee;

    // Hitung total akhir berdasarkan sakelar showAdmin
    finalTotal = formData.showAdmin 
        ? nominalValue + currentAdminFee 
        : nominalValue;

    config.forEach((el) => {
        const key = normalizeKey(el.label || "");
        switch (el.dataType) {
            case 'Store_Name':
                updates[key] = receiptMeta.shopName;
                break;
            case 'Admin_Fee':
                updates[key] = formData.showAdmin ? currentAdminFee.toString() : "0";
                break;
            case 'total_keseluruhan':
                updates[key] = finalTotal.toString();
                break;
            case 'Referensi':
                if (receiptMeta.reference_set && receiptMeta.reference_set.type == 'limited') {
                  let value = formData[key] || "-";
                  const limit = receiptMeta.reference_set.digitLimit || 10;
                  if (value !== "-") value = value.slice(-limit);
                  updates[key] = value;
                }
                break;
            case 'Alamat_Toko':
                updates[key] = receiptMeta.alamat || "-";
                break;
        }
    });
  } else {
    // Fallback jika settings tidak ada
    const currentAdminFee = Number(formData[adminKey]) || 0;
    finalTotal = formData.showAdmin ? nominalValue + currentAdminFee : nominalValue;

    config.forEach((el) => {
        const key = normalizeKey(el.label || "");
        switch (el.dataType) {
            case 'Admin_Fee':
                updates[key] = formData.showAdmin ? currentAdminFee.toString() : "0";
                break;
            case 'total_keseluruhan':
                updates[key] = finalTotal.toString();
                break;
        }
    });
  }

  return {
    finalTotal,
    updates
  };
};
