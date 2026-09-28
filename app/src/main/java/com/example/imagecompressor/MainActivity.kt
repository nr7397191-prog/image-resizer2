package com.example.imagecompressor

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.example.imagecompressor.ui.navigation.AppNavigation
import com.example.imagecompressor.ui.theme.ImageCompressorTheme
import com.example.imagecompressor.util.AdManager
import com.example.imagecompressor.viewmodel.CompressViewModel
import com.example.imagecompressor.viewmodel.HistoryViewModel

/**
 * Main Activity serving as the single-activity entry point for Jetpack Compose.
 */
class MainActivity : ComponentActivity() {

    private val compressViewModel: CompressViewModel by viewModels()
    private val historyViewModel: HistoryViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        // Install Android 12+ SplashScreen
        installSplashScreen()

        super.onCreate(savedInstanceState)

        // Request UMP ad consent and preload interstitial
        AdManager.requestConsentAndInitAds(this) {
            AdManager.preloadInterstitial(this)
        }

        // Handle incoming image shared from another application
        handleIncomingIntent(intent)

        setContent {
            ImageCompressorTheme {
                AppNavigation(
                    compressViewModel = compressViewModel,
                    historyViewModel = historyViewModel
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIncomingIntent(intent)
    }

    private fun handleIncomingIntent(intent: Intent?) {
        if (intent == null) return

        when (intent.action) {
            Intent.ACTION_SEND -> {
                val imageUri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableExtra(Intent.EXTRA_STREAM, Uri::class.java)
                } else {
                    @Suppress("DEPRECATION")
                    intent.getParcelableExtra(Intent.EXTRA_STREAM)
                }
                imageUri?.let { uri ->
                    compressViewModel.onImagesSelected(listOf(uri))
                }
            }
            Intent.ACTION_SEND_MULTIPLE -> {
                val uris = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM, Uri::class.java)
                } else {
                    @Suppress("DEPRECATION")
                    intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM)
                }
                if (!uris.isNullOrEmpty()) {
                    compressViewModel.onImagesSelected(uris)
                }
            }
        }
    }
}
