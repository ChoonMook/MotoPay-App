import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import WebViewScreen from "./src/screens/WebViewScreen";

export default function App() {
  return (
    <SafeAreaProvider>
      <WebViewScreen />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
