"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BILLINGCYCLE, METHODEPAYMENT } from "@prisma/client";
// @ts-ignore
import midtransClient from "midtrans-client";
import { getTransactionPendingByUserId } from "@/models/LicenseTransaction";

const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

interface ChargePayload {
  licenseId: string;
  total: number;
  billingCycle: BILLINGCYCLE;
  paymentMethod: METHODEPAYMENT;
}

export const chargePaymentMidtrans = async (payload: ChargePayload) => {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthenticated" };
  
  // CEK PUNYA TRANSAKSI ATAU TIDAK YANG MASIH PENDING
  const transaksi_pending = await getTransactionPendingByUserId(session.user.id);
  if(transaksi_pending) return { success: false, error: "Anda Masih Mempunyai Transaksi Pending" };

  const orderId = `STRUKAPP-${session.user.id.slice(-10)}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`.slice(0, 48);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL + `/license/payment/${orderId}` || "http://localhost:3000";

  let midtransPayload: any = {
    transaction_details: {
      order_id: orderId,
      gross_amount: payload.total,
    },
    customer_details: {
      first_name: session.user.name || "User",
      email: session.user.email || "user@example.com",
    },
  };

  const methodLower = payload.paymentMethod.toLowerCase();

  if (methodLower === "qris") {
    midtransPayload.payment_type = "gopay"; 
  } else if (methodLower === "gopay") {
    midtransPayload.payment_type = "gopay";
    midtransPayload.gopay = {
      callback_url: `${appUrl}/payment/status?order_id=${orderId}`
    };
  } else if (methodLower === "shopeepay") {
    midtransPayload.payment_type = "shopeepay";
    midtransPayload.shopeepay = {
      callback_url: `${appUrl}/payment/status?order_id=${orderId}`
    };
  } else {
    midtransPayload.payment_type = "bank_transfer";
    midtransPayload.bank_transfer = {
      bank: methodLower, 
    };
    
    if (methodLower === "mandiri") {
      midtransPayload.payment_type = "echannel";
      midtransPayload.echannel = {
        bill_info1: "Payment For License",
        bill_info2: "StrukApp Subscription",
      };
    }
  }

  try {
    const midtransResponse = await coreApi.charge(midtransPayload);
    let paymentCode = "";
    if (methodLower == "qris") {
      paymentCode = midtransResponse.actions?.find((a: any) => a.name === "generate-qr-code")?.url || "";
    } else if (methodLower == "gopay" || methodLower == "shopeepay") {
      paymentCode = midtransResponse.actions?.find((a: any) => a.name === "deeplink-redirect")?.url || "";
    } else if (methodLower == "mandiri") {
      paymentCode = `${midtransResponse.bill_key} | ${midtransResponse.biller_code}`;
    } else {
      paymentCode = midtransResponse.va_numbers?.[0]?.va_number || "";
    }

    const expiredDate = new Date();
    expiredDate.setHours(expiredDate.getHours() + 24); 

    const dataToCreate = {
        id: orderId,
        userId: session.user.id,
        licenseId: payload.licenseId,
        total: payload.total,
        billingCycle: payload.billingCycle,
        paymentMethod: payload.paymentMethod,
        paymentCode: paymentCode,
        status: "PENDING",
        expiredDate: expiredDate,
    } as const;

    const newTx = await prisma.licenseTRX.create({ data: dataToCreate });

    return { success: true, data: newTx };
  } catch (error: any) {
    console.error("Midtrans Core API Error:", error);
    return { success: false, error: error.message || "Gagal berkomunikasi dengan Midtrans" };
  }
};