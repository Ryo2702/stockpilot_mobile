import { useEffect, type DependencyList } from "react";

type AsyncEffect = (isActive: () => boolean) => void;

export default function useAsyncEffect(effect: AsyncEffect, dependencies: DependencyList) {
  useEffect(() => {
    let active = true;
    effect(() => active);

    return () => {
      active = false;
    };
  }, dependencies);
}
