import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Ambil cookie fingerprint perangkat
  const deviceFingerprint = request.cookies.get('device_fingerprint')?.value;
  const { pathname } = request.nextUrl;

  // 2. Jika fingerprint TIDAK ADA
  if (!deviceFingerprint) {
    
    // Kondisi A: Jika yang diakses adalah API, kembalikan JSON Error
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: "ID Perangkat tidak ditemukan. Silakan muat ulang halaman utama aplikasi." },
        { status: 403 }
      );
    }

    // Kondisi B: Jika yang diakses halaman web biasa (dan bukan rute /), lempar ke halaman utama /
    if (pathname !== '/') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 3. Jika fingerprint aman, izinkan akses berlanjut
  return NextResponse.next();
}

// 4. PROTEKSI SEMUA RUTE SECARA GLOBAL (Kecuali static files bawaan Next.js dan halaman /)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|$).*)',
  ],
};