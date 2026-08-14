# ProfitTracker

一個以 Expo (React Native) 開發的每日記帳 / 收益追蹤工具，可記錄每日損益、查看月 / 年統計，並支援本金設定與資料匯出入。

Git: https://github.com/good9r/ProfitTracker.git

## 技術棧

- Expo ~54 / React 19 / React Native 0.81
- date-fns：日期處理
- @react-native-async-storage/async-storage：本地資料儲存

## 專案結構

```
App.js                      進入點，套用深色背景與狀態列
index.js                    Expo 註冊 root component
src/screens/Dashboard.js    主畫面：月曆/年曆、輸入彈窗、設定彈窗
src/hooks/useProfitData.js  資料存取邏輯（讀寫 AsyncStorage）
src/utils/formatter.js      金額/百分比格式化工具
```

## 功能

- **月視圖**：以日曆呈現每日損益金額與收益率，點擊某日可新增/編輯/刪除該日紀錄。
- **年視圖**：呈現 12 個月加總損益、收益率，並顯示累計總資產（本金 + 累計損益）；點擊某月可跳轉至該月月視圖。
- **收益率計算**：以「當期開始時的總資產」為基準（本金 + 之前所有損益）。
- **本金設定**：可於年視圖中修改本金，作為收益率計算基礎。
- **長條圖**：月/年視圖下方以長條圖呈現各日/月損益走勢。
- **資料管理**：可清除全部資料、匯出成 JSON 備份、匯入 JSON 還原/合併資料。

## 資料結構

以單一 key `@profit_tracker_data` 儲存於 AsyncStorage：

```json
{
  "settings": { "base_capital": 100000 },
  "records": {
    "2026-08-14": { "amount": 1200, "note": "TSLA 大漲" }
  }
}
```
