import {SafeAreaProvider} from "react-native-safe-area-context";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {PaperProvider} from "react-native-paper";

import RootNavigator from "./navigation/RootNavigator";
import {Provider} from "react-redux";
import {store, persistor} from "~redux/store";
import {PersistGate} from "redux-persist/integration/react";
import Toast from "react-native-toast-message";
import toastConfig from "~components/Toast/toastConfig";
import {AlertProvider} from "~context/AlertContext";
import {ThemeProvider} from "~context/ThemeContext";
import {LanguageProvider} from "~context/LanguageContext";

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <LanguageProvider>
            <SafeAreaProvider>
              <GestureHandlerRootView style={{flex: 1}}>
                <PaperProvider>
                  <AlertProvider>
                    <RootNavigator />
                  </AlertProvider>
                  {/* Toast component - must be last child for proper layering */}
                  <Toast config={toastConfig} />
                </PaperProvider>
              </GestureHandlerRootView>
            </SafeAreaProvider>
          </LanguageProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
