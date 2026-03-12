import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    // Configure Firebase (must be called before any other Firebase service)
    FirebaseApp.configure()

    // Set this app as the UNUserNotificationCenter delegate so we can:
    // 1. Show notification banners while the app is in the FOREGROUND
    // 2. Handle notification taps (opened from notification)
    UNUserNotificationCenter.current().delegate = self

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "BuyList",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // ─── Deep Linking: Custom URL Scheme (buylist://invite/...) ──────────────
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return RCTLinkingManager.application(app, open: url, options: options)
  }

  // ─── Deep Linking: Universal Links (https://getbagg.com/invite/...) ──────
  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    return RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
  }
}

// ─── UNUserNotificationCenter Delegate ────────────────────────────────────────
// Required to display notifications when the app is in the FOREGROUND on iOS.
// Without this, iOS silently swallows the notification and nothing shows.
extension AppDelegate: UNUserNotificationCenterDelegate {

  /// Called when a notification arrives while the app is in the FOREGROUND.
  /// Return the presentation options to control what the user sees.
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    // // Show banner + play sound + update badge even while app is active
    // if #available(iOS 14.0, *) {
    //   completionHandler([.banner, .badge, .sound])
    // } else {
    //   completionHandler([.alert, .badge, .sound])
    // }
    // App is in foreground:
    // We show our own in-app toast (JS) so we suppress the native iOS banner/alert here.
    // This prevents duplicate UI (toast + system banner).
    completionHandler([])
  }

  /// Called when the user taps on a notification (foreground or background).
  /// React Native Firebase handles routing via its own listener, so we just complete here.
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    completionHandler()
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
