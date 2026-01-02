import {createNativeStackNavigator} from "@react-navigation/native-stack";

import Onboarding from "~screens/onboarding";
import GetStartedScreen from "~screens/onboarding/GetStarted";
import OTPVerficationScreen from "~screens/onboarding/OTPVerification";
import SelectLocationScreen from "~screens/onboarding/SelectLocation";

import LoginScreen from "~screens/onboarding/Auth/Login";
import SignupScreen from "~screens/onboarding/Auth/Signup";
import ForgotPasswordScreen from "~screens/onboarding/Auth/ForgotPassword";

const Stack = createNativeStackNavigator();

const OnboardingNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Onboarding" component={Onboarding} />
      <Stack.Screen name="GetStarted" component={GetStartedScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerficationScreen} />
      <Stack.Screen name="SelectLocation" component={SelectLocationScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
