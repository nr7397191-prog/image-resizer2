# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /opt/android-sdk/tools/proguard/proguard-android.txt

# Keep Room generated classes
-keep class * extends androidx.room.RoomDatabase
-dontwarn androidx.room.paging.**

# Keep Coil image loader classes
-keep class coil.** { *; }
-dontwarn coil.**

# Google AdMob & Play Services
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.** { *; }
-keep class com.google.android.ump.** { *; }

# Keep model entities
-keep class com.example.imagecompressor.data.local.** { *; }
-keepclassmembers class com.example.imagecompressor.data.local.** { *; }
