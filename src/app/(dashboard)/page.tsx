import PageHomeClient from '@/client/PageHomeClient'
import LoadingScreenSkeleton from '@/components/Loading'
import { auth } from '@/lib/auth';
import { DEFAULT_SETTINGS_FIRST_LOGIN } from '@/lib/constanta';
import { SettingsData } from '@/lib/types';
import { getSettingByUserId } from '@/models/Settings';
import { Suspense } from 'react'

const page = async () => {
  const session = await auth();
    
  let settings = undefined
  if(session) {
    settings = await getSettingByUserId();
  }

  const initialData = (
    settings?.data 
      ? (settings.data as unknown as SettingsData) 
      : DEFAULT_SETTINGS_FIRST_LOGIN
  ) as SettingsData;
  

  return (
    <Suspense fallback={<LoadingScreenSkeleton/>}>
      <PageHomeClient settingData={initialData as SettingsData}/>
    </Suspense>
  )
}

export default page
