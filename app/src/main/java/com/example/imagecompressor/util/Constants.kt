package com.example.imagecompressor.util

/**
 * Global constants for configuration and Google AdMob test IDs.
 */
object Constants {
    const val DATABASE_NAME = "image_compressor_history.db"
    const val PREFS_NAME = "image_compressor_prefs"
    const val PREF_COMPRESSION_COUNT = "key_compression_count"
    const val INTERSTITIAL_AD_INTERVAL = 3

    // =========================================================================================
    // GOOGLE ADMOB TEST IDs (Google's official verified sample ad unit IDs)
    // TODO: Before publishing to Google Play Store, replace these with your REAL Ad Unit IDs
    // from your Google AdMob Dashboard (https://admob.google.com).
    // =========================================================================================
    const val TEST_ADMOB_BANNER_ID = "ca-app-pub-3940256099942544/6300978111"
    const val TEST_ADMOB_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712"
    const val TEST_ADMOB_NATIVE_ID = "ca-app-pub-3940256099942544/2247696110"
    const val TEST_ADMOB_APP_ID = "ca-app-pub-3940256099942544~3347511713"

    // Default compression settings
    const val DEFAULT_TARGET_SIZE_KB = 100
    const val MIN_TARGET_SIZE_KB = 10
    const val MAX_TARGET_SIZE_KB = 15360 // 15 MB
    const val DEFAULT_QUALITY_PERCENT = 80
}
