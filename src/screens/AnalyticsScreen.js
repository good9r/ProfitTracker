import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { useProfitData } from "../hooks/useProfitData";
import { formatWan, formatPercent, formatNTD } from "../utils/formatter";

// 圖表尺寸設定
const CHART_HEIGHT = 220; // 曲線繪圖區高度
const CHART_TOP_PADDING = 24;
const CHART_BOTTOM_PADDING = 24;
const LABEL_AREA_HEIGHT = 28; // x 軸標籤區域高度
const CHART_LEFT_PADDING = 20;
const CHART_RIGHT_PADDING = 20;
const TARGET_LABEL_COUNT = 6; // x 軸大約顯示幾個天數標籤
const LABEL_BOX_WIDTH = 40; // 單一天數標籤的寬度（置中用）

// 常見時間級距（天）：7天 / 1個月 / 3個月 / 半年 / 1年 / 2年
const WINDOW_TIERS = [7, 30, 90, 180, 365, 730];

// 依「第一筆～最後一筆」的間隔天數，找出最合適的顯示區間（無條件進位到下一級距）
function resolveWindowDays(spanDays) {
  const tier = WINDOW_TIERS.find((t) => spanDays <= t);
  const windowDays = tier !== undefined ? tier : spanDays;
  // 確保視窗至少能容納完整的資料區間（含最後一天）
  return Math.max(windowDays, spanDays + 1);
}

export default function AnalyticsScreen({ onBack }) {
  const { records, baseCapital } = useProfitData();
  const [chartWidth, setChartWidth] = useState(0);

  // 依本金計算資金成長曲線：以「第一筆記錄」為時間軸起點，逐日累加損益，
  // 並依第一筆～最後一筆的間隔天數，自動抓一個合適的顯示區間（level 級距）
  const seriesData = useMemo(() => {
    const dateKeys = Object.keys(records).sort();
    if (dateKeys.length === 0) return null;

    const firstDate = parseISO(dateKeys[0]);
    const lastDate = parseISO(dateKeys[dateKeys.length - 1]);
    const spanDays = differenceInCalendarDays(lastDate, firstDate);
    const windowDays = resolveWindowDays(spanDays);

    let cumulative = baseCapital;
    const points = [];
    for (let d = 0; d <= spanDays; d++) {
      const date = addDays(firstDate, d);
      const key = format(date, "yyyy-MM-dd");
      const record = records[key];
      if (record) cumulative += record.amount;
      points.push({ dayIndex: d, date: key, value: cumulative });
    }

    return { points, windowDays, spanDays, firstDate, lastDate };
  }, [records, baseCapital]);

  if (!seriesData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>‹ 返回</Text>
          </TouchableOpacity>
          <Text style={styles.title}>數據分析</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            尚無任何紀錄{"\n"}新增每日損益後即可查看資金成長曲線
          </Text>
        </View>
      </View>
    );
  }

  const { points, windowDays, spanDays, firstDate, lastDate } = seriesData;

  const allValues = [...points.map((p) => p.value), baseCapital];
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  const range = maxValue - minValue || 1;
  const plotHeight = CHART_HEIGHT - CHART_TOP_PADDING - CHART_BOTTOM_PADDING;

  // 整條曲線（含留白）壓縮進實際量到的畫面寬度，不需要橫向捲動
  const plotWidth = Math.max(chartWidth - CHART_LEFT_PADDING - CHART_RIGHT_PADDING, 0);
  const daySpacing = windowDays > 1 ? plotWidth / (windowDays - 1) : 0;

  const xAt = (dayIndex) => CHART_LEFT_PADDING + dayIndex * daySpacing;
  const yAt = (value) =>
    CHART_HEIGHT - CHART_BOTTOM_PADDING - ((value - minValue) / range) * plotHeight;

  // 只有實際資料（第一筆～最後一筆）畫線／畫點，超出資料範圍的區間完全留白
  const linePoints = points.map((p) => ({ ...p, x: xAt(p.dayIndex), y: yAt(p.value) }));
  const baseCapitalY = yAt(baseCapital);

  const finalValue = points[points.length - 1].value;
  const totalGrowth = finalValue - baseCapital;
  const totalGrowthPercent =
    baseCapital > 0 ? (totalGrowth / baseCapital) * 100 : 0;
  const lineColor = totalGrowth >= 0 ? "#00C853" : "#FF5252";

  // x 軸標籤：改標「第幾天」（從第1天起算），在整個顯示區間（含留白的部分）平均取樣
  const labelStep = Math.max(1, Math.round(windowDays / TARGET_LABEL_COUNT));
  const labelIndices = new Set();
  for (let i = 0; i < windowDays; i += labelStep) labelIndices.add(i);
  labelIndices.add(spanDays); // 一定標出最後一筆記錄是第幾天

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
        <Text style={styles.rangeText}>
          {format(firstDate, "yyyy/MM/dd")} ~ {format(lastDate, "yyyy/MM/dd")}
          （間隔 {spanDays} 天） · 顯示區間 {windowDays} 天
        </Text>

        <View
          style={styles.chartOuter}
          onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
        >
          {chartWidth > 0 && (
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

              {/* 本金基準線 */}
              <View
                style={[styles.baseLine, { top: baseCapitalY, width: chartWidth }]}
              />
              <Text style={[styles.baseLineLabel, { top: baseCapitalY - 14 }]}>
                本金 {formatWan(baseCapital)}
              </Text>

              {/* 曲線線段（僅在實際資料範圍內繪製，之後留白） */}
              {linePoints.slice(1).map((p, idx) => {
                const prev = linePoints[idx];
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

              {/* 最後一筆資料點：放大標示，代表目前資料範圍的終點 */}
              <View
                style={[
                  styles.pointLarge,
                  {
                    left: linePoints[linePoints.length - 1].x - 4,
                    top: linePoints[linePoints.length - 1].y - 4,
                    backgroundColor: lineColor,
                  },
                ]}
              />

              {/* x 軸標籤：顯示「第幾天」，第一筆記錄為第 1 天 */}
              {Array.from(labelIndices)
                .sort((a, b) => a - b)
                .map((dayIndex) => (
                  <Text
                    key={`label-${dayIndex}`}
                    style={[
                      styles.xLabel,
                      {
                        left: xAt(dayIndex) - LABEL_BOX_WIDTH / 2,
                        width: LABEL_BOX_WIDTH,
                        top: CHART_HEIGHT + 4,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {dayIndex + 1}天
                  </Text>
                ))}
            </View>
          )}
        </View>

        <Text style={styles.helperText}>
          曲線從第一筆記錄當天開始，依「本金 + 累計每日損益」逐日計算；橫軸為第幾天，超出資料範圍的區間會留白。
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
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
    marginBottom: 4,
  },
  rangeText: {
    color: "#666",
    fontSize: 11,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chartOuter: {
    width: "100%",
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
  baseLine: {
    position: "absolute",
    left: 0,
    height: 1,
    borderTopWidth: 1,
    borderTopColor: "#555",
    borderStyle: "dashed",
  },
  baseLineLabel: {
    position: "absolute",
    left: CHART_LEFT_PADDING,
    color: "#888",
    fontSize: 10,
  },
  pointLarge: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#121212",
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
