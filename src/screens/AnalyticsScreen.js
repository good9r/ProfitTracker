import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useProfitData } from "../hooks/useProfitData";
import { formatWan, formatPercent, formatNTD } from "../utils/formatter";

// 圖表尺寸設定
const CHART_HEIGHT = 220; // 曲線繪圖區高度
const CHART_TOP_PADDING = 24;
const CHART_BOTTOM_PADDING = 24;
const LABEL_AREA_HEIGHT = 28; // x 軸標籤區域高度
const POINT_SPACING = 52; // 每個資料點間距
const CHART_LEFT_PADDING = 20;
const CHART_RIGHT_PADDING = 20;

export default function AnalyticsScreen({ onBack }) {
  const { records, baseCapital } = useProfitData();

  // 依本金計算資金成長曲線：以「本金」為起點，逐月累加損益，
  // 涵蓋所有有紀錄的年份（跨年度呈現完整成長走勢）
  const series = useMemo(() => {
    const dateKeys = Object.keys(records).sort();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let minYear = currentYear;
    let maxYear = currentYear;
    dateKeys.forEach((key) => {
      const y = parseInt(key.slice(0, 4), 10);
      if (!Number.isNaN(y)) {
        if (y < minYear) minYear = y;
        if (y > maxYear) maxYear = y;
      }
    });

    const points = [
      {
        label: "本金",
        value: baseCapital,
      },
    ];

    let cumulative = baseCapital;
    for (let y = minYear; y <= maxYear; y++) {
      const lastMonth = y === currentYear ? currentMonth : 12;
      for (let m = 1; m <= lastMonth; m++) {
        const prefix = `${y}-${String(m).padStart(2, "0")}-`;
        let monthProfit = 0;
        dateKeys.forEach((key) => {
          if (key.startsWith(prefix)) {
            monthProfit += records[key].amount;
          }
        });
        cumulative += monthProfit;
        points.push({
          label: `${String(y).slice(2)}/${String(m).padStart(2, "0")}`,
          value: cumulative,
        });
      }
    }

    return points;
  }, [records, baseCapital]);

  const values = series.map((p) => p.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  const plotHeight = CHART_HEIGHT - CHART_TOP_PADDING - CHART_BOTTOM_PADDING;

  const points = series.map((p, idx) => {
    const x = CHART_LEFT_PADDING + idx * POINT_SPACING;
    const y =
      CHART_HEIGHT -
      CHART_BOTTOM_PADDING -
      ((p.value - minValue) / range) * plotHeight;
    return { ...p, x, y };
  });

  const chartWidth =
    CHART_LEFT_PADDING + (series.length - 1) * POINT_SPACING + CHART_RIGHT_PADDING;

  const finalValue = series[series.length - 1]?.value ?? baseCapital;
  const totalGrowth = finalValue - baseCapital;
  const totalGrowthPercent =
    baseCapital > 0 ? (totalGrowth / baseCapital) * 100 : 0;
  const lineColor = totalGrowth >= 0 ? "#00C853" : "#FF5252";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>數據分析</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>目前總資產</Text>
            <Text style={styles.summaryValue}>{formatNTD(finalValue)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>本金</Text>
            <Text style={styles.summaryValue}>{formatNTD(baseCapital)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>累計成長</Text>
            <Text
              style={[
                styles.summaryValue,
                totalGrowth >= 0 ? styles.profit : styles.loss,
              ]}
            >
              {totalGrowth >= 0 ? "+" : ""}
              {formatNTD(totalGrowth)}
            </Text>
            <Text
              style={[
                styles.summaryPercent,
                totalGrowth >= 0 ? styles.profit : styles.loss,
              ]}
            >
              {formatPercent(totalGrowthPercent)}
            </Text>
          </View>
        </View>

        <Text style={styles.chartTitle}>資金成長曲線（依本金計算）</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View
            style={[
              styles.chartArea,
              { width: chartWidth, height: CHART_HEIGHT + LABEL_AREA_HEIGHT },
            ]}
          >
            {/* 參考線：最高 / 最低 */}
            <View style={[styles.gridLine, { top: CHART_TOP_PADDING }]} />
            <Text style={[styles.gridLabel, { top: CHART_TOP_PADDING - 14 }]}>
              {formatWan(maxValue)}
            </Text>
            <View
              style={[
                styles.gridLine,
                { top: CHART_HEIGHT - CHART_BOTTOM_PADDING },
              ]}
            />
            <Text
              style={[
                styles.gridLabel,
                { top: CHART_HEIGHT - CHART_BOTTOM_PADDING + 4 },
              ]}
            >
              {formatWan(minValue)}
            </Text>

            {/* 曲線線段 */}
            {points.slice(1).map((p, idx) => {
              const prev = points[idx];
              const dx = p.x - prev.x;
              const dy = p.y - prev.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              return (
                <View
                  key={`line-${idx}`}
                  style={{
                    position: "absolute",
                    left: prev.x,
                    top: prev.y,
                    width: length,
                    height: 2,
                    backgroundColor: lineColor,
                    transformOrigin: "0 0",
                    transform: [{ rotate: `${angle}deg` }],
                  }}
                />
              );
            })}

            {/* 資料點 */}
            {points.map((p, idx) => (
              <View
                key={`point-${idx}`}
                style={[
                  styles.point,
                  { left: p.x - 3, top: p.y - 3, backgroundColor: lineColor },
                ]}
              />
            ))}

            {/* x 軸標籤 */}
            {points.map((p, idx) => (
              <Text
                key={`label-${idx}`}
                style={[
                  styles.xLabel,
                  {
                    left: p.x - POINT_SPACING / 2,
                    width: POINT_SPACING,
                    top: CHART_HEIGHT + 4,
                  },
                ]}
                numberOfLines={1}
              >
                {p.label}
              </Text>
            ))}
          </View>
        </ScrollView>

        <Text style={styles.helperText}>
          曲線以「本金 + 累計每月損益」計算，橫向捲動可查看完整區間。
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    minWidth: 60,
  },
  backButtonText: {
    color: "#00C853",
    fontSize: 16,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  headerSpacer: {
    minWidth: 60,
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    color: "#999",
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  summaryPercent: {
    fontSize: 12,
    marginTop: 2,
  },
  profit: {
    color: "#00C853",
  },
  loss: {
    color: "#FF5252",
  },
  chartTitle: {
    color: "#999",
    fontSize: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chartArea: {
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#2A2A2A",
  },
  gridLabel: {
    position: "absolute",
    left: CHART_LEFT_PADDING,
    color: "#666",
    fontSize: 10,
  },
  point: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  xLabel: {
    position: "absolute",
    color: "#666",
    fontSize: 9,
    textAlign: "center",
  },
  helperText: {
    color: "#666",
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    textAlign: "center",
  },
});
