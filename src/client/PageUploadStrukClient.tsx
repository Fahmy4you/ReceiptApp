'use client';
import { useState, useEffect, ChangeEvent, useMemo, useRef } from 'react';
import { 
  LuUpload as Upload,
  LuLoader as Loader2,
  LuFileText as FileText
} from 'react-icons/lu';
import { Checkbox } from '@/components/Inputs/CheckBox';
import { DefaultConfigLayout, NOT_TASK_AI_TYPE_INPUT } from '@/lib/constanta';
import { Layout } from '@prisma/client';
import SearchableSelect from '@/components/Inputs/SearchableSelect';
import { InputTextConfig, ReceiptElement, SettingsData } from '@/lib/types';
import { calculateReceiptTotal, normalizeKey } from '@/lib/Helpers';
import Toast from '@/components/Toast';
import PreviewPage from '@/components/PreviewPage';
import { createReceipt } from '@/models/Receipt';

interface Previews {
  struk_image: string | null;
}

interface FormDataUpload {
  struk_image: string | null;
}

const PageUploadStrukClient = ({ settings, layoutData }: { settings: SettingsData | null, layoutData: Layout[] }) => {
    // --- STATE CONFIG LAYOUT & SWITCHER LOADING ---
    const [config, setConfig] = useState<ReceiptElement[]>(DefaultConfigLayout);
    const [configId, setConfigId] = useState<string | null>("default_system");
    const [isSwitchingLayout, setIsSwitchingLayout] = useState<boolean>(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; title: string; message: string } | null>(null);

    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [previews, setPreviews] = useState<Previews>({
        struk_image: null,
    });
    const [formData, setFormData] = useState<FormDataUpload>({
        struk_image: null,
    });
    const [strukData, setStrukData] = useState<Record<string, any>>({
        showAdmin: true,
    });

    // --- MEMOIZE OPTIONS UNTUK SEARCHABLE SELECT ---
    const layoutOptions = useMemo(() => {
        const defaultOption = {
          id: "default_system",
          label: "Layout Bawaan Sistem (Default)"
        };

        const customOptions = layoutData.map(layout => ({
          id: layout.id,
          label: layout.name
        }));

        return [defaultOption, ...customOptions];
    }, [layoutData]);

    useEffect(() => {
        rebuildFormSchema(DefaultConfigLayout);
    }, []);

    // Fungsi pembangun skema ulang data objek struk secara reaktif mengikuti config aktif
    const rebuildFormSchema = (targetConfig: ReceiptElement[]) => {
        const freshData = targetConfig
            .filter((el): el is InputTextConfig => el.type === 'input_text')
            .reduce((acc, el) => {
              acc[normalizeKey(el.label)] = '';
              return acc;
            }, {} as Record<string, any>);

        setStrukData({
            ...freshData,
            showAdmin: true,
        });
    };

    // --- LOGIKA MENANGANI PERGANTIAN LAYOUT TEMPLATE ---
    const handleLayoutSelect = (id: string | null) => {
        if (!id || id === "default_system") {
            setIsSwitchingLayout(true);
            setConfigId("default_system");

            setTimeout(() => {
                setConfig(DefaultConfigLayout);
                rebuildFormSchema(DefaultConfigLayout);
                setIsSwitchingLayout(false);
            }, 350);
            return;
        }

        setIsSwitchingLayout(true);
        setConfigId(id);

        setTimeout(() => {
            const selectedLayout = layoutData.find(l => l.id === id);
            if (selectedLayout) {
                const rawConfig = selectedLayout.config;
                const parsedConfig: ReceiptElement[] = typeof rawConfig === 'string' 
                  ? JSON.parse(rawConfig) 
                  : (rawConfig as unknown as ReceiptElement[]);
                
                setConfig(parsedConfig);
                rebuildFormSchema(parsedConfig);
            }
            setIsSwitchingLayout(false);
        }, 450);
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const name = e.target.name;
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPreviews(prev => ({ ...prev, [name]: result }));
                setFormData(prev => ({ ...prev, [name]: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (): Promise<void> => {

        if (!formData.struk_image) {
            setToast({
                type: 'error',
                title: 'Gagal',
                message: 'Mohon unggah gambar struk terlebih dahulu.'
            });
            return;
        }

        setIsGenerating(true);
        try {
            // 1. Filter config untuk mendapatkan daftar field yang butuh diekstraksi AI secara dinamis
            const fieldsToExtract = config
                .filter(el => el.type === 'input_text' && !NOT_TASK_AI_TYPE_INPUT.includes(el.dataType || ''))
                .map(el => ({
                    label: el.label,
                    key: normalizeKey(el.label),
                    dataType: el.dataType
                }));

            const res = await fetch("/api/image_to_raw_struk", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: formData.struk_image.split(",")[1],
                    mimeType: formData.struk_image.split(";")[0].split(":")[1],
                    targetFields: fieldsToExtract, 
                }),
            });

            if (!res.ok) {
                setToast({
                    type: 'error',
                    title: 'Gagal',
                    message: "Terjadi kesalahan saat OCR, Coba lagi"
                });
                return;
            }

            const aiResponse = await res.json();
            // const aiResponse: any = {
            //     "success": true,
            //     "extractedData": {
            //         "kode_referensi": "0120260516104503",
            //         "tanggal": "16 Mei 2026",
            //         "waktu": "17:45",
            //         "nama": "Ibunya Mimay",
            //         "e-wallet": "GoPay",
            //         "no.hp": "****2500",
            //         "nominal": "100000"
            //     },
            //     "modelUsed": "gemini-3-flash-preview"
            // }
            console.log(aiResponse);

            if(aiResponse.error) {
                setToast({
                    type: 'error',
                    title: 'Gagal',
                    message: aiResponse.error
                });
                return;
            }

            // Perbarui data struk menggunakan gabungan data lama dan hasil ekstraksi AI yang baru
            let updatedStrukData = {
                ...strukData,
                ...aiResponse.extractedData,
            };

            const { finalTotal, updates } = calculateReceiptTotal({
                config,
                formData: updatedStrukData,
                settings
            });
            updatedStrukData = {
                ...updatedStrukData,
                ...updates
            };
            setStrukData(updatedStrukData);

            // Logika Pengambilan Nama
            const findNameValue = () => {
                const priorityLabels = ['penerima', 'nama'];
                for (const target of priorityLabels) {
                    const found = config.find(el => el.label?.toLowerCase() === target);
                    if (found) {
                        const val = updatedStrukData[normalizeKey(found.label || "")];
                        if (val && val.trim() !== "") return val;
                    }
                }
                for (const target of priorityLabels) {
                    const found = config.find(el => {
                        const labelLower = el.label?.toLowerCase() || "";
                        return (labelLower.includes(target) && !labelLower.includes('toko') && !labelLower.includes('bank'));
                    });
                    if (found) {
                        const val = updatedStrukData[normalizeKey(found.label || "")];
                        if (val && val.trim() !== "") return val;
                    }
                }
                return null;
            };
        
            const randomText = Math.random().toString(36).substring(2, 10).toUpperCase();
            const namaHistory = findNameValue() || updatedStrukData['user'] || randomText;
        
            // Simpan Ke History Database
            const saveInHistory = await createReceipt({
                nama: namaHistory,
                layoutId: configId === "default_system" ? null : configId,
                total: finalTotal,
                content: updatedStrukData,
                type: "upload"
            });

            if(saveInHistory.success) {
                setShowModal(true);
            } else {
                setToast({
                    type: 'error',
                    title: 'Gagal',
                    message: 'Gagal menyimpan data ke history'
                });
                return;
            }
        } catch (err) {
            console.error(err);
            setToast({
                type: 'error',
                title: 'Gagal',
                message: 'Terjadi kesalahan saat OCR, Coba lagi'
            });
        } finally {
            setIsGenerating(false);
        }
    }

    return (
        <div className="px-2 sm:px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-8">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                    Unggah Struk Anda
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm md:text-base">
                    Unggah gambar struk Anda untuk membuat struk baru dari awal.
                </p>
            </header>

            {toast && (
                <Toast toast={toast} setToast={setToast} />
            )}

            <div className="space-y-6">
                
                {/* SECTION 1: SEARCHABLE SELECT TEMPLATE DESIGN (Full width / Block atas) */}
                <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 sm:p-5 rounded-2xl shadow-sm">
                  <SearchableSelect 
                    labelTitle="Pilih Target Template Desain Struk"
                    placeholder="Cari desain struk kustom Anda..."
                    selectedId={configId}
                    onSelect={handleLayoutSelect}
                    options={layoutOptions}
                  />
                </div>

                {/* SECTION 2: CONTAINER DROPZONE UPLOAD */}
                {isSwitchingLayout ? (
                  /* Keadaan loading transisi saat layout ditukar */
                  <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 gap-3">
                    <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
                    <p className="text-xs sm:text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest animate-pulse">
                      Menyesuaikan Target Ekstraksi AI...
                    </p>
                  </div>
                ) : (
                  /* Form Upload Utama */
                  <div className="space-y-6 animate-in fade-in zoom-in-95 duration-250">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center min-h-[40px]">
                            <label className="block text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                              Unggah Gambar Struk Fisik
                            </label>
                        </div>
                        <div className="flex-grow">
                            <div className="group relative border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl h-52 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition overflow-hidden shadow-sm">
                            {previews.struk_image ? (
                                <img src={previews.struk_image} className="h-full w-full object-contain p-4" alt="Struk Preview" />
                            ) : (
                                <>
                                    <Upload className="w-12 h-12 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                    <p className="text-sm text-gray-500 dark:text-zinc-400 mt-3 font-semibold text-center px-4">Pilih gambar struk (JPG, PNG)</p>
                                </>
                            )}
                            <input type="file" accept="image/*" name='struk_image' onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isGenerating} />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: CHECKBOX OPTIONS CARD */}
                    <div className="bg-white dark:bg-zinc-900 p-4 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm w-full">
                        <Checkbox
                            label="Tampilkan Biaya Admin pada Preview"
                            checked={strukData.showAdmin ?? true}
                            onChange={() => 
                                setStrukData((prev) => ({
                                    ...prev, 
                                    showAdmin: !prev.showAdmin 
                                }))
                            }
                        />
                    </div>

                    {/* SECTION 4: TRIGGER SUBMIT BUTTON */}
                    <div className="my-5">
                        <button 
                          onClick={handleSubmit} 
                          disabled={isGenerating} 
                          className="w-full cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black py-5 px-8 rounded-2xl transition-all shadow-xl shadow-blue-600/10 flex items-center justify-center gap-3 tracking-widest uppercase text-sm"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <FileText size={20} />}
                            {isGenerating ? "MENGOLAH DATA..." : "BUAT STRUK"}
                        </button>
                    </div>
                  </div>
                )}
            </div>

            <PreviewPage
                show={showModal}
                onClose={() => setShowModal(false)}
                formData={strukData} 
                setFormData={setStrukData}
                isGenerating={isGenerating}
                config={config}
                setIsGenerating={setIsGenerating}
                settings={settings}
            />
        </div>
    );
};

export default PageUploadStrukClient;