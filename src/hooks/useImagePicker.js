/**
 * useImagePicker Hook
 * Handles image selection from camera/gallery with proper permissions
 * Supports both iOS and Android platforms
 */
import { useState, useCallback } from "react";
import { Platform, Linking, Alert } from "react-native";
import ImagePicker from "react-native-image-crop-picker";
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from "react-native-permissions";

// Image picker options for optimization
const DEFAULT_OPTIONS = {
  width: 800,
  height: 800,
  cropping: true,
  cropperCircleOverlay: true,
  compressImageMaxWidth: 800,
  compressImageMaxHeight: 800,
  compressImageQuality: 0.8,
  mediaType: "photo",
  includeBase64: false,
  forceJpg: true,
};

/**
 * Get the appropriate camera permission based on platform
 */
const getCameraPermission = () => {
  return Platform.select({
    ios: PERMISSIONS.IOS.CAMERA,
    android: PERMISSIONS.ANDROID.CAMERA,
  });
};

/**
 * Get the appropriate photo library permission based on platform
 */
const getPhotoLibraryPermission = () => {
  return Platform.select({
    ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
    android:
      Platform.Version >= 33
        ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
  });
};

/**
 * Show settings alert when permission is permanently denied
 */
const showSettingsAlert = (title, message) => {
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    {
      text: "Open Settings",
      onPress: () => openSettings().catch(() => Linking.openSettings()),
    },
  ]);
};

/**
 * Custom hook for image picking with permissions handling
 */
const useImagePicker = (options = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const pickerOptions = { ...DEFAULT_OPTIONS, ...options };

  /**
   * Check and request camera permission
   * @returns {Promise<boolean>} Whether permission was granted
   */
  const requestCameraPermission = useCallback(async () => {
    const permission = getCameraPermission();
    if (!permission) return false;

    try {
      const status = await check(permission);

      switch (status) {
        case RESULTS.GRANTED:
        case RESULTS.LIMITED:
          return true;

        case RESULTS.DENIED:
          const requestResult = await request(permission);
          return requestResult === RESULTS.GRANTED || requestResult === RESULTS.LIMITED;

        case RESULTS.BLOCKED:
          showSettingsAlert(
            "Camera Access Required",
            "Camera permission is required to take photos. Please enable it in your device settings.",
          );
          return false;

        case RESULTS.UNAVAILABLE:
          setError("Camera is not available on this device");
          return false;

        default:
          return false;
      }
    } catch (err) {
      console.error("Camera permission error:", err);
      setError("Failed to check camera permission");
      return false;
    }
  }, []);

  /**
   * Check and request photo library permission
   * @returns {Promise<boolean>} Whether permission was granted
   */
  const requestPhotoLibraryPermission = useCallback(async () => {
    const permission = getPhotoLibraryPermission();
    if (!permission) return false;

    try {
      const status = await check(permission);

      switch (status) {
        case RESULTS.GRANTED:
        case RESULTS.LIMITED:
          return true;

        case RESULTS.DENIED:
          const requestResult = await request(permission);
          return requestResult === RESULTS.GRANTED || requestResult === RESULTS.LIMITED;

        case RESULTS.BLOCKED:
          showSettingsAlert(
            "Photo Library Access Required",
            "Photo library permission is required to select photos. Please enable it in your device settings.",
          );
          return false;

        case RESULTS.UNAVAILABLE:
          setError("Photo library is not available on this device");
          return false;

        default:
          return false;
      }
    } catch (err) {
      console.error("Photo library permission error:", err);
      setError("Failed to check photo library permission");
      return false;
    }
  }, []);

  /**
   * Open camera to take a photo
   * @returns {Promise<Object|null>} Selected image object or null
   */
  const openCamera = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return null;
      }

      const image = await ImagePicker.openCamera(pickerOptions);
      setIsLoading(false);
      return {
        path: image.path,
        mime: image.mime,
        filename: image.filename || `photo_${Date.now()}.jpg`,
        width: image.width,
        height: image.height,
        size: image.size,
      };
    } catch (err) {
      setIsLoading(false);
      
      // User cancelled - not an error
      if (err.code === "E_PICKER_CANCELLED") {
        return null;
      }

      console.error("Camera error:", err);
      setError(err.message || "Failed to open camera");
      return null;
    }
  }, [requestCameraPermission, pickerOptions]);

  /**
   * Open gallery to select a photo
   * @returns {Promise<Object|null>} Selected image object or null
   */
  const openGallery = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const hasPermission = await requestPhotoLibraryPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return null;
      }

      const image = await ImagePicker.openPicker(pickerOptions);
      setIsLoading(false);
      return {
        path: image.path,
        mime: image.mime,
        filename: image.filename || `photo_${Date.now()}.jpg`,
        width: image.width,
        height: image.height,
        size: image.size,
      };
    } catch (err) {
      setIsLoading(false);

      // User cancelled - not an error
      if (err.code === "E_PICKER_CANCELLED") {
        return null;
      }

      console.error("Gallery error:", err);
      setError(err.message || "Failed to open gallery");
      return null;
    }
  }, [requestPhotoLibraryPermission, pickerOptions]);

  /**
   * Clear any errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clean up temporary images (call when done)
   */
  const cleanUp = useCallback(async () => {
    try {
      await ImagePicker.clean();
    } catch (err) {
      console.log("Clean up error:", err);
    }
  }, []);

  return {
    openCamera,
    openGallery,
    isLoading,
    error,
    clearError,
    cleanUp,
    requestCameraPermission,
    requestPhotoLibraryPermission,
  };
};

export default useImagePicker;
