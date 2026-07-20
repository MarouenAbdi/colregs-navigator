/**
 * ChartBackdrop -- the chart's decorative chrome: the fine-grid texture
 * pattern, the nm-scale gridlines, the range rings, the N/E-W crosshair,
 * and the "N" label. Purely presentational -- no pointer handlers, no
 * internal state -- so it can never intercept a hull-drag or rotate-drag
 * gesture aimed at the vessels drawn on top of it.
 */

import {
  buildGridLineSegments,
  CHART_VIEW_BOX,
  CROSSHAIR_STROKE,
  FINE_GRID_CELL_PX,
  FINE_GRID_STROKE,
  GRID_STROKE,
  RANGE_RING_STROKE,
} from "./chart-panel-geometry.js";
import { type ContainerSize } from "../../domain/geometry/screen-convert.js";

export interface ChartBackdropProps {
  containerSize: ContainerSize;
  chartCenter: { screenX: number; screenY: number };
  innerRingRadiusPx: number;
  outerRingRadiusPx: number;
}

export function ChartBackdrop({
  containerSize,
  chartCenter,
  innerRingRadiusPx,
  outerRingRadiusPx,
}: ChartBackdropProps) {
  return (
    <>
      <defs>
        <pattern
          id="chart-fine-grid"
          width={FINE_GRID_CELL_PX}
          height={FINE_GRID_CELL_PX}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${FINE_GRID_CELL_PX} 0 H 0 V ${FINE_GRID_CELL_PX}`}
            fill="none"
            stroke={FINE_GRID_STROKE}
            strokeWidth={1}
          />
        </pattern>
      </defs>
      <rect width={containerSize.width} height={containerSize.height} fill="url(#chart-fine-grid)" />
      <g>
        {buildGridLineSegments(containerSize, CHART_VIEW_BOX).map((seg) => (
          <line
            key={seg.key}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke={GRID_STROKE}
            strokeWidth={1}
          />
        ))}
      </g>
      <g stroke={RANGE_RING_STROKE} fill="none">
        <circle cx={chartCenter.screenX} cy={chartCenter.screenY} r={innerRingRadiusPx} />
        <circle cx={chartCenter.screenX} cy={chartCenter.screenY} r={outerRingRadiusPx} />
      </g>
      <g stroke={CROSSHAIR_STROKE} strokeWidth={1}>
        <line
          x1={chartCenter.screenX}
          y1={chartCenter.screenY - innerRingRadiusPx}
          x2={chartCenter.screenX}
          y2={chartCenter.screenY + innerRingRadiusPx}
        />
        <line
          x1={chartCenter.screenX - innerRingRadiusPx}
          y1={chartCenter.screenY}
          x2={chartCenter.screenX + innerRingRadiusPx}
          y2={chartCenter.screenY}
        />
      </g>
      <text
        x={chartCenter.screenX + 4}
        y={chartCenter.screenY - innerRingRadiusPx + 12}
        className="fill-muted-foreground font-mono text-[11px]"
      >
        N
      </text>
    </>
  );
}
