package com.example.imagecompressor.util

import android.graphics.Bitmap
import android.os.Build

/**
 * Supported image output formats for compression and conversion.
 */
enum class ImageFormat(
    val extension: String,
    val mimeType: String,
    val displayName: String
) {
    JPG("jpg", "image/jpeg", "JPEG"),
    PNG("png", "image/png", "PNG"),
    WEBP("webp", "image/webp", "WEBP");

    /**
     * Maps this format to the native Android [Bitmap.CompressFormat].
     */
    fun toCompressFormat(): Bitmap.CompressFormat {
        return when (this) {
            JPG -> Bitmap.CompressFormat.JPEG
            PNG -> Bitmap.CompressFormat.PNG
            WEBP -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    Bitmap.CompressFormat.WEBP_LOSSY
                } else {
                    @Suppress("DEPRECATION")
                    Bitmap.CompressFormat.WEBP
                }
            }
        }
    }

    companion object {
        fun fromMimeType(mime: String?): ImageFormat {
            return when {
                mime?.contains("png", ignoreCase = true) == true -> PNG
                mime?.contains("webp", ignoreCase = true) == true -> WEBP
                else -> JPG
            }
        }
    }
}
