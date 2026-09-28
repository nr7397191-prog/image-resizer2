import JSZip from 'jszip';

export interface FileEntry {
  path: string;
  category: 'Root Config' | 'App Module' | 'Kotlin Source' | 'Resources' | 'CI/CD Workflow';
  language: string;
  description: string;
  content: string;
}

export const PROJECT_FILES: FileEntry[] = [
  {
    path: 'settings.gradle.kts',
    category: 'Root Config',
    language: 'kotlin',
    description: 'Gradle project settings, repositories (Google, MavenCentral), and module inclusion (:app)',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "ImageCompressor"
include(":app")`
  },
  {
    path: 'build.gradle.kts',
    category: 'Root Config',
    language: 'kotlin',
    description: 'Root Gradle build configuration with Android & Kotlin compiler plugins',
    content: `plugins {
    id("com.android.application") version "8.3.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.23" apply false
    id("com.google.devtools.ksp") version "1.9.23-1.0.20" apply false
}`
  },
  {
    path: 'gradle.properties',
    category: 'Root Config',
    language: 'properties',
    description: 'JVM args (2048M memory), AndroidX flags, parallel builds and caching',
    content: `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.nonTransitiveRClass=true
kotlin.code.style=official
org.gradle.parallel=true
org.gradle.caching=true`
  },
  {
    path: 'gradle/wrapper/gradle-wrapper.properties',
    category: 'Root Config',
    language: 'properties',
    description: 'Gradle 8.7 binary distribution wrapper configuration',
    content: `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists`
  },
  {
    path: '.gitignore',
    category: 'Root Config',
    language: 'gitignore',
    description: 'Complete Android gitignore rules (.gradle, build, local.properties, apks)',
    content: `*.iml
.gradle
/local.properties
/.idea/caches
/.idea/libraries
/.idea/modules.xml
/.idea/workspace.xml
/.idea/navEditor.xml
/.idea/assetWizardSettings.xml
.DS_Store
/build
/captures
.externalNativeBuild
.cxx
*.apk
*.aab
output.json

# Built-in caches
.kotlin/
.navigation/
app/build/
*.hprof`
  },
  {
    path: '.github/workflows/build-apk.yml',
    category: 'CI/CD Workflow',
    language: 'yaml',
    description: 'GitHub Actions workflow: automatic JDK 17, Android SDK, gradle wrapper generation, assembleDebug & release upload',
    content: `name: Build Android APK

on:
  push:
    branches: [ "main", "master" ]
  workflow_dispatch:

jobs:
  build:
    name: Build Debug and Release APKs
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'

      - name: Set up Android SDK
        uses: android-actions/setup-android@v3

      - name: Generate or Ensure Gradle Wrapper
        run: |
          if [ ! -f "gradlew" ] || [ ! -f "gradle/wrapper/gradle-wrapper.jar" ]; then
            echo "Gradle wrapper missing or incomplete, generating with Gradle CLI..."
            gradle wrapper --gradle-version 8.7
          fi
          chmod +x gradlew

      - name: Accept Android Licenses
        run: yes | sdkmanager --licenses || true

      - name: Build Debug APK
        run: ./gradlew assembleDebug --stacktrace

      - name: Build Release APK (Debug Signed)
        run: ./gradlew assembleRelease --stacktrace

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: app-debug-apk
          path: app/build/outputs/apk/debug/*.apk
          retention-days: 14

      - name: Upload All APKs
        uses: actions/upload-artifact@v4
        with:
          name: app-all-apks
          path: app/build/outputs/apk/**/*.apk
          retention-days: 14`
  },
  {
    path: 'app/build.gradle.kts',
    category: 'App Module',
    language: 'kotlin',
    description: 'App build script: SDK 34, Compose Material3, Navigation, Coil, Room, Play Services AdMob, UMP',
    content: `plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.devtools.ksp")
}

android {
    namespace = "com.example.imagecompressor"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.imagecompressor"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        getByName("debug") { }
        create("release") {
            val storeFilePath = System.getenv("KEYSTORE_FILE") ?: ""
            if (storeFilePath.isNotEmpty() && file(storeFilePath).exists()) {
                storeFile = file(storeFilePath)
                storePassword = System.getenv("KEYSTORE_PASSWORD") ?: ""
                keyAlias = System.getenv("KEY_ALIAS") ?: ""
                keyPassword = System.getenv("KEY_PASSWORD") ?: ""
            } else {
                val debugConfig = getByName("debug")
                storeFile = debugConfig.storeFile
                storePassword = debugConfig.storePassword
                keyAlias = debugConfig.keyAlias
                keyPassword = debugConfig.keyPassword
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.11"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.0")
    implementation("androidx.activity:activity-compose:1.9.0")

    val composeBom = platform("androidx.compose:compose-bom:2024.05.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3:1.2.1")
    implementation("androidx.compose.material:material-icons-extended")

    implementation("androidx.navigation:navigation-compose:2.7.7")
    implementation("io.coil-kt:coil-compose:2.6.0")
    implementation("androidx.exifinterface:exifinterface:1.3.7")

    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")

    implementation("com.google.android.gms:play-services-ads:23.0.0")
    implementation("com.google.android.ump:user-messaging-platform:2.2.0")
    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.0")
}`
  },
  {
    path: 'app/proguard-rules.pro',
    category: 'App Module',
    language: 'pro',
    description: 'ProGuard/R8 rules for Room, Coil, Play Services Ads, and UMP',
    content: `-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**
-keep class coil.** { *; }
-dontwarn coil.**
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.** { *; }
-keep class com.google.android.ump.** { *; }
-keep class com.example.imagecompressor.data.local.** { *; }
-keepclassmembers class com.example.imagecompressor.data.local.** { *; }`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    category: 'App Module',
    language: 'xml',
    description: 'Manifest with permissions, AdMob App ID meta-data, MainActivity, and FileProvider',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" tools:ignore="ScopedStorage" />

    <application
        android:name=".ImageCompressorApp"
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.ImageCompressor.Starting">

        <!-- Google AdMob Application ID -->
        <!-- TODO: Replace test ID with your REAL AdMob App ID from Google AdMob Dashboard -->
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-3940256099942544~3347511713" />

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|screenLayout|keyboardHidden"
            android:theme="@style/Theme.ImageCompressor.Starting">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.SEND" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="image/*" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.SEND_MULTIPLE" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:mimeType="image/*" />
            </intent-filter>
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>

    </application>
</manifest>`
  },
  {
    path: 'app/src/main/java/com/example/imagecompressor/util/ImageCompressor.kt',
    category: 'Kotlin Source',
    language: 'kotlin',
    description: 'MAIN core compression engine: Binary Search on quality (1..100) + 0.8x iterative dimension downscaling + EXIF handling',
    content: `package com.example.imagecompressor.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import kotlin.math.roundToInt

data class CompressResult(
    val bitmap: Bitmap,
    val byteArray: ByteArray,
    val actualSizeBytes: Long,
    val actualSizeKB: Long,
    val originalSizeBytes: Long,
    val originalSizeKB: Long,
    val quality: Int,
    val width: Int,
    val height: Int,
    val format: ImageFormat,
    val iterations: Int = 1,
    val scaleFactor: Float = 1.0f
)

object ImageCompressor {

    suspend fun compressToTargetSize(
        inputUri: Uri,
        targetSizeKB: Int,
        outputFormat: ImageFormat,
        context: Context,
        onProgress: ((Int) -> Unit)? = null
    ): Result<CompressResult> = withContext(Dispatchers.IO) {
        try {
            onProgress?.invoke(5)
            val originalSizeBytes = FileUtils.getFileSize(context, inputUri)
            val originalSizeKB = originalSizeBytes / 1024
            val targetBytes = targetSizeKB.toLong() * 1024L

            var currentBitmap = loadBitmapWithExif(context, inputUri)
                ?: return@withContext Result.failure(Exception("Failed to decode image from selected URI"))

            onProgress?.invoke(15)

            var bestBytes: ByteArray? = null
            var bestQuality = 80
            var currentScale = 1.0f
            var iterationCount = 0
            val maxDownscaleSteps = 8

            while (iterationCount < maxDownscaleSteps) {
                iterationCount++

                if (outputFormat == ImageFormat.PNG) {
                    val stream = ByteArrayOutputStream()
                    currentBitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
                    val candidateBytes = stream.toByteArray()
                    if (candidateBytes.size <= targetBytes || currentBitmap.width <= 120 || currentBitmap.height <= 120) {
                        bestBytes = candidateBytes
                        bestQuality = 100
                        break
                    }
                } else {
                    // Binary search on compression quality: low = 1, high = 100
                    var low = 1
                    var high = 100
                    var pass = 0

                    while (low <= high && pass < 10) {
                        pass++
                        val mid = (low + high) / 2
                        val stream = ByteArrayOutputStream()
                        currentBitmap.compress(outputFormat.toCompressFormat(), mid, stream)
                        val candidateBytes = stream.toByteArray()
                        val progressPercent = 20 + ((iterationCount * 10) + pass * 2).coerceAtMost(75)
                        onProgress?.invoke(progressPercent)

                        if (candidateBytes.size > targetBytes) {
                            high = mid - 1
                        } else {
                            bestBytes = candidateBytes
                            bestQuality = mid
                            low = mid + 1
                        }
                    }

                    if (bestBytes != null) break
                }

                // Downscale dimensions by 0.8x if quality 1 is still above target
                val nextWidth = (currentBitmap.width * 0.8f).roundToInt()
                val nextHeight = (currentBitmap.height * 0.8f).roundToInt()

                if (nextWidth < 80 || nextHeight < 80) {
                    val stream = ByteArrayOutputStream()
                    currentBitmap.compress(outputFormat.toCompressFormat(), 10, stream)
                    bestBytes = stream.toByteArray()
                    bestQuality = 10
                    break
                }

                val scaled = Bitmap.createScaledBitmap(currentBitmap, nextWidth, nextHeight, true)
                if (scaled != currentBitmap && !currentBitmap.isRecycled) {
                    currentBitmap.recycle()
                }
                currentBitmap = scaled
                currentScale *= 0.8f
            }

            val finalBytes = bestBytes ?: run {
                val stream = ByteArrayOutputStream()
                currentBitmap.compress(outputFormat.toCompressFormat(), 20, stream)
                stream.toByteArray()
            }

            val finalBitmap = BitmapFactory.decodeByteArray(finalBytes, 0, finalBytes.size) ?: currentBitmap
            onProgress?.invoke(100)

            Result.success(
                CompressResult(
                    bitmap = finalBitmap,
                    byteArray = finalBytes,
                    actualSizeBytes = finalBytes.size.toLong(),
                    actualSizeKB = (finalBytes.size / 1024L).coerceAtLeast(1L),
                    originalSizeBytes = originalSizeBytes,
                    originalSizeKB = originalSizeKB,
                    quality = bestQuality,
                    width = finalBitmap.width,
                    height = finalBitmap.height,
                    format = outputFormat,
                    iterations = iterationCount,
                    scaleFactor = currentScale
                )
            )
        } catch (oom: OutOfMemoryError) {
            Result.failure(Exception("Image is too large for device memory."))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun loadBitmapWithExif(context: Context, uri: Uri): Bitmap? {
        val resolver = context.contentResolver
        val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, options) }

        var sampleSize = 1
        while ((options.outWidth / sampleSize) > 4096 || (options.outHeight / sampleSize) > 4096) {
            sampleSize *= 2
        }

        val decodeOptions = BitmapFactory.Options().apply {
            inSampleSize = sampleSize
            inPreferredConfig = Bitmap.Config.ARGB_8888
        }
        val rawBitmap = resolver.openInputStream(uri)?.use {
            BitmapFactory.decodeStream(it, null, decodeOptions)
        } ?: return null

        var orientation = ExifInterface.ORIENTATION_NORMAL
        try {
            resolver.openInputStream(uri)?.use {
                orientation = ExifInterface(it).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
            }
        } catch (_: Exception) {}

        val matrix = Matrix()
        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
            else -> return rawBitmap
        }
        return Bitmap.createBitmap(rawBitmap, 0, 0, rawBitmap.width, rawBitmap.height, matrix, true)
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/imagecompressor/util/AdManager.kt',
    category: 'Kotlin Source',
    language: 'kotlin',
    description: 'AdMob & UMP manager: Banner, Interstitial loaded & displayed after every 3rd compression cycle',
    content: `package com.example.imagecompressor.util

import android.app.Activity
import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.google.android.gms.ads.*
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.ump.UserMessagingPlatform

object AdManager {
    private const val TAG = "AdManager"
    private var interstitialAd: InterstitialAd? = null
    private var isAdLoading = false

    fun requestConsentAndInitAds(activity: Activity, onConsentCompleted: () -> Unit) {
        val consentInformation = UserMessagingPlatform.getConsentInformation(activity)
        consentInformation.requestConsentInfoUpdate(
            activity,
            com.google.android.ump.ConsentRequestParameters.Builder().build(),
            {
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) {
                    if (consentInformation.canRequestAds()) preloadInterstitial(activity)
                    onConsentCompleted()
                }
            },
            { onConsentCompleted() }
        )
    }

    fun preloadInterstitial(context: Context) {
        if (interstitialAd != null || isAdLoading) return
        isAdLoading = true
        // TODO: Replace TEST_ADMOB_INTERSTITIAL_ID with your REAL ID
        InterstitialAd.load(
            context,
            Constants.TEST_ADMOB_INTERSTITIAL_ID,
            AdRequest.Builder().build(),
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialAd = ad
                    isAdLoading = false
                }
                override fun onAdFailedToLoad(loadAdError: LoadAdError) {
                    interstitialAd = null
                    isAdLoading = false
                }
            }
        )
    }

    fun onCompressionCompleted(activity: Activity, onFinished: () -> Unit) {
        val prefs = activity.getSharedPreferences(Constants.PREFS_NAME, Context.MODE_PRIVATE)
        val count = prefs.getInt(Constants.PREF_COMPRESSION_COUNT, 0) + 1
        prefs.edit().putInt(Constants.PREF_COMPRESSION_COUNT, count).apply()

        if (count % Constants.INTERSTITIAL_AD_INTERVAL == 0) {
            showInterstitialIfReady(activity, onFinished)
        } else {
            preloadInterstitial(activity)
            onFinished()
        }
    }

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
            }
            ad.show(activity)
        } else {
            preloadInterstitial(activity)
            onFinished()
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/imagecompressor/util/Constants.kt',
    category: 'Kotlin Source',
    language: 'kotlin',
    description: 'AdMob official test IDs, default target sizes, quality thresholds, and SharedPreferences keys',
    content: `package com.example.imagecompressor.util

object Constants {
    const val DATABASE_NAME = "image_compressor_history.db"
    const val PREFS_NAME = "image_compressor_prefs"
    const val PREF_COMPRESSION_COUNT = "key_compression_count"
    const val INTERSTITIAL_AD_INTERVAL = 3

    // Google AdMob official verified test Ad Unit IDs
    // TODO: Replace with your real AdMob Ad Unit IDs before uploading to Play Store
    const val TEST_ADMOB_BANNER_ID = "ca-app-pub-3940256099942544/6300978111"
    const val TEST_ADMOB_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712"
    const val TEST_ADMOB_NATIVE_ID = "ca-app-pub-3940256099942544/2247696110"
    const val TEST_ADMOB_APP_ID = "ca-app-pub-3940256099942544~3347511713"

    const val DEFAULT_TARGET_SIZE_KB = 100
    const val MIN_TARGET_SIZE_KB = 10
    const val MAX_TARGET_SIZE_KB = 15360
    const val DEFAULT_QUALITY_PERCENT = 80
}`
  },
  {
    path: 'app/src/main/java/com/example/imagecompressor/util/FileUtils.kt',
    category: 'Kotlin Source',
    language: 'kotlin',
    description: 'MediaStore public collection saving, Downloads folder saver, Intent sharesheet, and byte size formatters',
    content: `package com.example.imagecompressor.util

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.provider.OpenableColumns
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object FileUtils {
    fun getFileSize(context: Context, uri: Uri): Long {
        return try {
            context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
                if (sizeIndex != -1 && cursor.moveToFirst()) cursor.getLong(sizeIndex) else 0L
            } ?: 0L
        } catch (_: Exception) { 0L }
    }

    fun formatFileSize(bytes: Long): String {
        val kb = bytes / 1024.0
        val mb = kb / 1024.0
        return when {
            mb >= 1.0 -> String.format(Locale.US, "%.2f MB", mb)
            kb >= 1.0 -> String.format(Locale.US, "%.1f KB", kb)
            else -> "$bytes B"
        }
    }

    suspend fun saveToGallery(context: Context, byteArray: ByteArray, format: ImageFormat): Result<Uri> = withContext(Dispatchers.IO) {
        try {
            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val filename = "Compressed_$timestamp.\${format.extension}"
            val values = ContentValues().apply {
                put(MediaStore.Images.Media.DISPLAY_NAME, filename)
                put(MediaStore.Images.Media.MIME_TYPE, format.mimeType)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    put(MediaStore.Images.Media.RELATIVE_PATH, "\${Environment.DIRECTORY_PICTURES}/ImageCompressor")
                    put(MediaStore.Images.Media.IS_PENDING, 1)
                }
            }
            val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
            } else {
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI
            }
            val uri = context.contentResolver.insert(collection, values) ?: return@withContext Result.failure(Exception("Failed"))
            context.contentResolver.openOutputStream(uri)?.use { it.write(byteArray) }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.clear()
                values.put(MediaStore.Images.Media.IS_PENDING, 0)
                context.contentResolver.update(uri, values, null, null)
            }
            Result.success(uri)
        } catch (e: Exception) { Result.failure(e) }
    }

    suspend fun saveToDownloads(context: Context, byteArray: ByteArray, format: ImageFormat): Result<Uri> = withContext(Dispatchers.IO) {
        try {
            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val filename = "Compressed_$timestamp.\${format.extension}"
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, filename)
                    put(MediaStore.Downloads.MIME_TYPE, format.mimeType)
                    put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                }
                val uri = context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values) ?: return@withContext Result.failure(Exception("Failed"))
                context.contentResolver.openOutputStream(uri)?.use { it.write(byteArray) }
                Result.success(uri)
            } else {
                val dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                val targetFile = File(dir, filename)
                FileOutputStream(targetFile).use { it.write(byteArray) }
                Result.success(Uri.fromFile(targetFile))
            }
        } catch (e: Exception) { Result.failure(e) }
    }

    fun shareImage(context: Context, byteArray: ByteArray, format: ImageFormat) {
        try {
            val cache = File(context.cacheDir, "shared_images").apply { mkdirs() }
            val file = File(cache, "shared_compressed.\${format.extension}")
            FileOutputStream(file).use { it.write(byteArray) }
            val uri = FileProvider.getUriForFile(context, "\${context.packageName}.fileprovider", file)
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = format.mimeType
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            context.startActivity(Intent.createChooser(intent, "Share Compressed Image"))
        } catch (e: Exception) { e.printStackTrace() }
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/imagecompressor/viewmodel/CompressViewModel.kt',
    category: 'Kotlin Source',
    language: 'kotlin',
    description: 'CompressViewModel managing UI state, photo selection, target size/quality, and async processing',
    content: `package com.example.imagecompressor.viewmodel

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.imagecompressor.ImageCompressorApp
import com.example.imagecompressor.data.ImageRepository
import com.example.imagecompressor.util.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

enum class CompressionMode { TARGET_SIZE, MANUAL_QUALITY }

sealed interface CompressionUiState {
    object Idle : CompressionUiState
    data class Compressing(val progress: Int) : CompressionUiState
    data class Success(val result: CompressResult) : CompressionUiState
    data class Error(val message: String) : CompressionUiState
}

class CompressViewModel(application: Application) : AndroidViewModel(application) {
    private val repository: ImageRepository by lazy {
        val app = application as ImageCompressorApp
        ImageRepository(app.database.historyDao(), app)
    }

    private val _selectedUris = MutableStateFlow<List<Uri>>(emptyList())
    val selectedUris: StateFlow<List<Uri>> = _selectedUris.asStateFlow()

    private val _activeUriIndex = MutableStateFlow(0)
    val activeUriIndex: StateFlow<Int> = _activeUriIndex.asStateFlow()

    private val _compressionMode = MutableStateFlow(CompressionMode.TARGET_SIZE)
    val compressionMode: StateFlow<CompressionMode> = _compressionMode.asStateFlow()

    private val _targetSizeKB = MutableStateFlow(Constants.DEFAULT_TARGET_SIZE_KB)
    val targetSizeKB: StateFlow<Int> = _targetSizeKB.asStateFlow()

    private val _qualityPercent = MutableStateFlow(Constants.DEFAULT_QUALITY_PERCENT)
    val qualityPercent: StateFlow<Int> = _qualityPercent.asStateFlow()

    private val _outputFormat = MutableStateFlow(ImageFormat.JPG)
    val outputFormat: StateFlow<ImageFormat> = _outputFormat.asStateFlow()

    private val _uiState = MutableStateFlow<CompressionUiState>(CompressionUiState.Idle)
    val uiState: StateFlow<CompressionUiState> = _uiState.asStateFlow()

    private val _userMessage = MutableStateFlow<String?>(null)
    val userMessage: StateFlow<String?> = _userMessage.asStateFlow()

    val currentUri: Uri? get() = _selectedUris.value.getOrNull(_activeUriIndex.value)

    fun onImagesSelected(uris: List<Uri>) {
        if (uris.isNotEmpty()) {
            _selectedUris.value = uris
            _activeUriIndex.value = 0
            _uiState.value = CompressionUiState.Idle
        }
    }

    fun setActiveImageIndex(index: Int) {
        if (index in _selectedUris.value.indices) {
            _activeUriIndex.value = index
            _uiState.value = CompressionUiState.Idle
        }
    }

    fun setCompressionMode(mode: CompressionMode) { _compressionMode.value = mode }
    fun setTargetSizeKB(kb: Int) { _targetSizeKB.value = kb.coerceIn(10, 15360) }
    fun setQualityPercent(q: Int) { _qualityPercent.value = q.coerceIn(1, 100) }
    fun setOutputFormat(f: ImageFormat) { _outputFormat.value = f }
    fun clearUserMessage() { _userMessage.value = null }

    fun startCompression() {
        val uri = currentUri ?: return
        viewModelScope.launch {
            _uiState.value = CompressionUiState.Compressing(10)
            val res = if (_compressionMode.value == CompressionMode.TARGET_SIZE) {
                repository.compressToTargetSize(uri, _targetSizeKB.value, _outputFormat.value) {
                    _uiState.value = CompressionUiState.Compressing(it)
                }
            } else {
                repository.compressWithQuality(uri, _qualityPercent.value, _outputFormat.value)
            }
            res.fold(
                onSuccess = { _uiState.value = CompressionUiState.Success(it) },
                onFailure = { _uiState.value = CompressionUiState.Error(it.localizedMessage ?: "Failed") }
            )
        }
    }

    fun saveToGallery() {
        val state = _uiState.value as? CompressionUiState.Success ?: return
        viewModelScope.launch {
            repository.saveToGallery(state.result.byteArray, state.result.format).onSuccess {
                repository.recordHistory("Compressed_\${System.currentTimeMillis()}", it, state.result)
                _userMessage.value = "Saved to Gallery!"
            }
        }
    }

    fun saveToDownloads() {
        val state = _uiState.value as? CompressionUiState.Success ?: return
        viewModelScope.launch {
            repository.saveToDownloads(state.result.byteArray, state.result.format).onSuccess {
                repository.recordHistory("Compressed_\${System.currentTimeMillis()}", it, state.result)
                _userMessage.value = "Saved to Downloads!"
            }
        }
    }

    fun shareImage() {
        val state = _uiState.value as? CompressionUiState.Success ?: return
        repository.shareImage(state.result.byteArray, state.result.format)
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/imagecompressor/MainActivity.kt',
    category: 'Kotlin Source',
    language: 'kotlin',
    description: 'Single Activity hosting Compose AppNavigation, splash screen, and external SEND intents',
    content: `package com.example.imagecompressor

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

class MainActivity : ComponentActivity() {
    private val compressViewModel: CompressViewModel by viewModels()
    private val historyViewModel: HistoryViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        AdManager.requestConsentAndInitAds(this) {
            AdManager.preloadInterstitial(this)
        }

        handleIncomingIntent(intent)

        setContent {
            ImageCompressorTheme {
                AppNavigation(compressViewModel, historyViewModel)
            }
        }
    }

    private fun handleIncomingIntent(intent: Intent?) {
        if (intent == null) return
        if (intent.action == Intent.ACTION_SEND) {
            val uri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
            uri?.let { compressViewModel.onImagesSelected(listOf(it)) }
        }
    }
}`
  },
  {
    path: 'app/src/main/res/values/strings.xml',
    category: 'Resources',
    language: 'xml',
    description: 'English string resources for Material 3 UI, actions, and dialogs',
    content: `<resources>
    <string name="app_name">Image Compressor</string>
    <string name="app_tagline">Smart Size &amp; Format Optimizer</string>
    <string name="home_title">Compressor</string>
    <string name="history_title">History</string>
    <string name="settings_title">Settings</string>
    <string name="select_images">Select Images</string>
    <string name="select_single_or_multi">Select single or multiple photos (JPG, PNG, WEBP, HEIC)</string>
    <string name="mode_target_size">Target Size</string>
    <string name="mode_quality">Quality %</string>
    <string name="target_size_label">Target File Size (KB)</string>
    <string name="target_size_hint">e.g. 50, 100, 250, 500</string>
    <string name="output_format">Output Format</string>
    <string name="compress_now">Compress Image</string>
    <string name="save_gallery">Save to Gallery</string>
    <string name="save_downloads">Save to Downloads</string>
    <string name="share">Share</string>
    <string name="compression_success">Compression Complete!</string>
</resources>`
  },
  {
    path: 'app/src/main/res/values-hi/strings.xml',
    category: 'Resources',
    language: 'xml',
    description: 'Hindi localization resources (मानकीकृत हिंदी अनुवाद)',
    content: `<resources>
    <string name="app_name">इमेज कंप्रेसर</string>
    <string name="app_tagline">स्मार्ट साइज़ और फॉर्मेट कन्वर्टर</string>
    <string name="home_title">कंप्रेसर</string>
    <string name="history_title">इतिहास</string>
    <string name="settings_title">सेटिंग्स</string>
    <string name="select_images">फोटो चुनें</string>
    <string name="mode_target_size">लक्षित साइज़ (KB)</string>
    <string name="mode_quality">क्वालिटी %</string>
    <string name="target_size_label">मनचाहा फ़ाइल साइज़ (KB)</string>
    <string name="compress_now">कंप्रेस करें</string>
    <string name="save_gallery">गैलरी में सहेजें</string>
    <string name="save_downloads">डाउनलोड्स में सहेजें</string>
    <string name="share">शेयर करें</string>
    <string name="compression_success">कंप्रेशन पूरा हुआ!</string>
</resources>`
  }
];

export async function generateAndroidZip(): Promise<Blob> {
  const zip = new JSZip();

  PROJECT_FILES.forEach((file) => {
    zip.file(file.path, file.content);
  });

  return await zip.generateAsync({ type: 'blob' });
}
