import { trackUserPrintActivity } from "@/models/UserStatistic";

export const printImageToThermal = async (device: any, imageSrc: string) => {
  if (!device || !device.gatt.connected) {
    throw new Error("Printer tidak terhubung atau terputus.");
  }

  const server = await device.gatt.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
  const characteristic = await server.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

  // 1. Load gambar ke dalam element HTML Image
  const img = new Image();
  img.src = imageSrc;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  // 2. Setup Canvas dengan Pangkas Margin Aman & Potong Padding Atas 20px
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const printWidth = 384; 

  if (!ctx) throw new Error("Gagal membuat konteks canvas.");

  const cropLeft = 20; 
  const cropRight = 23; 
  const sourceX = cropLeft;
  const sourceWidth = img.width - cropLeft - cropRight;

  const cropTop = 20; 
  const sourceY = cropTop;
  const sourceHeight = img.height - cropTop; 

  const scale = printWidth / sourceWidth;
  canvas.width = printWidth;
  canvas.height = sourceHeight * scale;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(
    img,
    sourceX, sourceY, sourceWidth, sourceHeight,
    0, 0, canvas.width, canvas.height
  );

  // 3. Konversi gambar ke format Bitmap 1-bit dengan KONTRAST EKSTRIM
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

          if (a < 10) {
            continue;
          }
          
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          
          if (luminance < THRESHOLD) {
            byte |= (0x80 >> bit);
          }
        }
      }
      bitmap.push(byte);
    }
  }

  // 4. Siapkan perintah ESC/POS (Murni standard bawaan kamu yang aman)
  const widthBytes = canvas.width / 8;
  const heightPixels = canvas.height;

  const header = new Uint8Array([
    0x10, 0x14, 0x01,       
    0x1B, 0x40,             
    0x1B, 0x61, 0x01,       
    0x1D, 0x76, 0x30, 0x00, 
    widthBytes & 0xFF, (widthBytes >> 8) & 0xFF, 
    heightPixels & 0xFF, (heightPixels >> 8) & 0xFF 
  ]);

  const footer = new Uint8Array([
    0x1B, 0x64, 0x05, 
    0x1D, 0x56, 0x00  
  ]);

  const combinedData = new Uint8Array(header.length + bitmap.length + footer.length);
  combinedData.set(header);
  combinedData.set(new Uint8Array(bitmap), header.length);
  combinedData.set(footer, header.length + bitmap.length);

  // =========================================================================
  // ⚡ 5. PROSES TRANSMISI HIGH-SPEED & ANTI-CRASH (OPTIMIZED THROTTLE)
  // =========================================================================
  const chunkSize = 20; 
  const bytesPerLine = 48; // Lebar 1 baris kertas printer 58mm (384px / 8)
  let bytesSentInCurrentLine = 0;

  // Optimasi: Cek properti di luar loop biar gak ngetes kondisi ribuan kali
  if (characteristic.properties.writeWithoutResponse) {
    for (let i = 0; i < combinedData.length; i += chunkSize) {
      const chunk = combinedData.slice(i, i + chunkSize);
      await characteristic.writeValueWithoutResponse(chunk);
      
      bytesSentInCurrentLine += chunk.length;
      
      // Begitu data 1 baris selesai dikirim, kasih jeda napas tipis
      if (bytesSentInCurrentLine >= bytesPerLine) {
        // KUNCI: Kita pangkas dari 8ms menjadi 3ms. 
        // Ini waktu paling pas (sweet spot) biar printer gak overload tapi cetakan jalan mulus!
        await new Promise(resolve => setTimeout(resolve, 3)); 
        bytesSentInCurrentLine = 0;
      }
    }
  } else {
    // Jalur aman kalau printer minta feedback (with response)
    for (let i = 0; i < combinedData.length; i += chunkSize) {
      const chunk = combinedData.slice(i, i + chunkSize);
      await characteristic.writeValue(chunk);
    }
  }

  await trackUserPrintActivity('PRINT');
};