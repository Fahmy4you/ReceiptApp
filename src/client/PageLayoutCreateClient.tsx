'use client';
import Toast from '@/components/Toast';
import { DefaultConfigLayout, fontConfig, weightConstanta } from '@/lib/constanta';
import { DataType, ElementType, InputTextElement, LabelLayout, ReceiptElement, SeparatorElement, TextElement } from '@/lib/types';
import { createLayout, updateLayout } from '@/models/Layout';
import { useSession } from 'next-auth/react';
import { useRef, useState } from 'react';
import { 
  LuTrash2 as Trash2, 
  LuRefreshCw as RefreshCw,
  LuType as Type,
  LuImage as ImageIcon,
  LuMinus as Minus,
  LuAlignLeft as AlignLeft,
  LuAlignCenter as AlignCenter,
  LuAlignRight as AlignRight,
  LuEye as Eye,
  LuSave as Save,
  LuFileText as FileText,
  LuPalette as Palette,
  LuChevronUp as ChevronUp,
  LuChevronDown as ChevronDown,
  LuMoveVertical as MoveVertical,
  LuSpace as Space,
  LuLoader as Loader2,
  LuArrowLeftRight as ArrowLeftRight,
} from 'react-icons/lu';

const generatePlaceholder = (el: InputTextElement) => {
  if (el.exampleValue) return el.exampleValue;
  
  switch (el.dataType) {
    case 'Admin_Fee': return 'Rp 2.500';
    case 'Store_Name': return 'TOKO SEJAHTERA';
    case 'Alamat_Toko': return 'Jl. Raya No. 123, Kota Jakarta';
    case 'total_keseluruhan': return 'Rp 1.002.500';
    case 'random_number': return '3436 6731 7054';
    case 'random_mixed': return 'REF-99X21B';
    case 'random_text': return 'SAMPLE-TEXT';
    case 'Number': return '0123456789';
    case 'Date': return '2026-05-15';
    case 'Time': return '22:56 WIB';
    case 'Currency': return 'Rp 1.000.000';
    case 'Nominal': return 'Rp 1.000.000';
    default: return 'Sample Data';
  }
};

