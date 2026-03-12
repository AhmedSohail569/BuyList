/**
 * useAsyncAction
 *
 * A lightweight hook that wraps async dispatch calls with:
 *  - a per-action loading flag (`loading`)
 *  - a pending-action guard to prevent concurrent duplicate calls
 *  - error surfacing via `error` state (string or null)
 *
 * Usage:
 *   const { run, loading } = useAsyncAction();
 *
 *   const handleDelete = () =>
 *     run(() => dispatch(deleteList({ listId })), {
 *       onSuccess: () => navigation.goBack(),
 *       onError:   (msg) => showError("Error", msg),
 *     });
 */
import { useState, useRef, useCallback } from "react";
import { getErrorMessage } from "~utils";

const useAsyncAction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inFlightRef = useRef(false);

  /**
   * @param {() => Promise<any>} asyncFn   - The async function to run
   * @param {object}             [options]
   * @param {() => void}         [options.onSuccess] - Called after success
   * @param {(msg: string) => void} [options.onError] - Called with error message
   * @param {boolean}            [options.resetErrorOnRun=true]
   */
  const run = useCallback(async (asyncFn, options = {}) => {
    if (inFlightRef.current) return;

    const { onSuccess, onError, resetErrorOnRun = true } = options;

    inFlightRef.current = true;
    setLoading(true);
    if (resetErrorOnRun) setError(null);

    try {
      await asyncFn();
      onSuccess?.();
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      onError?.(msg);
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
    inFlightRef.current = false;
  }, []);

  return { run, loading, error, reset };
};

export default useAsyncAction;
