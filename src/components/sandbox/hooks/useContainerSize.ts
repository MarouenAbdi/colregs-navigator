/**
 * useContainerSize -- tracks the chart container's live pixel size via
 * ResizeObserver, used to drive chartToScreen()/screenToChart(). Holds no
 * knowledge of chart content or pointer gestures; it only observes a DOM
 * element's contentRect and forwards width/height as they change.
 */

import { useEffect, useRef, useState } from "react";
import { type ContainerSize } from "../../../domain/geometry/screen-convert.js";

export function useContainerSize(): {
  containerRef: React.RefObject<HTMLDivElement>;
  containerSize: ContainerSize | null;
} {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<ContainerSize | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setContainerSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { containerRef, containerSize };
}
