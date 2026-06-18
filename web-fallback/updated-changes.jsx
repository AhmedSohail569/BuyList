import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { icons } from "../assets/icons";

const IOS_STORE_URL = "https://apps.apple.com/us/app/buylist/id6757783448";
const ANDROID_STORE_URL = "https://play.google.com/store/apps/details?id=com.buylist";

const SESSION_KEY = "bagg_app_opened";

const ua = navigator.userAgent || "";
const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
const isAndroid = /android/i.test(ua);
const isMobile = isIOS || isAndroid;

export default function Invite() {
  const { inviteCode } = useParams();

  const code =
    inviteCode || window.location.pathname.split("/invite/")[1]?.split("/")[0]?.split("?")[0] || null;

  useEffect(() => {
    if (!isMobile || sessionStorage.getItem(SESSION_KEY)) return;

    // Silently try to open the app — no timer, no auto-redirect.
    window.location.href = code ? `bagg://invite/${code}` : "bagg://";

    // Remember that we fired the scheme so tab-reloads skip it.
    const onHide = () => {
      if (document.hidden) sessionStorage.setItem(SESSION_KEY, "1");
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [code]);

  // Tries the custom scheme; redirects to the store only if the app is not installed.
  const handleOpenInApp = () => {
    let appOpened = false;

    const onHide = () => {
      if (document.hidden) {
        appOpened = true;
        sessionStorage.setItem(SESSION_KEY, "1");
      }
      document.removeEventListener("visibilitychange", onHide);
    };
    document.addEventListener("visibilitychange", onHide);

    window.location.href = code ? `bagg://invite/${code}` : "bagg://";

    setTimeout(() => {
      document.removeEventListener("visibilitychange", onHide);
      if (!appOpened) {
        window.location.replace(isIOS ? IOS_STORE_URL : ANDROID_STORE_URL);
      }
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center py-32 px-5 bg-gray-50 text-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {code ? "You've been invited!" : "Get Bagg"}
        </h1>

        <p className="text-gray-500 mb-6 leading-relaxed">
          {code
            ? "Download the app to accept your invite and shop together with your circle."
            : "Download Bagg to start managing your shopping lists."}
        </p>

        <div className="flex flex-col gap-4 items-center justify-center w-full">
          {/* App Store — iOS only (or desktop shows both) */}
          {(!isMobile || isIOS) && (
            <a
              href={IOS_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-4 px-8 py-4 rounded-2xl font-semibold transition shadow-xl"
              style={{ backgroundColor: "#FFFFFF", color: "#1E9DF1", border: "1.5px solid #1E9DF1" }}
            >
              <icons.AppleIcon className="text-2xl" />
              <div className="text-left">
                <p className="text-xs" style={{ color: "#1E9DF1" }}>
                  Download on the
                </p>
                <p className="text-lg font-bold" style={{ color: "#1E9DF1" }}>
                  App Store
                </p>
              </div>
            </a>
          )}

          {/* Google Play — Android only (or desktop shows both) */}
          {(!isMobile || isAndroid) && (
            <a
              href={ANDROID_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-4 px-8 py-4 rounded-2xl font-semibold transition shadow-xl"
              style={{ backgroundColor: "#1E9DF1", color: "#FFFFFF" }}
            >
              <icons.SmartphoneIcon className="text-2xl" />
              <div className="text-left">
                <p className="text-xs opacity-80">Get it on</p>
                <p className="text-lg font-bold">Google Play</p>
              </div>
            </a>
          )}

          {/* "Open in Bagg" — mobile only, shown when there is an invite code */}
          {code && isMobile && (
            <>
              <div className="text-gray-400 text-xs mt-2">— already have the app? —</div>
              <button
                onClick={handleOpenInApp}
                className="w-full px-8 py-4 rounded-2xl font-semibold transition shadow border border-gray-200 bg-gray-50 text-gray-700"
              >
                Open in Bagg
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}