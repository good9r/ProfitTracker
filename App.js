import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";
import Dashboard from "./src/screens/Dashboard";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <Dashboard />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
});
