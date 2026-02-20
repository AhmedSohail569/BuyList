/**
 * PermissionsContext
 *
 * Shares the `locationReady` flag across the navigator tree so
 * LocationPermissionGate only activates AFTER the notification
 * permission flow has fully completed (granted, denied, or skipped).
 */
import React, { createContext, useContext } from "react";

const PermissionsContext = createContext({
  locationReady: false,
});

export const PermissionsProvider = ({ locationReady, children }) => (
  <PermissionsContext.Provider value={{ locationReady }}>
    {children}
  </PermissionsContext.Provider>
);

export const usePermissionsContext = () => useContext(PermissionsContext);

export default PermissionsContext;
