import PageHistoryClient from "@/client/PageHistoryClient";
import { auth } from "@/lib/auth";
import { SettingsData } from "@/lib/types";
import { getSettingByUserId } from "@/models/Settings";

const App: React.FC = async () => {
  const session = await auth();
  
  let settings = null
  if(session) {
    settings = await getSettingByUserId();
  }
  const settingsData = settings ? settings.data : null;

  return (
    <PageHistoryClient settingsData={settingsData as SettingsData | null} />
  )
};

export default App;