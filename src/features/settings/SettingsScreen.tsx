import SettingsScreenView from "./SettingsScreenView";
import useSettingsScreen from "./settings.controller";
import type { SettingsScreenProps } from "./settings.controller";

export type { SettingsPage, SettingsScreenProps } from "./settings.controller";

export default function SettingsScreen(props: SettingsScreenProps) {
  const settings = useSettingsScreen(props);
  return <SettingsScreenView {...props} settings={settings} />;
}

export { SettingsGroup, SettingsRow } from "./settings.components";
