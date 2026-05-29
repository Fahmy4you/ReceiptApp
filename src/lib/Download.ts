export const DownloadStruk = async (formData: any, config: any, format: 'pdf' | 'png' = 'pdf') => {
    const res = await fetch("/api/cetak_struk", { // Sesuaikan route API Anda
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, config, format }),
    });

    if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.error ?? "Terjadi kesalahan saat generate file");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `struk-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 100);
};

export const generateStrukBlob = async (formData: any, config: any, format: 'pdf' | 'png' = 'pdf'): Promise<Blob> => {
  const res = await fetch("/api/cetak_struk", {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ formData, config, format }),
  });

  if (!res.ok) {
    const errorJson = await res.json();
    throw new Error(errorJson.error ?? "Terjadi kesalahan saat generate file");
  }

  return await res.blob();
};