import PageLayoutListClient from "@/client/PageLayoutListClient";
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
    <PageLayoutListClient settingsData={settingsData as SettingsData | null} />
  )
};

export default App;