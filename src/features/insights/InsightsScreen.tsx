import useInsightsScreen from "./hooks/useInsightsScreen";
import InsightsScreenView from "./components/InsightsScreenView";
import type { InsightsScreenProps } from "./types";

export default function InsightsScreen(props: InsightsScreenProps) {
  const insights = useInsightsScreen(props.ownerStore);
  return <InsightsScreenView {...props} insights={insights} />;
}
