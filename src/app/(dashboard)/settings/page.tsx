import PageSettingsClient from "@/client/PageSettingClient";
import LoadingScreenSkeleton from "@/components/Loading";
import { DEFAULT_SETTINGS_FIRST_LOGIN } from "@/lib/constanta";
import { SettingsData } from "@/lib/types";
import { getSettingByUserId } from "@/models/Settings";
import { Suspense } from "react";

export default async function Page() {

  const settings = await getSettingByUserId()

  const initialData = (
    settings?.data 
      ? (settings.data as unknown as SettingsData) 
      : DEFAULT_SETTINGS_FIRST_LOGIN
  ) as SettingsData;

  return (
    <Suspense fallback={<LoadingScreenSkeleton/>}>
      <PageSettingsClient initialData={initialData as SettingsData} />
    </Suspense>
  );
}