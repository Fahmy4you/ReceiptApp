'use client'
import { GUIDE_DATA, NOT_SHOW_IN_PREVIEW, NOT_TASK_AI_TYPE_INPUT } from '@/lib/constanta';
import { useState } from 'react';

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<string>("upload-ocr");

  // Mencari data bab yang sedang aktif untuk di-render
  const currentSection = GUIDE_DATA.find((section) => section.id === activeTab) || GUIDE_DATA[0];

  return (
    <div className="p-4 space-y-6">
      <h1 className='text-xl md:text-2xl font-bold mb-5'>Panduan Penggunaan Aplikasi Kami</h1>
      <div className="block lg:hidden">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
          Pilih Bab Panduan:
        </label>
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full p-3 rounded-xl border font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white border-zinc-200 text-zinc-900 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
        >
          {GUIDE_DATA.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </div>

      {/* TABS BUTTONS (Muncul di Tablet & Desktop) */}
      <div className="hidden lg:flex flex-wrap gap-2 p-2 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/10">
        {GUIDE_DATA.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-4 cursor-pointer py-2.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all duration-200 ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-emerald-500 dark:text-zinc-950 dark:shadow-lg dark:shadow-emerald-500/20'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900'
              }`}
            >
              <span className="mr-1.5">{item.icon}</span>
              {item.title.split(' ').slice(1).join(' ')}
            </button>
          );
        })}
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <main className="space-y-6">
        <article className="p-6 md:p-8 rounded-2xl border transition-all duration-300 animate-fadeIn bg-white border-zinc-200 shadow-sm dark:bg-zinc-900/30 dark:border-zinc-800/80">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl p-2 rounded-xl bg-zinc-500/10">{currentSection.icon}</span>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {currentSection.title}
            </h2>
          </div>
          
          <p className="text-base leading-relaxed mb-6 text-zinc-600 dark:text-zinc-400">
            {currentSection.description}
          </p>

          {/* Poin-Poin Utama */}
          {currentSection.points && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {currentSection.points.map((point, index) => (
                <div 
                  key={index} 
                  className="p-4 rounded-xl border bg-zinc-50 border-zinc-100 dark:bg-zinc-900/60 dark:border-zinc-800"
                >
                  <h4 className="font-semibold text-sm tracking-wide uppercase mb-1 text-emerald-500 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {point.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {point.desc}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Sub-Seksi Anatomi Form */}
          {currentSection.subSections && (
            <div className="space-y-6 mt-6 border-t pt-6 border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-sky-600 dark:text-sky-400">Anatomi Komponen Desainer:</h3>
              <div className="grid grid-cols-1 gap-6">
                {currentSection.subSections.map((sub, sIdx) => (
                  <div key={sIdx} className="p-5 rounded-xl border bg-zinc-50 border-zinc-200 dark:bg-zinc-900/40 dark:border-zinc-800">
                    <h4 className="text-base font-bold text-zinc-900 dark:text-white mb-1">{sub.title}</h4>
                    <p className="text-sm mb-3 text-zinc-500 dark:text-zinc-400">{sub.desc}</p>
                    <ul className="list-disc list-inside text-sm space-y-1.5 pl-2 text-zinc-600 dark:text-zinc-300">
                      {sub.details.map((detail, dIdx) => (
                        <li key={dIdx} className="leading-relaxed">
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {detail.split(':')[0]}:
                          </span>
                          {detail.split(':')[1]}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Catatan Info Tambahan */}
          {currentSection.notes && (
            <div className="mt-6 p-4 rounded-xl border border-dashed bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-950/50 dark:border-zinc-800 dark:text-zinc-400">
              {currentSection.notes.map((note, nIdx) => (
                <p key={nIdx} className="text-sm flex items-start gap-2">
                  <span className="text-blue-500">💡</span>
                  <span><strong>Penting:</strong> {note}</span>
                </p>
              ))}
            </div>
          )}
        </article>

        {/* ARSIP DATA TEKNIS */}
        <div className="p-4 rounded-xl border text-xs font-mono bg-zinc-100 border-zinc-200 dark:bg-zinc-900/20 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
          <span className="text-zinc-400 dark:text-zinc-500">// Global System Exclusions</span>
          <div className="flex flex-wrap gap-4 mt-2">
            <div><span className="text-amber-600 dark:text-amber-500">Type Data Yang Tidak Ditampilkan :</span> [{NOT_SHOW_IN_PREVIEW.join(', ')}]</div>
            <div><span className="text-amber-600 dark:text-amber-500">Type Data Yang Tidak Ditanyakan :</span> [{NOT_TASK_AI_TYPE_INPUT.join(', ')}]</div>
          </div>
        </div>
      </main>

    </div>
  );
}