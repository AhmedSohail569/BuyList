/**
 * @format
 */

import {AppRegistry} from "react-native";
import App from "./src/App";
import {name as appName} from "./app.json";

/**
 * ⚠️  FCM Background Handler
 * Must be registered BEFORE the React component tree.
 * This allows FCM to deliver messages even when the app is in a terminated/quit state.
 */
import { registerBackgroundMessageHandler } from "./src/utils/notificationService";
registerBackgroundMessageHandler();

AppRegistry.registerComponent(appName, () => App);

