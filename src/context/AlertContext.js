import {createContext, useContext, useState, useCallback} from "react";
import {Alert} from "~components/Common";

const AlertContext = createContext(null);

/**
 * Alert Provider - Wrap your app with this to use custom alerts
 *
 * Usage:
 * const { showAlert } = useAlert();
 *
 * // Simple alert
 * showAlert({
 *   title: "Success",
 *   message: "Your action was completed successfully!",
 *   type: "success",
 * });
 *
 * // Confirmation alert
 * showAlert({
 *   title: "Confirm",
 *   message: "Are you sure?",
 *   type: "confirm",
 *   buttons: [
 *     { text: "Cancel", style: "cancel" },
 *     { text: "Delete", style: "destructive", onPress: () => deleteItem() },
 *   ],
 * });
 */

export const AlertProvider = ({children}) => {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "default",
    buttons: [{text: "OK"}],
  });

  const showAlert = useCallback(
    ({
      title = "",
      message = "",
      type = "default",
      buttons = [{text: "OK"}],
    }) => {
      setAlertConfig({
        visible: true,
        title,
        message,
        type,
        buttons,
      });
    },
    [],
  );

  const hideAlert = useCallback(() => {
    setAlertConfig(prev => ({...prev, visible: false}));
  }, []);

  // Helper methods for common alert types
  const showSuccess = useCallback(
    (title, message, onPress) => {
      showAlert({
        title,
        message,
        type: "success",
        buttons: [{text: "OK", onPress}],
      });
    },
    [showAlert],
  );

  const showError = useCallback(
    (title, message, onPress) => {
      showAlert({
        title,
        message,
        type: "error",
        buttons: [{text: "OK", onPress}],
      });
    },
    [showAlert],
  );

  const showWarning = useCallback(
    (title, message, onPress) => {
      showAlert({
        title,
        message,
        type: "warning",
        buttons: [{text: "OK", onPress}],
      });
    },
    [showAlert],
  );

  const showConfirm = useCallback(
    (
      title,
      message,
      onConfirm,
      onCancel,
      confirmText = "Confirm",
      cancelText = "Cancel",
      isDestructive = false,
    ) => {
      showAlert({
        title,
        message,
        type: "confirm",
        buttons: [
          {text: cancelText, style: "cancel", onPress: onCancel},
          {
            text: confirmText,
            style: isDestructive ? "destructive" : "default",
            onPress: onConfirm,
          },
        ],
      });
    },
    [showAlert],
  );

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        hideAlert,
        showSuccess,
        showError,
        showWarning,
        showConfirm,
      }}>
      {children}
      <Alert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

export default AlertContext;
