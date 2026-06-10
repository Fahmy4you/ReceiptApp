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

  // =========================================================================
  // 🎯 2. SETUP CANVAS + IDE KAMU: TAMBAH MARGIN BAWAH BIAR ENGGAK MANDEG
  // =========================================================================
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const printWidth = 384; // Standar lebar printer thermal 58mm

  if (!ctx) throw new Error("Gagal membuat konteks canvas.");

  const cropLeft = 20; 
  const cropRight = 23; 
  
  const sourceX = cropLeft;
  const sourceWidth = img.width - cropLeft - cropRight;
  const sourceY = 0;
  const sourceHeight = img.height;

  // Hitung skala tinggi konten asli
  const scale = printWidth / sourceWidth;
  const contentHeight = sourceHeight * scale;
  
  // IDE KAMU: Tambahkan bonus space kosong sebesar 60px di paling bawah canvas
  // Ini trik paling ampuh biar dinamo printer tetep jalan ngelewatin nominal!
  const marginBottom = 120; 

  canvas.width = printWidth;
  canvas.height = contentHeight + marginBottom;

  // Aktifkan smoothing kualitas tinggi biar font ciutnya mulus
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Beri background putih penuh pada seluruh canvas (termasuk area margin baru)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Gambar struk aslinya di bagian atas canvas
  ctx.drawImage(
    img,
    sourceX, sourceY, sourceWidth, sourceHeight,
    0, 0, printWidth, contentHeight
  );

  // 3. Konversi gambar ke format Bitmap 1-bit dengan KONTRAST EKSTRIM (ANTI BURAM)
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
    0x10, 0x14, 0x01,       // DLE DC4 (Clear printer buffer secara paksa dari sisa data lama)
    0x1B, 0x40,             // ESC @ (Inisialisasi ulang printer ke setelan pabrik)
    0x1B, 0x61, 0x01,       // ESC a 1 (Set rata tengah / Center Alignment)
    0x1D, 0x76, 0x30, 0x00, // GS v 0 (Perintah cetak raster bit image standard)
    widthBytes & 0xFF, (widthBytes >> 8) & 0xFF, 
    heightPixels & 0xFF, (heightPixels >> 8) & 0xFF 
  ]);

  const footer = new Uint8Array([
    0x1B, 0x64, 0x05, // ESC d 5 (Maju 5 baris kosong setelah cetak)
    0x1D, 0x56, 0x00  // GS V 0 (Potong kertas)
  ]);

  // Gabungkan semua data menjadi satu kesatuan array byte
  const combinedData = new Uint8Array(header.length + bitmap.length + footer.length);
  combinedData.set(header);
  combinedData.set(new Uint8Array(bitmap), header.length);
  combinedData.set(footer, header.length + bitmap.length);

  // 5. PROSES PENGIRIMAN DATA - BALIK KE SETTINGAN LOKAL KAMU YANG STABIL (8ms)
  const chunkSize = 20; 
  const bytesPerLine = 48; 
  let bytesSentInCurrentLine = 0;

  for (let i = 0; i < combinedData.length; i += chunkSize) {
    const chunk = combinedData.slice(i, i + chunkSize);
    
    if (characteristic.properties.writeWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk);
      bytesSentInCurrentLine += chunk.length;
      
      if (bytesSentInCurrentLine >= bytesPerLine) {
        await new Promise(resolve => setTimeout(resolve, 8)); // Dikunci di 8ms sesuai kestabilan local komputer
        bytesSentInCurrentLine = 0;
      }
    } else {
      await characteristic.writeValue(chunk);
    }
  }

  // Catat aktivitas setelah proses cetak selesai
  await trackUserPrintActivity('PRINT');
};