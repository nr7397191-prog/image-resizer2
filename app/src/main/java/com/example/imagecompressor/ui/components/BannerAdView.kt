package com.example.imagecompressor.ui.components

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.imagecompressor.util.Constants
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView

/**
 * Jetpack Compose wrapper for Google AdMob Banner Ad.
 */
@Composable
fun BannerAdView(
    modifier: Modifier = Modifier
) {
    AndroidView(
        modifier = modifier
            .fillMaxWidth()
            .height(50.dp),
        factory = { context ->
            AdView(context).apply {
                setAdSize(AdSize.BANNER)
                // TODO: In production, ensure Constants.TEST_ADMOB_BANNER_ID is replaced with your real Banner Ad ID
                adUnitId = Constants.TEST_ADMOB_BANNER_ID
                loadAd(AdRequest.Builder().build())
            }
        }
    )
}
