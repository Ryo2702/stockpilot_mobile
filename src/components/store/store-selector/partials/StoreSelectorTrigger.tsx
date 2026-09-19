import { ChevronDown, Plus, Store } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import type { StoreSelectorProps } from "../types";
import { createStoreSelectorStyles } from "../store-selector.styles";

type StoreSelectorTriggerProps = Pick<
  StoreSelectorProps,
  "ownerStore" | "onCreateStore" | "showAddStoreButton" | "compact" | "disabled"
> & {
  open: boolean;
  onToggle: () => void;
  onAddStore: () => void;
};

export default function StoreSelectorTrigger({
  ownerStore,
  onCreateStore,
  showAddStoreButton = false,
  compact = false,
  disabled = false,
  open,
  onToggle,
  onAddStore,
}: StoreSelectorTriggerProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStoreSelectorStyles);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Select store, current ${ownerStore.storeName}`}
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.selector,
          showAddStoreButton && styles.expandedSelector,
          compact && styles.compactSelector,
          disabled && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <Store color={colors.primary[600]} size={18} strokeWidth={2} />
        <View style={styles.selectorCopy}>
          {!compact ? <Text style={styles.selectorLabel}>Current store</Text> : null}
          <Text numberOfLines={1} style={styles.selectorName}>
            {ownerStore.storeName}
          </Text>
        </View>
        <ChevronDown color={colors.text.secondary} size={18} />
      </Pressable>
      {showAddStoreButton && onCreateStore ? (
        <Button
          title="Add store"
          icon={Plus}
          size="md"
          variant="secondary"
          disabled={disabled}
          onPress={onAddStore}
          style={styles.visibleAddButton}
        />
      ) : null}
    </>
  );
}
