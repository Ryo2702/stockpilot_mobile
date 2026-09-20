import useInsightsScreen from "./hooks/useInsightsScreen";
import InsightsScreenView from "./partials/InsightsScreenView";
import type { InsightsScreenProps } from "./types/insights-screen.types";

export default function InsightsScreen(props: InsightsScreenProps) {
  const insights = useInsightsScreen(props.ownerStore);
  return <InsightsScreenView {...props} insights={insights} />;
}
