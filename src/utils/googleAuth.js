import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';

// Initialize Google Sign-In
GoogleSignin.configure({
  webClientId: Config.GOOGLE_WEB_CLIENT_ID || "",
  iosClientId: Config.GOOGLE_IOS_CLIENT_ID || "",
  offlineAccess: true,
});

/**
 * Initiates the Google Sign-In flow
 * @returns {Promise<Object>} Formatted user info containing idToken
 */
export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    return userInfo;
  } catch (error) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('User cancelled the login flow.');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Login is currently in progress.');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Play Services are not available on this device.');
    } else {
      throw error;
    }
  }
};

/**
 * Signs the user out of Google locally
 */
export const signOutFromGoogle = async () => {
  try {
    const isSignedIn = await GoogleSignin.isSignedIn();
    if (isSignedIn) {
      await GoogleSignin.signOut();
    }
  } catch (error) {
    console.error('Google SignOut Error:', error);
  }
};
