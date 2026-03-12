import { NativeModules, NativeEventEmitter, Platform } from "react-native";

const { NativeSpeech } = NativeModules;

// Create event emitter, guarded against module not existing (e.g., failed to link)
const speechEmitter = NativeSpeech ? new NativeEventEmitter(NativeSpeech) : null;

class SpeechRecognizer {
  /**
   * Start listening to speech
   * @param {Object} options
   * @param {Function} options.onStart - Callback when listening starts
   * @param {Function} options.onResult - Callback for partial or final results (text, isFinal)
   * @param {Function} options.onEnd - Callback when speech ends successfully
   * @param {Function} options.onError - Callback when an error occurs
   * @returns {void}
   */
  static async startListening({ onStart, onResult, onEnd, onError }) {
    if (!NativeSpeech) {
      onError?.(new Error("Native Speech Module is not linked."));
      return;
    }

    this._clearListeners();

    // Attach listeners
    if (onStart) this.startSub = speechEmitter.addListener("onSpeechStart", onStart);
    if (onResult) {
      this.resultSub = speechEmitter.addListener("onSpeechResults", (event) => {
        onResult(event.text, event.isFinal);
      });
    }
    if (onEnd) this.endSub = speechEmitter.addListener("onSpeechEnd", () => {
        onEnd();
        this._clearListeners();
    });
    if (onError) {
      this.errorSub = speechEmitter.addListener("onSpeechError", (event) => {
        onError(new Error(event.error));
        this._clearListeners();
      });
    }

    try {
      await NativeSpeech.startListening();
    } catch (e) {
      this._clearListeners();
      onError?.(e);
    }
  }

  /**
   * Stop listening to speech manually
   */
  static async stopListening() {
    if (!NativeSpeech) return;
    try {
      await NativeSpeech.stopListening();
    } catch (e) {
      console.error("Failed to stop listening", e);
    }
  }

  static _clearListeners() {
    this.startSub?.remove();
    this.resultSub?.remove();
    this.endSub?.remove();
    this.errorSub?.remove();
    
    this.startSub = null;
    this.resultSub = null;
    this.endSub = null;
    this.errorSub = null;
  }
}

export default SpeechRecognizer;
