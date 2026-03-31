import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Keyboard,
} from "react-native";
import { format, getDaysInMonth, startOfMonth, getDay } from "date-fns";
import { useProfitData } from "../hooks/useProfitData";
import {
  formatWan,
  formatUSD,
  formatPercent,
  formatNTD,
} from "../utils/formatter";

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1)); // 2025/06
  const [viewMode, setViewMode] = useState("month"); // 'month' | 'year'
  const [selectedDay, setSelectedDay] = useState(null);
  const [inputAmount, setInputAmount] = useState("");
  const [inputNote, setInputNote] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [baseCapitalInput, setBaseCapitalInput] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const { records, baseCapital, saveRecord, deleteRecord, updateBaseCapital } =
    useProfitData();

  // 計算當月統計
  const monthlyStats = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfWeek = getDay(startOfMonth(currentDate)); // 0 = Sunday
    let totalProfit = 0;
    const dailyData = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(
        d
      ).padStart(2, "0")}`;
      const record = records[dateKey];
      const amount = record ? record.amount : 0;
      const percent = baseCapital > 0 ? (amount / baseCapital) * 100 : 0;

      totalProfit += amount;
      dailyData.push({
        day: d,
        date: dateKey,
        amount,
        percent,
        hasRecord: !!record,
        note: record?.note || "",
      });
    }

    // 補前空白
    const padding = Array(firstDayOfWeek).fill(null);

    return {
      totalProfit,
      totalPercent: baseCapital > 0 ? (totalProfit / baseCapital) * 100 : 0,
      dailyData,
      padding,
      maxAmount: Math.max(...dailyData.map((d) => Math.abs(d.amount)), 1),
    };
  }, [records, currentDate, baseCapital, year, month]);

  const handleDayPress = (dayData) => {
    setSelectedDay(dayData);
    setInputAmount(dayData.hasRecord ? String(dayData.amount) : "");
    setInputNote(dayData.note || "");
  };

  const handleSave = () => {
    if (!selectedDay) return;
    const amount = parseFloat(inputAmount) || 0;
    if (amount === 0 && !selectedDay.hasRecord) {
      handleClose();
      return;
    }
    saveRecord(selectedDay.date, amount, inputNote);
    handleClose();
  };

  const handleDelete = () => {
    if (!selectedDay) return;
    deleteRecord(selectedDay.date);
    handleClose();
  };

  const handleClose = () => {
    setSelectedDay(null);
    setInputAmount("");
    setInputNote("");
    Keyboard.dismiss();
  };

  const handleSettingsSave = () => {
    const capital = parseFloat(baseCapitalInput);
    if (capital > 0) {
      updateBaseCapital(capital);
    }
    setShowSettings(false);
    setBaseCapitalInput("");
  };

  // 月份選擇器資料
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: `${year}/${String(i + 1).padStart(2, "0")}`,
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.monthSelector}
          onPress={() => setShowSettings(true)}
        >
          <Text style={styles.monthText}>{format(currentDate, "yyyy/MM")}</Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              viewMode === "month" && styles.toggleActive,
            ]}
            onPress={() => setViewMode("month")}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === "month" && styles.toggleTextActive,
              ]}
            >
              月
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              viewMode === "year" && styles.toggleActive,
            ]}
            onPress={() => setViewMode("year")}
          >
            <Text
              style={[
                styles.toggleText,
                viewMode === "year" && styles.toggleTextActive,
              ]}
            >
              年
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryLabel}>6月收益 · NTD</Text>
          <Text
            style={[
              styles.summaryAmount,
              monthlyStats.totalProfit >= 0 ? styles.profit : styles.loss,
            ]}
          >
            {monthlyStats.totalProfit >= 0 ? "+" : ""}
            {formatNTD(monthlyStats.totalProfit)}
          </Text>
        </View>
        <View style={styles.summaryRight}>
          <Text style={styles.summaryLabel}>收益率</Text>
          <Text
            style={[
              styles.summaryPercent,
              monthlyStats.totalProfit >= 0 ? styles.profit : styles.loss,
            ]}
          >
            {formatPercent(monthlyStats.totalPercent)}
          </Text>
        </View>
      </View>

      {/* Calendar Header */}
      <View style={styles.weekdayHeader}>
        {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
          <Text key={d} style={styles.weekdayText}>
            {d}
          </Text>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {/* Padding days */}
          {monthlyStats.padding.map((_, idx) => (
            <View key={`pad-${idx}`} style={styles.dayCell} />
          ))}

          {/* Actual days */}
          {monthlyStats.dailyData.map((dayData) => {
            const isProfit = dayData.amount >= 0;
            const color = isProfit ? "#00C853" : "#FF5252";

            return (
              <TouchableOpacity
                key={dayData.day}
                style={styles.dayCell}
                onPress={() => handleDayPress(dayData)}
                activeOpacity={0.7}
              >
                <Text style={styles.dayNumber}>{dayData.day}</Text>
                <Text
                  style={[
                    styles.dayAmount,
                    {
                      color:
                        dayData.amount === 0 && !dayData.hasRecord
                          ? "#666"
                          : color,
                    },
                  ]}
                >
                  {dayData.amount === 0 && !dayData.hasRecord
                    ? "+0.00"
                    : formatWan(dayData.amount)}
                </Text>
                <Text
                  style={[
                    styles.dayPercent,
                    {
                      color:
                        dayData.amount === 0 && !dayData.hasRecord
                          ? "#666"
                          : color,
                    },
                  ]}
                >
                  {dayData.amount === 0 && !dayData.hasRecord
                    ? "+0.00%"
                    : formatPercent(dayData.percent)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bar Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartLabel}>單位：萬</Text>
          <View style={styles.chart}>
            {monthlyStats.dailyData.map((dayData, idx) => {
              const height =
                (Math.abs(dayData.amount) / monthlyStats.maxAmount) * 80;
              const isProfit = dayData.amount >= 0;
              const color = isProfit ? "#00C853" : "#FF5252";
              const bottom = isProfit ? 50 : 50 - height;

              return (
                <View key={idx} style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(height, 2),
                        backgroundColor: color,
                        bottom: isProfit ? 50 : 50 - Math.max(height, 2),
                      },
                    ]}
                  />
                </View>
              );
            })}
            {/* Zero line */}
            <View style={styles.zeroLine} />
          </View>
          <View style={styles.yAxis}>
            <Text style={styles.yAxisText}>9.01</Text>
            <Text style={styles.yAxisText}>0.00</Text>
            <Text style={styles.yAxisText}>-9.01</Text>
          </View>
        </View>
      </ScrollView>

      {/* Input Modal */}
      <Modal
        visible={!!selectedDay}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedDay?.date}</Text>

            <Text style={styles.inputLabel}>收益金額（NTD）</Text>
            <TextInput
              style={styles.input}
              value={inputAmount}
              onChangeText={setInputAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#666"
              autoFocus
            />

            <Text style={styles.inputLabel}>備註（選填）</Text>
            <TextInput
              style={styles.input}
              value={inputNote}
              onChangeText={setInputNote}
              placeholder="例如：TSLA 大漲"
              placeholderTextColor="#666"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={handleClose}>
                <Text style={styles.btnCancelText}>取消</Text>
              </TouchableOpacity>

              {selectedDay?.hasRecord && (
                <TouchableOpacity
                  style={styles.btnDelete}
                  onPress={handleDelete}
                >
                  <Text style={styles.btnDeleteText}>刪除</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
                <Text style={styles.btnSaveText}>儲存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>設定</Text>

            <Text style={styles.inputLabel}>本金（NTD）</Text>
            <TextInput
              style={styles.input}
              value={baseCapitalInput}
              onChangeText={setBaseCapitalInput}
              keyboardType="decimal-pad"
              placeholder={String(baseCapital)}
              placeholderTextColor="#666"
            />

            <Text style={styles.helperText}>
              當前本金：{formatNTD(baseCapital)}
            </Text>
            <Text style={styles.helperText}>收益率以此計算</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setShowSettings(false)}
              >
                <Text style={styles.btnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSave}
                onPress={handleSettingsSave}
              >
                <Text style={styles.btnSaveText}>儲存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  monthText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  dropdownIcon: {
    color: "#666",
    fontSize: 12,
    marginLeft: 4,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: "#444",
  },
  toggleText: {
    color: "#999",
    fontSize: 14,
  },
  toggleTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summaryLeft: {
    flex: 1,
  },
  summaryRight: {
    alignItems: "flex-end",
  },
  summaryLabel: {
    color: "#999",
    fontSize: 14,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: "bold",
  },
  summaryPercent: {
    fontSize: 28,
    fontWeight: "bold",
  },
  profit: {
    color: "#00C853",
  },
  loss: {
    color: "#FF5252",
  },
  weekdayHeader: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    color: "#999",
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  dayCell: {
    width: "14.28%",
    height: 80,
    padding: 4,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  dayNumber: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 4,
  },
  dayAmount: {
    fontSize: 11,
    fontWeight: "500",
  },
  dayPercent: {
    fontSize: 10,
    marginTop: 2,
  },
  chartContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  chartLabel: {
    color: "#999",
    fontSize: 12,
    marginBottom: 8,
  },
  chart: {
    height: 120,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    position: "relative",
  },
  barWrapper: {
    flex: 1,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  bar: {
    width: 8,
    borderRadius: 2,
    position: "absolute",
  },
  zeroLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#444",
    top: 50,
  },
  yAxis: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: "space-between",
    width: 40,
  },
  yAxisText: {
    color: "#666",
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 320,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  inputLabel: {
    color: "#999",
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
  },
  helperText: {
    color: "#666",
    fontSize: 12,
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  btnCancel: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#2A2A2A",
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  btnCancelText: {
    color: "#999",
  },
  btnDelete: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#3A1A1A",
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  btnDeleteText: {
    color: "#FF5252",
  },
  btnSave: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#00C853",
    flex: 1,
    alignItems: "center",
  },
  btnSaveText: {
    color: "#000",
    fontWeight: "600",
  },
});
