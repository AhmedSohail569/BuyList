package com.buylist

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here:
          add(SpeechRecognizerPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)

    // ── Create FCM notification channel (Android 8+ / API 26+) ──────────────
    // Android will SILENTLY DROP all notification banners unless the channel
    // referenced in AndroidManifest (default_notification_channel_id) exists.
    // This must run on every cold start before any notification can be shown.
    createNotificationChannel()
  }

  /**
   * Creates the default FCM notification channel used for all push notifications.
   * Safe to call on every launch — createNotificationChannel() is idempotent.
   */
  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channelId   = "buylist_notifications"
      val channelName = "BuyList Notifications"
      val description = "Receive updates about your lists and circle activity"
      val importance  = NotificationManager.IMPORTANCE_HIGH // Enables heads-up banners

      val channel = NotificationChannel(channelId, channelName, importance).apply {
        this.description = description
        enableLights(true)
        enableVibration(true)
        setShowBadge(true)
      }

      val notificationManager =
        getSystemService(NOTIFICATION_SERVICE) as NotificationManager
      notificationManager.createNotificationChannel(channel)
    }
  }
}

