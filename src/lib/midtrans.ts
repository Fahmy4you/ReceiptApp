"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BILLINGCYCLE } from "@prisma/client";
// @ts-ignore
import midtransClient from "midtrans-client";
import { getTransactionPendingByUserId } from "@/models/LicenseTransaction";

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

interface SnapPayload {
  licenseId: string;
  total: number;
  billingCycle: BILLINGCYCLE;
}

export const createSnapTransaction = async (payload: SnapPayload) => {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthenticated" };

  const transaksi_pending = await getTransactionPendingByUserId(session.user.id);
  if (transaksi_pending) return { success: false, error: "Anda Masih Mempunyai Transaksi Pending" };

  const orderId = `RECEIPTAPP-${session.user.id.slice(-10)}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`.slice(0, 48);

  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: payload.total,
    },
    customer_details: {
      first_name: session.user.name || "User",
      email: session.user.email || "user@example.com",
    },
    credit_card: {
      secure: true,
    },
    callbacks: {
      finish: `${process.env.NEXTAUTH_URL}/license/payment/exec/${orderId}`,
    },
  };

  try {
    const midtransResponse = await snap.createTransaction(parameter);
    const token = midtransResponse.token;

    const expiredDate = new Date();
    expiredDate.setHours(expiredDate.getHours() + 24);

    await prisma.licenseTRX.create({
      data: {
        id: orderId,
        userId: session.user.id,
        licenseId: payload.licenseId,
        total: payload.total,
        billingCycle: payload.billingCycle,
        paymentMethod: "qris",
        paymentCode: token,
        status: "PENDING",
        expiredDate,
      },
    });

    return { success: true, token, orderId };
  } catch (error: any) {
    console.error("Midtrans Snap Error:", error);
    return { success: false, error: error.message || "Gagal berkomunikasi dengan Midtrans" };
  }
};