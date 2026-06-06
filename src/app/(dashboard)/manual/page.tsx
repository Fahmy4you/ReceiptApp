import PageManualStrukClient from "@/client/PageManualStrukClient";
import LoadingScreenSkeleton from "@/components/Loading";
import { auth } from "@/lib/auth";
import { DEFAULT_SETTINGS_FIRST_LOGIN, exampleLayoutData } from "@/lib/constanta";
import { SettingsData } from "@/lib/types";
import { getAllLayouts } from "@/models/Layout";
import { getSettingByUserId } from "@/models/Settings";
import { Layout } from "@prisma/client";
import { Suspense } from "react";

export default async function App() {
  
  const session = await auth();
    
  let settings = undefined
  let layoutData: Layout[] = exampleLayoutData as any; 
  if(session) {
    layoutData = await getAllLayouts(); 
    settings = await getSettingByUserId();
  }
  const settingsData = settings ? settings.data : DEFAULT_SETTINGS_FIRST_LOGIN;

  return (
      <Suspense fallback={<LoadingScreenSkeleton/>}>
        <PageManualStrukClient settings={settingsData as SettingsData | null} layoutData={layoutData}  />
      </Suspense>
    );
}