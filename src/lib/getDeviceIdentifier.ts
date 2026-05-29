"use server"
import { cookies } from "next/headers";

export const getDeviceIdentifier = async (): Promise<string> => {
  const cookieStore = await cookies();
  const deviceId = cookieStore.get('device_fingerprint')?.value;
  
  if (!deviceId) {
    throw new Error("Perangkat tidak dikenali (Fingerprint hilang pada browser)");
  }
  
  return deviceId;
};