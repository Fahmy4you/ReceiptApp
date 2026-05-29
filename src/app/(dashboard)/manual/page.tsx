import PageManualStrukClient from "@/client/PageManualStrukClient";
import LoadingScreenSkeleton from "@/components/Loading";
import { SettingsData } from "@/lib/types";
import { getAllLayouts } from "@/models/Layout";
import { getSettingByUserId } from "@/models/Settings";
import { Suspense } from "react";

export default async function App() {
  
  const layoutData = await getAllLayouts()
  const settings = await getSettingByUserId();
  const settingsData = settings ? settings.data : null;

  return (
      <Suspense fallback={<LoadingScreenSkeleton/>}>
        <PageManualStrukClient settings={settingsData as SettingsData | null} layoutData={layoutData}  />
      </Suspense>
    );
}