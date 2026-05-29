import PageHomeClient from '@/client/PageHomeClient'
import LoadingScreenSkeleton from '@/components/Loading'
import { Suspense } from 'react'

const page = async () => {
  

  return (
    <Suspense fallback={<LoadingScreenSkeleton/>}>
      <PageHomeClient/>
    </Suspense>
  )
}

export default page
