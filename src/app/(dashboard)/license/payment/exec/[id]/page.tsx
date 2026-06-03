import PageExecutionPayment from '@/client/payment_license/PageExecutionPayment';
import LoadingScreenSkeleton from '@/components/Loading'
import { auth } from '@/lib/auth';
import { getTransactionPendingByUserId } from '@/models/LicenseTransaction';
import { notFound, redirect } from 'next/navigation';
import React, { Suspense } from 'react'

const page = async () => {
    const session = await auth();
    if(!session) redirect("/");
    const transaction = await getTransactionPendingByUserId(session.user.id);
    if(!transaction) return notFound();

    return (
        <Suspense fallback={<LoadingScreenSkeleton/>}>
            <PageExecutionPayment transaction={transaction} />
        </Suspense>
    )
}

export default page
