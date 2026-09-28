# Image Compressor & Converter (Android)

A production-ready Native Android application built with **Jetpack Compose**, **Material 3**, **MVVM (ViewModel + StateFlow)**, **Room Database**, and **Google AdMob**.

Features a binary search target size compression algorithm, multi-format conversion (JPG, PNG, WEBP), side-by-side zoom/pan comparison, MediaStore gallery & downloads saving, and automatic APK build via GitHub Actions.

---

## 🚀 Key Features

- 🎯 **Target File Size Compression**: Enter your desired file size in KB (e.g., 50 KB, 100 KB, 200 KB, 500 KB). Uses a binary search algorithm on JPEG/WEBP quality + iterative 0.8x downsampling to meet target without exceeding.
- 🖼️ **Photo Picker API**: Native Android Photo Picker (`ActivityResultContracts.PickVisualMedia`) supporting single & multi-image selection (JPG, PNG, WEBP, HEIC, BMP).
- 🔄 **Format Conversion**: Convert seamlessly between JPEG, PNG, and WEBP.
- 🎚️ **Manual Quality Mode**: Slider from 10% to 100% with real-time size estimation.
- 🔍 **Side-by-Side Comparison**: Zoomable & pannable before/after preview with exact dimensions and file size reduction percentage.
- 💾 **Save & Share**: Save to Gallery (via `MediaStore`), Downloads folder, and direct Android Sharesheet.
- 🗄️ **History**: Offline Room database tracking all compressed files with quick re-share and delete actions.
- 💰 **AdMob & UMP**: Google AdMob Banner, Interstitial (shown after every 3rd compression), and UMP (User Messaging Platform) consent handling.
- 🌐 **Localization**: Full English and Hindi (`values-hi`) strings.
- 🤖 **GitHub Actions CI/CD**: Automatic APK build on push to `main` with direct artifact download.

---

## 🛠️ Tech Stack & Architecture

- **Language**: Kotlin 1.9.23
- **Min SDK**: 24 (Android 7.0)
- **Target / Compile SDK**: 34 (Android 14)
- **UI**: Jetpack Compose + Material 3
- **Architecture**: MVVM with `StateFlow` and unidirectional data flow
- **Image Engine**: Android Native Graphics (`BitmapFactory`, `ExifInterface`, `Matrix`) + Coil for Compose
- **Database**: Room 2.6.1 + KSP
- **Monetization**: Google Play Services Ads 23.0.0 + UMP Consent SDK 2.2.0
- **Build System**: Gradle 8.7 with Kotlin DSL (`build.gradle.kts`)

---

## 📦 Building with GitHub Actions (Zero Local Setup)

1. Push this repository to GitHub.
2. Navigate to the **Actions** tab in your GitHub repository.
3. The **Build Android APK** workflow will trigger automatically on push, or click **Run workflow**.
4. Once completed, download `app-debug-apk` from the **Artifacts** section at the bottom of the run page.
5. Transfer the APK to your Android device and install it (allow "Install from Unknown Sources").

---

## 💻 Local Build Instructions

### Prerequisites
- Android Studio Iguana / Jellyfish or newer
- JDK 17 (Temurin recommended)
- Android SDK 34

### Commands
```bash
# Clone the repository
git clone https://github.com/yourusername/image-compressor.git
cd image-compressor

# Generate wrapper if not present
gradle wrapper --gradle-version 8.7

# Build debug APK
./gradlew assembleDebug

# Output location:
# app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔑 AdMob Configuration

Test IDs are enabled by default. To monetize with real ads:
1. Open `app/src/main/java/com/example/imagecompressor/util/Constants.kt`.
2. Replace `TEST_ADMOB_BANNER_ID` and `TEST_ADMOB_INTERSTITIAL_ID` with your real AdMob Ad Unit IDs.
3. Open `app/src/main/AndroidManifest.xml` and replace the `APPLICATION_ID` meta-data value with your AdMob App ID (`ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy`).
