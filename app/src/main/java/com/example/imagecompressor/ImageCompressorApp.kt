package com.example.imagecompressor

import android.app.Application
import com.example.imagecompressor.data.local.AppDatabase
import com.google.android.gms.ads.MobileAds

/**
 * Custom Application class for initializing global singletons like AdMob and Room.
 */
class ImageCompressorApp : Application() {

    val database: AppDatabase by lazy {
        AppDatabase.getDatabase(this)
    }

    override fun onCreate() {
        super.onCreate()

        // Initialize Google Mobile Ads SDK on a background thread
        MobileAds.initialize(this) { initializationStatus ->
            // SDK initialization complete
        }
    }
}