const PageLayoutCreateClient = ({name, config, idLayout}: {name?: string, config?: ReceiptElement[], idLayout?: string}) => {
  const [layoutName, setLayoutName] = useState<string>(name ?? 'Struk Default Pembayaran');

  const [rows, setRows] = useState<ReceiptElement[]>(config ?? DefaultConfigLayout);
  const [loading, setLoading] = useState(false);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);
  const session = useSession();

  const addElement = (type: ElementType) => {
    const id = crypto.randomUUID();
    let newEl: ReceiptElement;

    switch (type) {
      case 'input_text':
        newEl = { 
          id, 
          type: 'input_text', 
          label: 'Label Baru', 
          showLabel: true,
          dataType: 'random_text', 
          position: 'default', 
          labelLayout: 'inline',
          labelFontSize: 12, 
          valueFontSize: 12, 
          labelFontWeight: 'reg',
          valueFontWeight: 'reg',
          color: '#1a1a1a',
          exampleValue: 'Contoh Data',
          hasBorder: false,
          marginTop: 0,
          marginBottom: 6,
          gap: 12,
          labelLetterSpacing: 0,
          valueLetterSpacing: 0
        } as any;
        break;
      case 'input_image':
        newEl = { id, type: 'input_image', width: 120, height: 60, source: 'logo', marginTop: 10, marginBottom: 10 };
        break;
      case 'text':
        newEl = { id, type: 'text', value: 'Teks Baru', fontSize: 11, fontWeight: 'reg', alignment: 'left', color: '#1a1a1a', marginTop: 5, marginBottom: 5, letterSpacing: 0 } as any;
        break;
      case 'separator':
        newEl = { id, type: 'separator', style: 'dash', color: '#333333', marginTop: 10, marginBottom: 10, thickness: 2 } as any;
        break;
    }
    setRows([...rows, newEl]);
  };

  const removeRow = (id: string) => setRows(rows.filter(r => r.id !== id));

  const updateRow = (id: string, updates: Partial<ReceiptElement>) => {
    setRows(rows.map(r => r.id === id ? { ...r, ...updates } as any : r));
  };

  const moveElement = (index: number, direction: 'up' | 'down') => {
    const newRows = [...rows];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newRows.length) return;
    [newRows[index], newRows[targetIndex]] = [newRows[targetIndex], newRows[index]];
    setRows(newRows);
  };

  const resetForm = () => {
    setRows([]);
    setLayoutName('');
  };

  const handleSaveLayout = async () => {
    setLoading(true);
    if(session.status != 'authenticated') {
      setToast({ type: 'error', title: 'Error', message: "Anda harus login untuk menyimpan layout" });
      setLoading(false);
      return;
    }

    try {
      let result;
      if(idLayout) {
        result = await updateLayout(idLayout, { name: layoutName || 'Untitled Layout', isDefault: false, config: rows });
      } else {
        result = await createLayout({ name: layoutName || 'Untitled Layout', isDefault: false, config: rows });
      }
      
      if (result.success) {
        setToast({ type: 'success', title: 'Sukses', message: "Layout berhasil disimpan" });
      } else {
        throw new Error(result.error);
      }
    } catch(err) {
      setToast({ type: 'error', title: 'Error', message: "Gagal membuat layout " + err });
    } finally {
      setLoading(false);
    }
  };

  const renderSpacingControls = (row: any) => (
    <div className="space-y-3 md:col-span-2 border-t pt-3 mt-1 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-[9px] font-bold uppercase text-zinc-400 flex items-center gap-1">
          <MoveVertical size={10} /> Margin Atas ({row.marginTop ?? 0}px)
        </label>
        <input 
          type="range" min="0" max="40" step="1" 
          value={row.marginTop ?? 0} 
          onChange={e => updateRow(row.id, { marginTop: parseInt(e.target.value) })} 
          className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-zinc-700" 
        />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-bold uppercase text-zinc-400 flex items-center gap-1">
          <MoveVertical size={10} /> Margin Bawah ({row.marginBottom ?? 0}px)
        </label>
        <input 
          type="range" min="0" max="40" step="1" 
          value={row.marginBottom ?? 0} 
          onChange={e => updateRow(row.id, { marginBottom: parseInt(e.target.value) })} 
          className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-zinc-700" 
        />
      </div>
      
      {/* Letter Spacing Terpisah untuk Input Text */}
      {row.type === 'input_text' && (
        <>
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase text-zinc-400 flex items-center gap-1">
              <ArrowLeftRight size={10} /> Letter Spacing Label ({row.labelLetterSpacing ?? 0}px)
            </label>
            <input 
              type="range" min="-4" max="2" step="0.1"  
              value={row.labelLetterSpacing ?? 0} 
              onChange={e => updateRow(row.id, { labelLetterSpacing: parseFloat(e.target.value) })} 
              className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-zinc-700" 
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold uppercase text-zinc-400 flex items-center gap-1">
              <ArrowLeftRight size={10} /> Letter Spacing Value ({row.valueLetterSpacing ?? 0}px)
            </label>
            <input 
              type="range" min="-4" max="2" step="0.1"  
              value={row.valueLetterSpacing ?? 0} 
              onChange={e => updateRow(row.id, { valueLetterSpacing: parseFloat(e.target.value) })} 
              className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-zinc-700" 
            />
          </div>
        </>
      )}

      {row.type === 'text' && (
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[9px] font-bold uppercase text-zinc-400 flex items-center gap-1">
            <ArrowLeftRight size={10} /> Letter Spacing ({row.letterSpacing ?? 0}px)
          </label>
          <input 
            type="range" min="-4" max="2" step="0.1" 
            value={row.letterSpacing ?? 0} 
            onChange={e => updateRow(row.id, { letterSpacing: parseFloat(e.target.value) })} 
            className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-zinc-700" 
          />
        </div>
      )}

      {row.type === 'input_text' && (
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[9px] font-bold uppercase text-zinc-400 flex items-center gap-1">
            <Space size={10} /> Jarak Antar Spasi / Gap ({row.gap ?? 0}px)
          </label>
          <input 
            type="range" min="0" max="30" step="1" 
            value={row.gap ?? 0} 
            onChange={e => updateRow(row.id, { gap: parseInt(e.target.value) })} 
            className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-zinc-700" 
          />
        </div>
      )}

      {/* Input Ketebalan Baru untuk Separator */}
      {row.type === 'separator' && (
        <div className="space-y-1 sm:col-span-2">
          <label className="text-[9px] font-bold uppercase text-zinc-400 flex items-center gap-1">
            <Minus size={10} /> Ketebalan Garis ({row.thickness ?? 2}px)
          </label>
          <input 
            type="range" min="1" max="10" step="1" 
            value={row.thickness ?? 2} 
            onChange={e => updateRow(row.id, { thickness: parseInt(e.target.value) })} 
            className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-zinc-700" 
          />
        </div>
      )}
    </div>
  );

  return (
    <div>
        <link href={fontConfig.googleFontsUrl} rel="stylesheet" />

        <div className="mb-6 p-4 bg-white dark:bg-zinc-900 rounded-xl sm:rounded-3xl border border-blue-50 dark:border-zinc-800 shadow-sm">
          <div className="flex flex-row items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl sm:rounded-2xl text-blue-600 dark:text-blue-400 flex-shrink-0">
              <FileText size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
              <label className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-zinc-400 ml-0.5">Identitas Konfigurasi</label>
              <input 
                type="text"
                placeholder="Nama Layout Struk..."
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                className="w-full px-1 py-1 sm:py-2 text-sm sm:text-base font-semibold bg-transparent border-b-2 border-zinc-100 dark:border-zinc-800 focus:border-blue-500 outline-none transition-all dark:text-white"
              />
            </div>
          </div>
        </div>

        {toast && (
            <div ref={errorRef}>
                <Toast toast={toast} setToast={setToast} />
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start">
          
          {/* LEFT: CONFIGURATION */}
          <div className="lg:col-span-7 space-y-4 order-2 lg:order-1 w-full min-w-0">
            <div className="bg-white dark:bg-zinc-900 rounded-xl sm:rounded-3xl border border-blue-50 dark:border-zinc-800 p-3 sm:p-6 lg:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-bold dark:text-white">Struktur Struk</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Atur komponen secara visual.</p>
                </div>
                <button onClick={resetForm} className="text-zinc-400 hover:text-rose-500 transition-colors p-1">
                  <RefreshCw size={18} />
                </button>
              </div>

              <div className="space-y-4 max-h-[65vh] lg:max-h-[700px] overflow-y-auto pr-0.5 sm:pr-2 custom-scrollbar">
                {rows.map((row, index) => (
                  <div key={row.id} className="group p-3 sm:p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 w-full box-border">
                    
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[9px] sm:text-[10px] font-black text-blue-500 flex-shrink-0">{index + 1}</span>
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-blue-500 truncate">{row.type.replace('_', ' ')}</span>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="flex border rounded-lg overflow-hidden bg-white dark:bg-zinc-800 dark:border-zinc-700">
                          <button onClick={() => moveElement(index, 'up')} disabled={index === 0} className="p-1 sm:p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-20"><ChevronUp size={12} /></button>
                          <div className="w-[1px] bg-zinc-100 dark:bg-zinc-700" />
                          <button onClick={() => moveElement(index, 'down')} disabled={index === rows.length - 1} className="p-1 sm:p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-20"><ChevronDown size={12} /></button>
                        </div>
                        <button onClick={() => removeRow(row.id)} className="text-zinc-400 hover:text-rose-500 p-1"><Trash2 size={14} /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {row.type === 'input_text' && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-zinc-400 flex justify-between items-center gap-2">
                              <span className="truncate">Nama Label</span>
                              <button 
                                type="button"
                                onClick={() => updateRow(row.id, { showLabel: !(row as InputTextElement).showLabel })}
                                className={`text-[8px] px-1.5 py-0.5 rounded font-bold transition-all flex-shrink-0 ${ (row as InputTextElement).showLabel ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400'}`}
                              >
                                {(row as InputTextElement).showLabel ? 'SHOW' : 'HIDE'}
                              </button>
                            </label>
                            <input value={row.label} onChange={e => updateRow(row.id, { label: e.target.value })} className="w-full px-2.5 py-1.5 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-white text-xs sm:text-sm outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-zinc-400">Contoh Value</label>
                            <input value={(row as InputTextElement).exampleValue} onChange={e => updateRow(row.id, { exampleValue: e.target.value })} className="w-full px-2.5 py-1.5 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-white text-xs sm:text-sm outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-zinc-400">Tipe Data</label>
                            <select value={row.dataType} onChange={e => updateRow(row.id, { dataType: e.target.value as DataType })} className="w-full px-2.5 py-1.5 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-white text-xs sm:text-sm outline-none bg-white dark:bg-zinc-900">
                              <optgroup label="Dinamis"><option value="Admin_Fee">Biaya Admin</option><option value="Store_Name">Nama Toko</option><option value="Alamat_Toko">Alamat Toko</option></optgroup>
                              <optgroup label="Standar"><option value="String">String</option><option value="Number">Number</option><option value="Currency">Currency</option><option value="Nominal">Nominal</option><option value="Referensi">Referensi</option><option value="Date">Date</option><option value="Time">Time</option><option value="Hidden">Hidden</option><option value="total_keseluruhan">Total (Nominal + Admin)</option></optgroup>
                              <optgroup label="Randomizer"><option value="random_text">Rand Text</option><option value="random_number">Rand Num</option><option value="random_mixed">Rand Mix</option></optgroup>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-zinc-400">Warna & Gaya</label>
                            <div className="flex gap-2 h-8 sm:h-9">
                               <div className="flex-1 flex items-center gap-1 bg-white dark:bg-zinc-900 px-2 rounded-lg border dark:border-zinc-700 min-w-0">
                                  <Palette size={12} className="text-zinc-400 flex-shrink-0" />
                                  <input type="text" value={(row as InputTextElement).color} onChange={e => updateRow(row.id, { color: e.target.value })} className="w-full bg-transparent border-none text-[10px] font-mono focus:outline-none dark:text-white min-w-0" />
                                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border flex-shrink-0" style={{ backgroundColor: (row as InputTextElement).color }} />
                               </div>
                               <button type="button" onClick={() => updateRow(row.id, { hasBorder: !(row as InputTextElement).hasBorder })} className={`px-2.5 rounded-lg border text-[10px] font-black transition-all flex-shrink-0 ${ (row as InputTextElement).hasBorder ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900' : 'bg-white dark:bg-zinc-900 text-zinc-400 dark:border-zinc-700'}`}>BOX</button>
                            </div>
                          </div>

                          <div className="space-y-1 sm:col-span-2 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold uppercase text-zinc-400 block truncate">Size Label</label>
                              <input type="number" value={(row as InputTextElement).labelFontSize} onChange={e => updateRow(row.id, { labelFontSize: parseInt(e.target.value) || 12 })} className="w-full px-2.5 py-1.5 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-white text-xs sm:text-sm outline-none" />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase text-zinc-400 block truncate">Size Value</label>
                              <input type="number" value={(row as InputTextElement).valueFontSize} onChange={e => updateRow(row.id, { valueFontSize: parseInt(e.target.value) || 12 })} className="w-full px-2.5 py-1.5 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-white text-xs sm:text-sm outline-none" />
                            </div>
                          </div>

                          {/* Pemisahan Weight Kontrol Label & Value */}
                          <div className="space-y-1 sm:col-span-2 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold uppercase text-zinc-400">Weight Label</label>
                              <select value={(row as InputTextElement).labelFontWeight} onChange={e => updateRow(row.id, { labelFontWeight: e.target.value as any })} className="w-full px-2.5 py-1.5 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-white text-xs sm:text-sm outline-none bg-white dark:bg-zinc-900">
                                <option value="reg">Reg</option>
                                <option value="semi">Semi</option>
                                <option value="bold">Bold</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold uppercase text-zinc-400">Weight Value</label>
                              <select value={(row as InputTextElement).valueFontWeight} onChange={e => updateRow(row.id, { valueFontWeight: e.target.value as any })} className="w-full px-2.5 py-1.5 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-white text-xs sm:text-sm outline-none bg-white dark:bg-zinc-900">
                                <option value="reg">Reg</option>
                                <option value="semi">Semi</option>
                                <option value="bold">Bold</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1 sm:col-span-2 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] font-bold uppercase text-zinc-400">Layout</label>
                              <select value={(row as InputTextElement).labelLayout} onChange={e => updateRow(row.id, { labelLayout: e.target.value as LabelLayout })} className="w-full px-2.5 py-1.5 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-white text-xs sm:text-sm outline-none bg-white dark:bg-zinc-900">
                                <option value="inline">Sejajar</option><option value="stacked">Stack</option>
                              </select>
                            </div>
                            <div className="flex flex-col justify-end">
                              <div className="flex gap-1 p-1 rounded-lg border dark:border-zinc-700 bg-white dark:bg-zinc-900 h-9 items-center justify-center">
                                {['default', 'center'].map(pos => (
                                  <button key={pos} type="button" onClick={() => { const u: any = { position: pos }; if (pos === 'center') u.labelLayout = 'stacked'; updateRow(row.id, u); }} className={`flex-1 py-1 rounded text-[9px] font-bold uppercase transition-all ${ (row as InputTextElement).position === pos ? 'bg-blue-600 text-white' : 'text-zinc-400'}`}>{pos}</button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {row.type === 'input_image' && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-zinc-400">Dimensi W x H (px)</label>
                            <div className="flex items-center gap-1.5">
                              <input type="number" value={row.width} onChange={e => updateRow(row.id, { width: parseInt(e.target.value) })} className="w-full px-2.5 py-1.5 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-white text-xs sm:text-sm outline-none" />
                              <span className="text-zinc-400 text-xs">×</span>
                              <input type="number" value={row.height} onChange={e => updateRow(row.id, { height: parseInt(e.target.value) })} className="w-full px-2.5 py-1.5 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-white text-xs sm:text-sm outline-none" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-zinc-400">Sumber Gambar</label>
                            <select value={row.source} onChange={e => updateRow(row.id, { source: e.target.value as any })} className="w-full px-2.5 py-1.5 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-white text-xs sm:text-sm outline-none bg-white dark:bg-zinc-900">
                              <option value="logo">Logo Default</option><option value="upload">Upload</option>
                            </select>
                          </div>
                        </>
                      )}

                      {row.type === 'text' && (
                        <>
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[10px] font-bold uppercase text-zinc-400">Isi Teks</label>
                            <input value={row.value} onChange={e => updateRow(row.id, { value: e.target.value })} className="w-full px-2.5 py-1.5 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-white text-xs sm:text-sm outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-zinc-400">Warna (Hex)</label>
                            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-2.5 h-8 sm:h-9 rounded-lg border dark:border-zinc-700 min-w-0">
                               <Palette size={12} className="text-zinc-400 flex-shrink-0" />
                               <input type="text" value={(row as TextElement).color} onChange={e => updateRow(row.id, { color: e.target.value })} className="w-full bg-transparent border-none text-[10px] font-mono focus:outline-none dark:text-white min-w-0" />
                               <div className="w-4 h-4 rounded-full border shadow-sm flex-shrink-0" style={{ backgroundColor: (row as TextElement).color }} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-zinc-400">Font & Weight</label>
                            <div className="flex gap-2">
                               <input type="number" value={(row as TextElement).fontSize} onChange={e => updateRow(row.id, { fontSize: parseInt(e.target.value) })} className="w-1/2 px-2.5 py-1.5 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-white text-xs sm:text-sm outline-none" />
                               <select value={(row as TextElement).fontWeight} onChange={e => updateRow(row.id, { fontWeight: e.target.value as any })} className="w-1/2 px-2.5 py-1.5 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-white text-xs sm:text-sm outline-none bg-white dark:bg-zinc-900">
                                  <option value="reg">Reg</option>
                                  <option value="semi">Semi</option>
                                  <option value="bold">Bold</option>
                                </select>
                            </div>
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-[10px] font-bold uppercase text-zinc-400">Align & Style</label>
                            <div className="flex gap-1.5">
                              {['left', 'center', 'right'].map(align => (
                                <button key={align} type="button" onClick={() => updateRow(row.id, { alignment: align as any })} className={`flex-1 p-2 rounded-lg border text-sm transition-all ${row.alignment === align ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-400'}`}>
                                  {align === 'left' && <AlignLeft size={14} className="mx-auto" />}
                                  {align === 'center' && <AlignCenter size={14} className="mx-auto" />}
                                  {align === 'right' && <AlignRight size={14} className="mx-auto" />}
                                </button>
                              ))}
                              <button type="button" onClick={() => updateRow(row.id, { hasBorder: !row.hasBorder })} className={`flex-1 p-2 rounded-lg border text-[10px] font-black transition-all ${row.hasBorder ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-400'}`}>BOX</button>
                            </div>
                          </div>
                        </>
                      )}

                      {row.type === 'separator' && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-zinc-400">Gaya Garis</label>
                            <select 
                              value={row.style} 
                              onChange={e => updateRow(row.id, { style: e.target.value as any })} 
                              className="w-full px-2.5 py-1.5 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-white text-xs sm:text-sm outline-none bg-white dark:bg-zinc-900"
                            >
                              <option value="line">Garis Lurus Tunggal</option>
                              <option value="dash">Garis Putus Tunggal</option>
                              <option value="double_line">Garis Lurus Ganda (==)</option>
                              <option value="double_dash">Garis Putus Ganda (- -)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-zinc-400">Warna (Hex)</label>
                            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-2.5 h-8 sm:h-9 rounded-lg border dark:border-zinc-700 min-w-0">
                               <Palette size={12} className="text-zinc-400 flex-shrink-0" />
                               <input type="text" value={(row as SeparatorElement).color} onChange={e => updateRow(row.id, { color: e.target.value })} className="w-full bg-transparent border-none text-[10px] font-mono focus:outline-none dark:text-white min-w-0" />
                               <div className="w-4 h-4 rounded-full border shadow-sm flex-shrink-0" style={{ backgroundColor: (row as SeparatorElement).color }} />
                            </div>
                          </div>
                        </>
                      )}

                      {renderSpacingControls(row)}
                    </div>
                  </div>
                ))}
              </div>

              {/* DASHED TOMBOL TAMBAH KOMPONEN */}
              <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'input_text', label: 'Input', icon: Type },
                  { id: 'input_image', label: 'Image', icon: ImageIcon },
                  { id: 'text', label: 'Teks', icon: AlignCenter },
                  { id: 'separator', label: 'Garis', icon: Minus }
                ].map(btn => (
                  <button key={btn.id} type="button" onClick={() => addElement(btn.id as any)} className="flex flex-col items-center gap-1 p-2 rounded-xl border-2 border-dashed border-zinc-100 dark:border-zinc-800 hover:border-blue-400 transition-all group bg-transparent">
                    <btn.icon size={16} className="text-zinc-400 group-hover:text-blue-500 sm:w-5 sm:h-5" />
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-tight text-zinc-500">{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: LIVE PREVIEW */}
          <div className="lg:col-span-5 flex flex-col items-center order-1 lg:order-2 w-full">
            <div className="sticky top-4 w-full">
              <div className="flex items-center gap-2 mb-2.5 px-1 text-zinc-400">
                <Eye size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Live Preview</span>
              </div>

              <div className="receipt-container w-full overflow-hidden">
                <div className="receipt-paper mx-auto origin-top sm:scale-100 transform" style={{ scale: 'var(--preview-scale, 1)' }}>
                  {rows.map((row) => {
                    const mTop = `${row.marginTop ?? 0}px`;
                    const mBottom = `${row.marginBottom ?? 0}px`;

                    if (row.type === 'input_text') {
                      const el = row as InputTextElement;
                      const isStacked = el.labelLayout === 'stacked';
                      const isCentered = el.position === 'center';
                      const rowGap = `${el.gap ?? 12}px`; 

                      return (
                        <div 
                          key={el.id} 
                          className={`info-row wrap-break-word flex ${isStacked ? 'flex-col' : 'justify-between items-baseline'} ${isCentered ? 'text-center justify-center' : ''}`} 
                          style={{ 
                            color: el.color, 
                            border: el.hasBorder ? `2px solid ${el.color}` : 'none', 
                            padding: el.hasBorder ? '8px' : '0', 
                            marginTop: mTop,
                            marginBottom: mBottom,
                            gap: rowGap
                          }}
                        >
                          {el.showLabel && el.label && (
                            <span 
                              suppressHydrationWarning
                              translate='no'
                              className={`uppercase wrap-break-word ${isStacked ? 'text-[0.85em]' : 'pr-[5px]'}`}
                              style={{ 
                                fontSize: `${el.labelFontSize}px`,
                                fontWeight: weightConstanta[el.labelFontWeight] || 400, // Terpisah
                                letterSpacing: `${el.labelLetterSpacing ?? 0}px` // Terpisah
                              }}
                            >
                              {el.label}
                            </span>
                          )}
                          <span 
                            suppressHydrationWarning
                            translate='no'
                            className={`leading-tight wrap-break-word ${!isStacked && !isCentered ? 'text-right' : ''}`}
                            style={{ 
                              fontSize: `${el.valueFontSize}px`,
                              fontWeight: weightConstanta[el.valueFontWeight] || 400, // Terpisah
                              letterSpacing: `${el.valueLetterSpacing ?? 0}px` // Terpisah
                            }}
                          >
                            {generatePlaceholder(el)}
                          </span>
                        </div>
                      );
                    }
                    if (row.type === 'input_image') {
                      return (
                        <div key={row.id} className="flex justify-center" style={{ marginTop: mTop, marginBottom: mBottom }}>
                          <div className="flex flex-col items-center">
                            {row.source === 'logo' ? (
                              <svg viewBox="0 0 100 100" className="grayscale contrast-[1.5] brightness-100" style={{ width: `${row.width}px`, height: 'auto' }}>
                                <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" fill="none" stroke="#000" strokeWidth="3" />
                                <text x="50" y="55" textAnchor="middle" fontSize="11" fontWeight="700" fill="#000">LOGO SMK</text>
                              </svg>
                            ) : (
                              <div className="bg-zinc-100 border-2 border-dashed border-zinc-300 flex items-center justify-center" style={{ width: `${row.width}px`, height: `${row.height}px` }}>
                                <ImageIcon className="text-zinc-300" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    if (row.type === 'text') {
                      const el = row as TextElement;
                      const lSpacing = `${el.letterSpacing ?? 0}px`;

                      return (
                        <div 
                          key={el.id} 
                          suppressHydrationWarning
                          translate='no'
                          style={{ 
                            fontSize: `${el.fontSize}px`, 
                            textAlign: el.alignment, 
                            fontWeight: weightConstanta[el.fontWeight] || 400, 
                            marginTop: mTop,
                            marginBottom: mBottom,
                            padding: el.hasBorder ? '5px' : '0', 
                            border: el.hasBorder ? `2px solid ${el.color}` : 'none', 
                            color: el.color, 
                            lineHeight: 'tight',
                            letterSpacing: lSpacing
                          }} 
                          className="uppercase"
                        >
                          {el.value}
                        </div>
                      );
                    }
                    if (row.type === 'separator') {
                      const el = row as SeparatorElement;
                      const lineThickness = `${el.thickness ?? 2}px`; // Menggunakan variabel dinamis thickness
                      
                      if (el.style === 'double_line') {
                        return (
                          <div key={row.id} className="w-full flex flex-col justify-between" style={{ marginTop: mTop, marginBottom: mBottom, height: `calc(${lineThickness} * 2 + 2px)` }}>
                            <div style={{ borderTop: `${lineThickness} solid ${el.color}` }} />
                            <div style={{ borderTop: `${lineThickness} solid ${el.color}` }} />
                          </div>
                        );
                      }
                      
                      if (el.style === 'double_dash') {
                        return (
                          <div key={row.id} className="w-full flex flex-col justify-between" style={{ marginTop: mTop, marginBottom: mBottom, height: `calc(${lineThickness} * 2 + 2px)` }}>
                            <div style={{ borderTop: `${lineThickness} dashed ${el.color}` }} />
                            <div style={{ borderTop: `${lineThickness} dashed ${el.color}` }} />
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={row.id} 
                          className="w-full" 
                          style={{ 
                            borderTop: `${lineThickness} ${el.style === 'dash' ? 'dashed' : 'solid'} ${el.color}`, 
                            marginTop: mTop, 
                            marginBottom: mBottom 
                          }} 
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              </div>

              <button onClick={handleSaveLayout} className="w-full cursor-pointer mt-4 py-3.5 bg-zinc-900 dark:bg-blue-600 text-white rounded-xl font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/10 group">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {loading ? 'Menyimpan...' : 'Simpan Layout'}
              </button>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .receipt-paper {
            background-color: #ffffff;
            width: 226px;
            padding: 25px 12px;
            position: relative;
            color: #000;
            font-family: '${fontConfig.name}', ${fontConfig.fallback};
            font-variant-numeric: slashed-zero;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
            box-sizing: border-box;
          }

          .receipt-paper::before, .receipt-paper::after {
            content: "";
            position: absolute;
            left: 0;
            width: 100%;
            height: 8px;
            background-repeat: repeat-x;
            background-size: 8px 8px;
          }

          .receipt-paper::before {
            top: -8px;
            background-image: linear-gradient(-45deg, #ffffff 6px, transparent 0), 
                              linear-gradient(45deg, #ffffff 6px, transparent 0);
            background-position: left bottom;
          }

          .receipt-paper::after {
            bottom: -8px;
            background-image: linear-gradient(-45deg, transparent 6px, #ffffff 0), 
                              linear-gradient(45deg, transparent 6px, #ffffff 0);
            background-position: left top;
          }

          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
          
          .receipt-container {
             background: #cbd5e1;
             padding: 30px 10px;
             border-radius: 1rem;
             display: flex;
             justify-content: center;
             min-height: 400px;
          }
          .dark .receipt-container { background: #1e293b; }

          @media (max-width: 480px) {
            :root { --preview-scale: 0.85; }
            .receipt-container { padding: 20px 5px; min-height: 350px; }
          }
        `}</style>
    </div>
  );
};

export default PageLayoutCreateClient;