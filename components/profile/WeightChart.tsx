import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Svg, { Circle, Path } from 'react-native-svg';

export type WeightPoint = {
  dateISO: string;
  weightKg: number;
};

type Props = {
  points: WeightPoint[];
  height?: number;
};

function buildPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  return [`M ${first.x} ${first.y}`, ...rest.map((p) => `L ${p.x} ${p.y}`)].join(' ');
}

export default function WeightChart({ points, height = 110 }: Props) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const weights = useMemo(() => points.map((p) => p.weightKg), [points]);
  const min = useMemo(() => (weights.length ? Math.min(...weights) : 0), [weights]);
  const max = useMemo(() => (weights.length ? Math.max(...weights) : 0), [weights]);

  const chart = useMemo(() => {
    if (width <= 0) return null;
    if (points.length < 2) return null;

    const padding = 12;
    const span = Math.max(0.0001, max - min);

    const mapped = points.map((p, i) => {
      const x = padding + (i / Math.max(1, points.length - 1)) * (width - padding * 2);
      const y = padding + ((max - p.weightKg) / span) * (height - padding * 2);
      return { x, y };
    });

    return {
      path: buildPath(mapped),
      dots: mapped,
    };
  }, [width, points, height, min, max]);

  const onLayout = (e: LayoutChangeEvent) => {
    const nextWidth = Math.round(e.nativeEvent.layout.width);
    if (nextWidth !== width) setWidth(nextWidth);
  };

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <View style={styles.metaRow}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {points.length ? `${min.toFixed(1)} – ${max.toFixed(1)} kg` : '—'}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {points.length ? `${points.length} pts` : ''}
        </Text>
      </View>

      <View style={[styles.chartBox, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
        {chart ? (
          <Svg width={width} height={height}>
            <Path d={chart.path} stroke={theme.colors.primary} strokeWidth={3} fill="none" />
            {chart.dots.map((p, idx) => (
              <Circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r={idx === chart.dots.length - 1 ? 4 : 3}
                fill={theme.colors.primary}
                opacity={idx === chart.dots.length - 1 ? 1 : 0.8}
              />
            ))}
          </Svg>
        ) : (
          <View style={[styles.placeholder, { backgroundColor: theme.colors.surface }]}> 
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {points.length < 2 ? 'Ajoute au moins 2 poids pour voir le graphique.' : '—'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  chartBox: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  placeholder: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
});
