import PagePaymentClient from '@/client/payment_license/PagePaymentClient';
import LoadingScreenSkeleton from '@/components/Loading'
import { auth } from '@/lib/auth';
import { LICENSE_PAYMENT_BILLING } from '@/lib/constanta';
import { getLicenseById } from '@/models/License';
import { getTransactionPendingByUserId } from '@/models/LicenseTransaction';
import { LicenseTRX } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
import React, { Suspense } from 'react'

const page = async ({ searchParams }: {searchParams: Promise<{ [key: string]: string | string[] | undefined }>}) => {
    const session = await auth();
    const resolvedParams = await searchParams;
    const licenseId = resolvedParams.license as string;
    const billingQuery = resolvedParams.billing as string;

    if(session) {
        const transaction = await getTransactionPendingByUserId(session.user.id);
        if(transaction) redirect('/license/payment/exec/' + transaction.id)
    }

    if (!licenseId || typeof licenseId != "string" || !billingQuery || !(LICENSE_PAYMENT_BILLING as any).includes(billingQuery)) notFound();
    const licenseExists = await getLicenseById(licenseId);
    if(licenseExists == null) notFound();

    return (
        <Suspense fallback={<LoadingScreenSkeleton/>}>
            <PagePaymentClient licenseData={licenseExists} billing={billingQuery as any} />
        </Suspense>
    )
}

export default page
