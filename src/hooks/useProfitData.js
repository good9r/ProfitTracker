import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@profit_tracker_data";

const defaultData = {
  settings: {
    base_capital: 100000,
  },
  records: {},
};

export function useProfitData() {
  const [data, setData] = useState(defaultData);
  const [loaded, setLoaded] = useState(false);

  // 載入本地資料
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setData(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load data", e);
      }
      setLoaded(true);
    };
    loadData();
  }, []);

  // 儲存到本地
  const persistData = useCallback(async (newData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (e) {
      console.error("Failed to save data", e);
    }
  }, []);

  const saveRecord = useCallback(
    (date, amount, note = "") => {
      setData((prev) => {
        const newRecords = { ...prev.records };
        if (amount === 0) {
          delete newRecords[date];
        } else {
          newRecords[date] = { amount, note };
        }
        const newData = { ...prev, records: newRecords };
        persistData(newData);
        return newData;
      });
    },
    [persistData]
  );

  const deleteRecord = useCallback(
    (date) => {
      setData((prev) => {
        const newRecords = { ...prev.records };
        delete newRecords[date];
        const newData = { ...prev, records: newRecords };
        persistData(newData);
        return newData;
      });
    },
    [persistData]
  );

  const updateBaseCapital = useCallback(
    (capital) => {
      setData((prev) => {
        const newData = {
          ...prev,
          settings: { ...prev.settings, base_capital: capital },
        };
        persistData(newData);
        return newData;
      });
    },
    [persistData]
  );

  const clearAllData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setData(defaultData);
    } catch (e) {
      console.error("Failed to clear data", e);
    }
  }, []);

  const exportData = useCallback(() => {
    const exportData = {
      ...data,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };
    return JSON.stringify(exportData, null, 2);
  }, [data]);

  const importData = useCallback(
    async (jsonString) => {
      try {
        const importedData = JSON.parse(jsonString);

        // 验证数据结构
        if (!importedData.settings || !importedData.records) {
          throw new Error("Invalid data format");
        }

        // 合并数据（保留现有数据，添加导入的数据）
        const mergedData = {
          settings: {
            ...data.settings,
            ...importedData.settings,
          },
          records: {
            ...data.records,
            ...importedData.records,
          },
        };

        setData(mergedData);
        await persistData(mergedData);
        return true;
      } catch (e) {
        console.error("Failed to import data", e);
        return false;
      }
    },
    [data, persistData]
  );

  return {
    records: data.records,
    baseCapital: data.settings.base_capital,
    loaded,
    saveRecord,
    deleteRecord,
    updateBaseCapital,
    clearAllData,
    exportData,
    importData,
  };
}
