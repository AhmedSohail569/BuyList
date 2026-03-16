import { appleAuth } from '@invertase/react-native-apple-authentication';

/**
 * Initiates the Apple Sign-In flow
 * @returns {Promise<Object>} Formatted user info containing identityToken, email, and fullName
 */
export const signInWithApple = async () => {
  try {
    // Check if Apple Sign-In is supported on the device (requires iOS 13+)
    if (!appleAuth.isSupported) {
      throw new Error("Apple Sign-In is not supported on this device.");
    }

    // Start the sign-in request
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    console.log("appleAuthRequestResponse", appleAuthRequestResponse);

    // Ensure the user is authenticated
    // const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);

    // console.log("credentialState", credentialState);

    // console.log("appleAuth.State.AUTHORIZED", appleAuth.State.AUTHORIZED);
    // console.log("appleAuth.State.NOT_FOUND", appleAuth.State.NOT_FOUND);
    // console.log("appleAuth.State.REVOKED", appleAuth.State.REVOKED);
    // console.log("appleAuth.State.UNKNOWN", appleAuth.State.UNKNOWN);

    if (appleAuthRequestResponse.identityToken) {
      return appleAuthRequestResponse;
    } else {
      throw new Error("Apple Sign-In authorization failed.");
    }
  } catch (error) {
    if (error.code === appleAuth.Error.CANCELED) {
      throw new Error('User cancelled the login flow.');
    }
    throw error;
  }
};
