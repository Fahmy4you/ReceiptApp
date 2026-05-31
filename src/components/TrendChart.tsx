import { labelWaktu } from "@/lib/constanta";
import React from "react";

interface ChartItem {
  label: string;
  pdf: number;
  gambar: number;
  print: number;
  total: number;
}

interface TrendChartProps {
  chartData: ChartItem[];
  filter: string;
}

export default function TrendChart({ chartData, filter }: TrendChartProps) {
  const dataGrafik = chartData && chartData.length > 0 ? chartData : [
    { label: 'Sab, 23', pdf: 0, gambar: 0, print: 0, total: 0 },
    { label: 'Min, 24', pdf: 0, gambar: 0, print: 0, total: 0 },
    { label: 'Sen, 25', pdf: 0, gambar: 0, print: 0, total: 0 },
    { label: 'Sel, 26', pdf: 0, gambar: 0, print: 0, total: 0 },
    { label: 'Rab, 27', pdf: 0, gambar: 0, print: 0, total: 0 },
    { label: 'Kam, 28', pdf: 0, gambar: 0, print: 0, total: 0 },
    { label: 'Jum, 29', pdf: 0, gambar: 0, print: 0, total: 0 }
  ];
  console.log(dataGrafik)

  const svgWidth = 500;
  const svgHeight = 200;
  
  // Tetap kunci di 0 agar titik matematika koordinat berada di ujung absolut SVG
  const paddingX = 0; 
  const paddingY = 30;

  const maxTotal = Math.max(...dataGrafik.map(d => d.total), 1);

  const titikKoordinat = dataGrafik.map((item, index) => {
    const x = paddingX + (index * (svgWidth - paddingX * 2)) / (dataGrafik.length - 1 || 1);
    const y = 30 + (130 - (item.total / maxTotal) * 130);
    return { x, y, ...item };
  });

  const pathD = titikKoordinat.reduce((acc, t, i) => {
    return i === 0 ? `M ${t.x},${t.y}` : `${acc} L ${t.x},${t.y}`;
  }, "");

  const areaD = titikKoordinat.length > 0 
    ? `${pathD} L ${titikKoordinat[titikKoordinat.length - 1].x},160 L ${titikKoordinat[0].x},160 Z` 
    : "";

  return (
    // Kartu utama menggunakan p-5 (padding internal)
    <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex flex-col justify-between hover:shadow-sm transition-all w-full overflow-hidden">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="font-bold text-sm md:text-base text-slate-900 dark:text-white capitalize">
              Grafik Cetak Semua ({filter})
            </h4>
            <p className="text-xs text-slate-400 dark:text-zinc-500">Visualisasi data pencetakan real-time</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg text-blue-500 bg-blue-500/10 border border-blue-500/20 shadow-sm">
            Live Tracker
          </span>
        </div>
        
        {/* PERBAIKAN UTAMA: Tambahkan -mx-5 untuk melawan p-5 milik card induk, */}
        {/* serta tambahkan sedikit padding dalam px-4/px-2 agar teks ujung tidak terlalu mepet sasis */}
        <div className="w-full h-56 relative -mx-5 px-4">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0"/>
              </linearGradient>
            </defs>
            
            {/* Garis Grid Latar Belakang */}
            <line x1="0" y1="30" x2={svgWidth} y2="30" stroke="#f1f5f9" className="dark:stroke-zinc-800/30" strokeWidth="1" />
            <line x1="0" y1="73" x2={svgWidth} y2="73" stroke="#f1f5f9" className="dark:stroke-zinc-800/30" strokeWidth="1" />
            <line x1="0" y1="116" x2={svgWidth} y2="116" stroke="#f1f5f9" className="dark:stroke-zinc-800/30" strokeWidth="1" />
            <line x1="0" y1="160" x2={svgWidth} y2="160" stroke="#f1f5f9" className="dark:stroke-zinc-800/50" strokeWidth="1.5" />

            {/* Gradien Area Bawah Garis */}
            {areaD && <path d={areaD} fill="url(#chartGradient)" className="transition-all duration-500 ease-in-out" />}
            
            {/* Garis Utama */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500 ease-in-out"
              />
            )}
            
            {/* Titik Poin Data dan Label Sumbu X */}
            {titikKoordinat.map((titik, idx) => {
              const isTerakhir = idx === titikKoordinat.length - 1;
              const isPertama = idx === 0;

              let anchorPos: "start" | "middle" | "end" = "middle";
              if (isPertama) anchorPos = "start";
              if (isTerakhir) anchorPos = "end";

              return (
                <g key={idx} className="group">
                  {/* Lingkaran Grafik */}
                  <circle
                    cx={titik.x}
                    cy={titik.y}
                    r={isTerakhir ? "5" : "4"}
                    fill={isTerakhir ? "#10b981" : "#2563eb"}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className={`cursor-pointer transition-all duration-300 ${isTerakhir ? 'animate-pulse' : ''}`}
                  />
                  
                  {/* Teks label sumbu X */}
                  <text
                    x={titik.x}
                    y={185}
                    textAnchor={anchorPos}
                    className="text-[10px] fill-slate-400 dark:fill-zinc-500 font-bold tracking-tight pointer-events-none select-none"
                  >
                    {titik.label}
                  </text>

                  <title>{`${titik.label}\nPDF: ${titik.pdf}\nGambar: ${titik.gambar}\nPrint: ${titik.print}\nTotal: ${titik.total}`}</title>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      
      {/* Keterangan Legenda Bawah */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/70 pt-4 mt-2">
        <div className="flex gap-4 text-[10px] md:text-xs text-slate-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Total Produksi Cetak (Gabungan)
          </span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-zinc-500">Real-time</span>
      </div>
    </div>
  );
}