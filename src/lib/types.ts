import { Prisma, StatusLisensi } from "@prisma/client";
import { weightConstanta } from "@/lib/constanta";
import { IconType } from "react-icons";

export interface AdminRange {
  id: string;
  min: number;
  max: number | null; // null berarti "ke atas"
  fee: number;
}

export interface SettingsData {
  shopName: string;
  alamat: string | null;
  logo: string | null;
  adminFee: {
    type: 'fixed' | 'range' | 'multiplier';
    fixedValue: number;
    ranges: AdminRange[];
    multiplier: {
      step: number;
      fee: number;
    };
  };
  reference: {
    type: 'full' | 'limited';
    digitLimit: number;
  };
}

export type ElementType = 'input_text' | 'input_image' | 'text' | 'separator';

export interface ReceiptElement {
  id: string;
  type: ElementType;
  label?: string;
  value?: string;
  fontSize?: number;       
  labelFontSize?: number;  
  valueFontSize?: number;  
  fontWeight?: string;
  labelFontWeight?: string;  
  valueFontWeight?: string;  
  color?: string;
  alignment?: 'left' | 'center' | 'right';
  hasBorder?: boolean;
  marginTop?: number;      
  marginBottom?: number;   
  gap?: number;            
  width?: number;
  height?: number;
  source?: 'upload' | 'logo';
  style?: 'dash' | 'line' | 'double_line' | 'double_dash';
  dataType?: string;
  position?: string;
  showLabel?: boolean;
  labelLayout?: 'inline' | 'stacked';
  exampleValue?: string;
  letterSpacing?: number;
  labelLetterSpacing?: number; 
  valueLetterSpacing?: number; 
  thickness?: number;          
}

export type DataType = 'String' | 'Number' | 'Date' | 'Time' | 'Currency' | 'Hidden' | 'random_text' | 'random_number' | 'random_mixed' | 'Admin_Fee' | 'Store_Name' | 'total_keseluruhan' | 'Nominal' | 'Referensi' | 'Alamat_Toko';
export type Alignment = 'left' | 'center' | 'right';
export type SeparatorType = 'dash' | 'line';
export type LabelLayout = 'inline' | 'stacked';
export type FontWeight = 'normal' | 'bold' | '900';
export interface InputTextConfig {
  id: string;
  type: 'input_text';
  label: string;
  dataType: string;
  position: string;
  fontSize: number;
  color: string;
}

export type ReceiptWithLayout = Prisma.ReceiptGetPayload<{
  include: { layout: true }
}>;

export type CustomFontWeight = keyof typeof weightConstanta;

export interface BaseElement {
  id: string;
  type: ElementType;
  marginTop?: number;   
  marginBottom?: number; 
}

export interface InputTextElement extends BaseElement {
  type: 'input_text';
  label: string;
  showLabel: boolean;
  dataType: DataType;
  position: 'default' | 'center';
  labelLayout: LabelLayout;
  labelFontSize: number;
  valueFontSize: number;
  labelFontWeight: CustomFontWeight;
  valueFontWeight: CustomFontWeight;
  color: string;
  exampleValue: string;
  hasBorder?: boolean;
  gap?: number; 
  labelLetterSpacing?: number;
  valueLetterSpacing?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  value: string;
  fontSize: number;
  fontWeight: CustomFontWeight;
  alignment: Alignment;
  hasBorder?: boolean;
  color: string;
  letterSpacing?: number;
}

export interface SeparatorElement extends BaseElement {
  type: 'separator';
  style: 'line' | 'dash' | 'double_line' | 'double_dash';
  color: string;
  thickness?: number; // Fitur Baru Ketebalan
}

export type ThemeType = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export interface ToastState {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export interface PricingPlan {
  id: StatusLisensi;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceAnnually: number;
  tokens: string;
  layouts: string;
  features: string[];
  colorTheme: string;
  buttonTheme: string;
  badgeText?: string;
  icon: IconType;
}