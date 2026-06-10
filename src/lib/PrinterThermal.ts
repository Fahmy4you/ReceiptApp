import { trackUserPrintActivity } from "@/models/UserStatistic";

export const printImageToThermal = async (device: any, imageSrc: string) => {
  if (!device || !device.gatt.connected) {
    throw new Error("Printer tidak terhubung atau terputus.");
  }

  const server = await device.gatt.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
  const characteristic = await server.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

  const img = new Image();
  img.src = imageSrc;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  // =========================================================================
  // ⚡ PANGKAS TOTAL - SETTINGAN ANTI BATASAN
  // =========================================================================
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const printWidth = 384; 

  if (!ctx) throw new Error("Gagal membuat konteks canvas.");

  const cropLeft = 20; 
  const cropRight = 23; 
  
  // 🛠️ TRIK PAKSA 1: Naikkan angka ini (misal 40, 80, 120) untuk narik gambar naik ke atas secara paksa
  // Ini bakal motong bagian atas gambar secara ekstrem di canvas kalau pelakunya adalah whitespace bawaan gambar.
  const negativeTopCrop = 20; 

  const sourceX = cropLeft;
  const sourceWidth = img.width - cropLeft - cropRight;
  const sourceY = 0;
  const sourceHeight = img.height;

  const scale = printWidth / sourceWidth;
  const contentHeight = sourceHeight * scale;
  
  const marginBottom = 60; 

  canvas.width = printWidth;
  // Kurangi tinggi total canvas dengan potongan paksa agar ukuran kertas pas
  canvas.height = Math.max(10, (contentHeight + marginBottom) - negativeTopCrop);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Putihkan canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Menggambar dengan koordinat Y minus (-negativeTopCrop) untuk mematikan space atas gambar
  ctx.drawImage(
    img,
    sourceX, sourceY, sourceWidth, sourceHeight,
    0, -negativeTopCrop, printWidth, contentHeight
  );

  // Konversi ke Bitmap 1-bit
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const bitmap: number[] = [];
  const THRESHOLD = 180; 

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x += 8) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        const currentX = x + bit;
        if (currentX < canvas.width) {
          const i = (y * canvas.width + currentX) * 4;
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          if (a < 10) continue;
          
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          if (luminance < THRESHOLD) {
            byte |= (0x80 >> bit);
          }
        }
      }
      bitmap.push(byte);
    }
  }

  // =========================================================================
  // 🛠️ TRIK PAKSA 2: BYPASS HEADER (MURNI PERINTAH TEMBAK GAMBAR)
  // =========================================================================
  const widthBytes = canvas.width / 8;
  const heightPixels = canvas.height;

  const header = new Uint8Array([
    0x1D, 0x76, 0x30, 0x00, // GS v 0 (Langsung perintah cetak gambar, NO reset, NO line spacing adjustments)
    widthBytes & 0xFF, (widthBytes >> 8) & 0xFF, 
    heightPixels & 0xFF, (heightPixels >> 8) & 0xFF 
  ]);

  const footer = new Uint8Array([
    0x1B, 0x64, 0x01,       // Jalankan cuma 1 baris kosong di akhir demi kelancaran dinamo
    0x1D, 0x56, 0x00        // Potong / Sobek kertas
  ]);

  const combinedData = new Uint8Array(header.length + bitmap.length + footer.length);
  combinedData.set(header);
  combinedData.set(new Uint8Array(bitmap), header.length);
  combinedData.set(footer, header.length + bitmap.length);

  // Transmisi data (Kunci 8ms lokal kamu)
  const chunkSize = 20; 
  const bytesPerLine = 48; 
  let bytesSentInCurrentLine = 0;

  for (let i = 0; i < combinedData.length; i += chunkSize) {
    const chunk = combinedData.slice(i, i + chunkSize);
    if (characteristic.properties.writeWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk);
      bytesSentInCurrentLine += chunk.length;
      if (bytesSentInCurrentLine >= bytesPerLine) {
        await new Promise(resolve => setTimeout(resolve, 8)); 
        bytesSentInCurrentLine = 0;
      }
    } else {
      await characteristic.writeValue(chunk);
    }
  }

  await trackUserPrintActivity('PRINT');
};
