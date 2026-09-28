package com.example.imagecompressor.util

import android.app.Activity
import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform

/**
 * AdManager handles Google AdMob integration, UMP consent gathering,
 * and smart interstitial ad frequency pacing (after every 3rd compression).
 */
object AdManager {
    private const val TAG = "AdManager"
    private var interstitialAd: InterstitialAd? = null
    private var isAdLoading = false

    /**
     * Initializes Google User Messaging Platform (UMP) to gather GDPR/privacy consent.
     */
    fun requestConsentAndInitAds(activity: Activity, onConsentCompleted: () -> Unit) {
        val params = ConsentRequestParameters.Builder()
            .setTagForUnderAgeOfConsent(false)
            .build()

        val consentInformation: ConsentInformation = UserMessagingPlatform.getConsentInformation(activity)
        consentInformation.requestConsentInfoUpdate(
            activity,
            params,
            {
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) { formError ->
                    if (formError != null) {
                        Log.w(TAG, "Consent form error: ${formError.message}")
                    }
                    if (consentInformation.canRequestAds()) {
                        preloadInterstitial(activity)
                    }
                    onConsentCompleted()
                }
            },
            { requestConsentError ->
                Log.w(TAG, "Consent info request failed: ${requestConsentError.message}")
                onConsentCompleted()
            }
        )
    }

    /**
     * Preloads an interstitial ad in the background.
     */
    fun preloadInterstitial(context: Context) {
        if (interstitialAd != null || isAdLoading) return

        isAdLoading = true
        val adRequest = AdRequest.Builder().build()

        // TODO: Replace Constants.TEST_ADMOB_INTERSTITIAL_ID with your REAL Interstitial Ad Unit ID for production
        InterstitialAd.load(
            context,
            Constants.TEST_ADMOB_INTERSTITIAL_ID,
            adRequest,
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                    isAdLoading = false
                    Log.d(TAG, "Interstitial ad loaded successfully")
                }

                override fun onAdFailedToLoad(loadAdError: LoadAdError) {
                    interstitialAd = null
                    isAdLoading = false
                    Log.w(TAG, "Interstitial failed to load: ${loadAdError.message}")
                }
            }
        )
    }

    /**
     * Increments the compression counter in SharedPreferences.
     * If the counter reaches [Constants.INTERSTITIAL_AD_INTERVAL] (every 3rd compression),
     * it triggers the interstitial ad and resets or continues the cycle.
     */
    fun onCompressionCompleted(activity: Activity, onAdDismissedOrSkipped: () -> Unit) {
        val prefs: SharedPreferences = activity.getSharedPreferences(Constants.PREFS_NAME, Context.MODE_PRIVATE)
        val currentCount = prefs.getInt(Constants.PREF_COMPRESSION_COUNT, 0) + 1
        prefs.edit().putInt(Constants.PREF_COMPRESSION_COUNT, currentCount).apply()

        Log.d(TAG, "Compression count is now $currentCount")

        if (currentCount % Constants.INTERSTITIAL_AD_INTERVAL == 0) {
            showInterstitialIfReady(activity, onAdDismissedOrSkipped)
        } else {
            // Not yet the 3rd compression, ensure next ad is ready
            preloadInterstitial(activity)
            onAdDismissedOrSkipped()
        }
    }

    /**
     * Shows the preloaded interstitial ad if available, with callbacks.
     */
    private fun showInterstitialIfReady(activity: Activity, onFinished: () -> Unit) {
        val ad = interstitialAd
        if (ad != null) {
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    interstitialAd = null
                    preloadInterstitial(activity)
                    onFinished()
                }

                override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                    interstitialAd = null
                    preloadInterstitial(activity)
                    onFinished()
                }

                override fun onAdShowedFullScreenContent() {
                    // Ad is showing
                }
            }
            ad.show(activity)
        } else {
            preloadInterstitial(activity)
            onFinished()
        }
    }
}
