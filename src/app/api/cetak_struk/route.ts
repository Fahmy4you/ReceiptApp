import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { DefaultConfigLayout } from '@/lib/constanta';
import { fontConfig, weightConstanta } from '@/lib/constanta';
import { cleanCurrencyInput, formatIDR, formatReceiptDate } from '@/lib/Helpers';
import { cookies } from 'next/headers';
import { trackUserPrintActivity } from '@/models/UserStatistic';

const normalizeKey = (label?: string) => label ? label.toLowerCase().trim().replace(/\s+/g, '_') : '';
if (!Handlebars.helpers.eq) {
    Handlebars.registerHelper('eq', (a, b) => a === b);
}

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const deviceId = cookieStore.get('device_fingerprint')?.value;
    
        if (!deviceId) {
            return NextResponse.json({ error: "ID Perangkat tidak ditemukan" }, { status: 400 });
        }
        
        const body = await req.json();
        let { formData, config, format = 'pdf', print = false } = body;

        if(format == 'png') {
            await trackUserPrintActivity('IMAGE');
        } else {
            await trackUserPrintActivity('PDF');
        }
        
        const { protocol, host } = new URL(req.url);
        const baseUrl = `${protocol}//${host}`;

        if (!config) {
            config = DefaultConfigLayout;
        }

        // 1. Mapping Elemen Dinamis (Mendukung Margin, Gap, Pemisahan Spacing & Weight Terpisah)
        const mappedElements = config.map((el: any) => {
            const key = normalizeKey(el.label);
            
            // Base spacing fallback untuk semua jenis tipe elemen
            const baseSpacing = {
                marginTop: el.marginTop !== undefined ? el.marginTop : 0,
                marginBottom: el.marginBottom !== undefined ? el.marginBottom : 0,
            };

            if (el.type === 'input_image') {
                let logoSrc = formData.logo_image || formData.logo || el.value || "";
                if (logoSrc && logoSrc.startsWith('/')) {
                    const filePath = path.join(process.cwd(), 'public', logoSrc);
                    if (fs.existsSync(filePath)) {
                        const fileBuffer = fs.readFileSync(filePath);
                        const ext = path.extname(logoSrc).toLowerCase();
                        const mimeMap: Record<string, string> = {
                            '.png': 'image/png',
                            '.jpg': 'image/jpeg',
                            '.jpeg': 'image/jpeg',
                            '.webp': 'image/webp',
                        };
                        const mime = mimeMap[ext] || 'image/png';
                        logoSrc = `data:${mime};base64,${fileBuffer.toString('base64')}`;
                    } else {
                        logoSrc = `${baseUrl}${logoSrc}`;
                    }
                }
                return { 
                    ...baseSpacing, 
                    isLogo: true, 
                    src: logoSrc, 
                    width: el.width || 80, 
                    height: el.height || 80 
                };
            }

            if (el.type === 'text') {
                return { 
                    ...baseSpacing, 
                    isTitle: true, 
                    value: el.value, 
                    alignment: el.alignment || 'center', 
                    fontSize: el.fontSize || 14, 
                    fontWeight: weightConstanta[el.fontWeight as keyof typeof weightConstanta] || 400, 
                    color: el.color || '#000', 
                    hasBorder: el.hasBorder,
                    letterSpacing: el.letterSpacing !== undefined ? el.letterSpacing : 0
                };
            }

            if (el.type === 'separator') {
                return { 
                    ...baseSpacing,
                    isSeparator: true, 
                    isDouble: String(el.style).includes('double'), 
                    borderType: String(el.style).includes('dash') ? 'dashed' : 'solid', 
                    color: el.color || '#000',
                    thickness: el.thickness !== undefined ? el.thickness : 2 // Meneruskan data ketebalan garis dinamis
                };
            }

            if (formData.showAdmin === false && el.dataType === 'Admin_Fee') {
                return null;
            }

            if (el.type === 'input_text') {
                let rawValue = formData[key] || "-";
                const currencyTypes = ['Nominal', 'Admin_Fee', 'total_keseluruhan', 'Currency', 'Admin_fee'];
                if (currencyTypes.includes(el.dataType) && rawValue != '-' && rawValue != '' ) {
                    const cleanNum = cleanCurrencyInput(rawValue);
                    rawValue = `Rp ${formatIDR(cleanNum)}`;
                }

                if(el.dataType == 'Date' && rawValue != '-' && rawValue != '') {
                    rawValue = formatReceiptDate(rawValue);
                }
                const currentCase = formData.textCase || 'none'; 
                const textCaseStyleCss = `text-transform: ${currentCase};`;

                return {
                    ...baseSpacing,
                    isInput: true,
                    label: el.label,
                    value: rawValue,
                    showLabel: el.showLabel,
                    // Penyesuaian Pemisahan Font Weight Angka Murni untuk Label dan Value
                    labelFontWeight: weightConstanta[el.labelFontWeight as keyof typeof weightConstanta] || 400,
                    valueFontWeight: weightConstanta[el.valueFontWeight as keyof typeof weightConstanta] || 400,
                    color: el.color || '#000', 
                    isStacked: el.labelLayout === 'stacked',
                    isCentered: el.position === 'center',
                    isTotal: el.dataType === 'total_keseluruhan',
                    hasBorder: el.hasBorder,
                    gap: el.gap !== undefined ? el.gap : 12,
                    // Penyesuaian Pemisahan Letter Spacing untuk Label dan Value
                    labelLetterSpacing: el.labelLetterSpacing !== undefined ? el.labelLetterSpacing : 0,
                    valueLetterSpacing: el.valueLetterSpacing !== undefined ? el.valueLetterSpacing : 0,
                    labelFontSize: el.labelFontSize || el.fontSize || 12,
                    valueFontSize: el.valueFontSize || el.fontSize || 12,
                    textCaseStyle: textCaseStyleCss
                };
            }
            return null;
        }).filter(Boolean);

        // 2. Load & Compile Template
        let templatePath = path.join(process.cwd(), 'src', 'templates', 'struk_template.html');
        if(print == true) {
            console.log("aku memakai ini")
            templatePath = path.join(process.cwd(), 'src', 'templates', 'struk_template_print.html');
        }
        const templateSource = fs.readFileSync(templatePath, 'utf-8');
        const template = Handlebars.compile(templateSource);
        
        const finalHtml = template({ 
            elements: mappedElements,
            fontConfig: fontConfig
        });

        const browser = await puppeteer.launch({
            // 1. Jalankan mode headless (tanpa tampilan UI)
            headless: true, 
            
            // 2. Tambahkan argumen wajib untuk server Linux ini
            args: [
                '--no-sandbox',                      // WAJIB: Mematikan sandbox Linux (karena jalankan sebagai root/www)
                '--disable-setuid-sandbox',          // WAJIB: Tambahan pendukung no-sandbox
                '--disable-dev-shm-usage',           // WAJIB: Memakai folder /tmp, bukan /dev/shm (biar gak crash kekurangan RAM)
                '--disable-crash-reporter',          // Solusi error crashpad_handler kamu
                '--disable-extensions',              // Mematikan ekstensi biar lebih ringan
                '--no-zygote'                        // Mencegah Chrome membuat proses anak yang bikin crash di Linux
            ]
        });

        const page = await browser.newPage();
        
        if (format == 'png') {
            await page.setViewport({ width: 375, height: 800, deviceScaleFactor: 2 });
        }
        
        await page.setContent(finalHtml, { waitUntil: 'load' });
        await page.evaluateHandle('document.fonts.ready');

        const height = await page.evaluate(() => document.documentElement.offsetHeight);

        let buffer: Buffer;
        let contentType: string;
        let fileExtension: string;

        if (format == 'png') {
            const element = await page.$('.receipt'); 
            if (!element) throw new Error("Element .receipt tidak ditemukan");

            const screenshot = await element.screenshot({
                type: 'png',
                omitBackground: false 
            });
            buffer = Buffer.from(screenshot);
            contentType = "image/png";
            fileExtension = "png";
        } else {
            const pdf = await page.pdf({
                printBackground: true,
                width: '58mm',
                height: `${height + 20}px`,
                margin: { top: 0, right: 0, bottom: 0, left: 0 },
            });
            buffer = Buffer.from(pdf);
            contentType = "application/pdf";
            fileExtension = "pdf";
        }

        await browser.close();

        return new Response(new Uint8Array(buffer), {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `attachment; filename=struk-${Date.now()}.${fileExtension}`,
            },
        });

    } catch (error: any) {
        console.error("Download Error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}