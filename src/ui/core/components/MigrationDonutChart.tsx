import { ChartDonut, ChartLabel, ChartLegend } from "@patternfly/react-charts";
import { Flex, FlexItem } from "@patternfly/react-core";
import React, { useCallback, useMemo } from "react";

interface OSData {
  name: string;
  count: number;
  legendCategory: string;
  countDisplay?: string;
}

interface ChartDatum {
  x: string;
  y: number;
  legendCategory: string;
  countDisplay?: string | number;
}

interface MigrationDonutChartProps {
  data: OSData[];
  legend?: Record<string, string>;
  customColors?: Record<string, string>;
  legendWidth?: number;
  height?: number;
  width?: number;
  title?: string;
  subTitle?: string;
  titleColor?: string;
  subTitleColor?: string;
  itemsPerRow?: number;
  marginLeft?: string;
  labelFontSize?: number;
  titleFontSize?: number;
  subTitleFontSize?: number;
  donutThickness?: number;
  padAngle?: number;
  // Optional custom formatter for the tooltip/labels shown on slice hover
  tooltipLabelFormatter?: (args: {
    datum: {
      x: string;
      y: number;
      countDisplay?: string;
      legendCategory: string;
    };
    percent: number;
    total: number;
  }) => string;
}

const legendColors = ["#0066cc", "#5e40be", "#b6a6e9", "#b98412"];

const MigrationDonutChart: React.FC<MigrationDonutChartProps> = ({
  data,
  legend,
  customColors,
  legendWidth,
  height = 260,
  width = 420,
  title,
  subTitle,
  titleColor = "#000000",
  subTitleColor = "#000000",
  itemsPerRow = 1,
  labelFontSize = 25,
  titleFontSize = 28,
  subTitleFontSize = 14,
  donutThickness = 45,
  padAngle = 1,
  tooltipLabelFormatter,
}: MigrationDonutChartProps) => {
  const dynamicLegend = useMemo<Record<string, string>>(() => {
    const legendMap: Record<string, string> = {};
    const seen = new Set<string>();

    data.forEach((item) => {
      const key = item.legendCategory;
      if (!seen.has(key)) {
        seen.add(key);
        legendMap[key] =
          customColors?.[key] ??
          legendColors[(seen.size - 1) % legendColors.length];
      }
    });

    return legendMap;
  }, [data, customColors]);

  const chartLegend = legend ?? dynamicLegend;
  const getColor = useCallback(
    (name: string): string => chartLegend[name] ?? legendColors[0],
    [chartLegend],
  );

  const chartData = useMemo<ChartDatum[]>(() => {
    return data.map((item) => ({
      x: item.name,
      y: item.count,
      legendCategory: item.legendCategory,
      countDisplay: item.countDisplay ?? item.count,
    }));
  }, [data]);

  const colorScale = useMemo(() => {
    return chartData.map((item) => getColor(item.legendCategory));
  }, [chartData, getColor]);

  const legendData = useMemo(() => {
    return chartData.map((item) => ({
      name: `${item.x} (${item.countDisplay})`,
      symbol: { fill: getColor(item.legendCategory) },
    }));
  }, [chartData, getColor]);

  const legendWidthValue = legendWidth ?? 800;
  const legendX = useMemo(() => {
    const symbolAndGap = 34;
    const charWidth = labelFontSize * 0.55;
    const itemWidths = legendData.map(
      (d) => symbolAndGap + d.name.length * charWidth,
    );
    const numCols = Math.min(legendData.length, itemsPerRow);
    const gutter = 16;
    let contentWidth = (numCols - 1) * gutter;
    for (let c = 0; c < numCols; c++) {
      let maxW = 0;
      for (let i = c; i < itemWidths.length; i += itemsPerRow) {
        maxW = Math.max(maxW, itemWidths[i] ?? 0);
      }
      contentWidth += maxW;
    }
    return Math.max(0, (legendWidthValue - contentWidth) / 2);
  }, [legendData, itemsPerRow, legendWidthValue, labelFontSize]);

  const innerRadius = useMemo(() => {
    const outerApprox = Math.min(width, height) / 2;
    const computed = outerApprox - donutThickness;
    return computed > 0 ? computed : 0;
  }, [width, height, donutThickness]);

  const totalY = useMemo(() => {
    return chartData.reduce((sum, item) => sum + (Number(item.y) || 0), 0);
  }, [chartData]);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        No data available
      </div>
    );
  }

  return (
    <Flex
      direction={{ default: "column" }}
      alignItems={{ default: "alignItemsCenter" }}
    >
      <FlexItem>
        <ChartDonut
          ariaDesc="Migration data donut chart"
          data={chartData}
          labels={({ datum }) => {
            const safeDatum = datum as ChartDatum;
            const percent =
              totalY > 0 ? (Number(safeDatum.y) / totalY) * 100 : 0;
            return tooltipLabelFormatter
              ? tooltipLabelFormatter({
                  datum: {
                    x: safeDatum.x,
                    y: Number(safeDatum.y),
                    countDisplay:
                      typeof safeDatum.countDisplay === "number"
                        ? String(safeDatum.countDisplay)
                        : safeDatum.countDisplay,
                    legendCategory: safeDatum.legendCategory,
                  },
                  percent,
                  total: totalY,
                })
              : `${safeDatum.x}: ${safeDatum.countDisplay ?? safeDatum.y}`;
          }}
          colorScale={colorScale}
          constrainToVisibleArea
          innerRadius={innerRadius}
          padAngle={padAngle}
          title={title}
          subTitle={subTitle}
          height={height}
          width={width}
          padding={{
            bottom: 5,
            left: 20,
            right: 20,
            top: 0,
          }}
          titleComponent={
            title ? (
              <ChartLabel
                style={[
                  {
                    fill: titleColor,
                    fontSize: titleFontSize,
                    fontWeight: "bold",
                  },
                ]}
              />
            ) : undefined
          }
          subTitleComponent={
            subTitle ? (
              <ChartLabel
                dy={7}
                style={[
                  {
                    fill: subTitleColor,
                    fontSize: subTitleFontSize,
                  },
                ]}
              />
            ) : undefined
          }
        />
      </FlexItem>
      <FlexItem flex={{ default: "flex_1" }}>
        <Flex
          justifyContent={{ default: "justifyContentCenter" }}
          alignItems={{ default: "alignItemsCenter" }}
        >
          <FlexItem>
            <ChartLegend
              data={legendData}
              orientation="horizontal"
              height={200}
              width={legendWidthValue}
              x={legendX}
              itemsPerRow={itemsPerRow}
              style={{
                labels: { fontSize: labelFontSize },
              }}
            />
          </FlexItem>
        </Flex>
      </FlexItem>
    </Flex>
  );
};

export default MigrationDonutChart;
