import PageHistoryClient from "@/client/PageHistoryClient";
import { SettingsData } from "@/lib/types";
import { getSettingByUserId } from "@/models/Settings";

const App: React.FC = async () => {
  const settings = await getSettingByUserId()
  const settingsData = settings ? settings.data : null;
  console.log(settingsData)

  return (
    <PageHistoryClient settingsData={settingsData as SettingsData | null} />
  )
};

export default App;