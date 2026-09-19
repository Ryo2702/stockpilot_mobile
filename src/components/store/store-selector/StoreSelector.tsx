import { View } from "react-native";

import { useThemeStyles } from "@/theme/ThemeProvider";

import useStoreSelector from "./hooks/useStoreSelector";
import StoreSelectorModal from "./partials/StoreSelectorModal";
import StoreSelectorTrigger from "./partials/StoreSelectorTrigger";
import { createStoreSelectorStyles } from "./store-selector.styles";
import type { StoreSelectorProps } from "./types";

export default function StoreSelector(props: StoreSelectorProps) {
  const selector = useStoreSelector(props);
  const styles = useThemeStyles(createStoreSelectorStyles);

  return (
    <View
      style={[
        styles.container,
        props.showAddStoreButton && styles.expandedContainer,
        props.compact && styles.compactContainer,
      ]}
    >
      <StoreSelectorTrigger
        ownerStore={props.ownerStore}
        onCreateStore={props.onCreateStore}
        showAddStoreButton={props.showAddStoreButton}
        compact={props.compact}
        disabled={props.disabled}
        open={selector.open}
        onToggle={selector.toggle}
        onAddStore={selector.openCreate}
      />
      <StoreSelectorModal
        ownerStore={props.ownerStore}
        onCreateStore={props.onCreateStore}
        showAddStoreButton={Boolean(props.showAddStoreButton)}
        disabled={Boolean(props.disabled)}
        selector={selector}
      />
    </View>
  );
}
