package com.example.imagecompressor.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.InputStream
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * Result data class containing all details of the compressed image.
 */
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

/**
 * Production-ready image compressor implementing binary search on quality
 * and iterative dimension downsampling to strictly satisfy target file size constraints.
 */
object ImageCompressor {

    /**
     * Compresses the image at [inputUri] to be as close to [targetSizeKB] as possible
     * without exceeding it. Uses binary search for quality (1..100) and downscaling (0.8x)
     * if quality reduction alone is insufficient.
     *
     * @param inputUri Uri of the source image.
     * @param targetSizeKB Desired maximum size in Kilobytes.
     * @param outputFormat Output format (JPG, PNG, WEBP).
     * @param context Android context for content resolution.
     * @param onProgress Optional callback reporting percentage progress (0..100).
     */
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

            // 1. Load source bitmap with EXIF orientation correction
            var currentBitmap = loadBitmapWithExif(context, inputUri)
                ?: return@withContext Result.failure(Exception("Failed to decode image from selected URI"))

            onProgress?.invoke(15)

            // If original already meets the target and format is unchanged, quick bypass
            if (originalSizeBytes in 1..targetBytes && outputFormat == ImageFormat.JPG) {
                val stream = ByteArrayOutputStream()
                currentBitmap.compress(outputFormat.toCompressFormat(), 95, stream)
                val bytes = stream.toByteArray()
                if (bytes.size <= targetBytes) {
                    onProgress?.invoke(100)
                    return@withContext Result.success(
                        CompressResult(
                            bitmap = currentBitmap,
                            byteArray = bytes,
                            actualSizeBytes = bytes.size.toLong(),
                            actualSizeKB = bytes.size / 1024L,
                            originalSizeBytes = originalSizeBytes,
                            originalSizeKB = originalSizeKB,
                            quality = 95,
                            width = currentBitmap.width,
                            height = currentBitmap.height,
                            format = outputFormat
                        )
                    )
                }
            }

            var bestBytes: ByteArray? = null
            var bestQuality = 80
            var currentScale = 1.0f
            var iterationCount = 0
            val maxDownscaleSteps = 8

            // Loop dimension reductions if quality reduction alone is insufficient
            while (iterationCount < maxDownscaleSteps) {
                iterationCount++

                // PNG does not support lossy compression quality, so PNG relies primarily on dimension scaling
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
                    // Binary search on compression quality: low = 1, high = 100 (Max 10 passes)
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
                            low = mid + 1 // Try higher quality that still fits target
                        }
                    }

                    if (bestBytes != null) {
                        // Found a valid configuration under target
                        break
                    }
                }

                // If even at lowest quality it exceeds target size, downscale dimensions by 0.8x
                val nextWidth = (currentBitmap.width * 0.8f).roundToInt()
                val nextHeight = (currentBitmap.height * 0.8f).roundToInt()

                if (nextWidth < 80 || nextHeight < 80) {
                    // Reached minimum threshold, capture current lowest quality as fallback
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

            // Decode final compressed bitmap for UI preview
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
            Result.failure(Exception("Image is too large for device memory. Please select a smaller photo."))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Compresses the image using a fixed manual quality slider (10% to 100%).
     */
    suspend fun compressWithQuality(
        inputUri: Uri,
        qualityPercent: Int,
        outputFormat: ImageFormat,
        context: Context
    ): Result<CompressResult> = withContext(Dispatchers.IO) {
        try {
            val originalSizeBytes = FileUtils.getFileSize(context, inputUri)
            val originalSizeKB = originalSizeBytes / 1024
            val bitmap = loadBitmapWithExif(context, inputUri)
                ?: return@withContext Result.failure(Exception("Failed to decode image"))

            val stream = ByteArrayOutputStream()
            val safeQuality = qualityPercent.coerceIn(1, 100)
            bitmap.compress(outputFormat.toCompressFormat(), safeQuality, stream)
            val bytes = stream.toByteArray()
            val finalBitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: bitmap

            Result.success(
                CompressResult(
                    bitmap = finalBitmap,
                    byteArray = bytes,
                    actualSizeBytes = bytes.size.toLong(),
                    actualSizeKB = (bytes.size / 1024L).coerceAtLeast(1L),
                    originalSizeBytes = originalSizeBytes,
                    originalSizeKB = originalSizeKB,
                    quality = safeQuality,
                    width = finalBitmap.width,
                    height = finalBitmap.height,
                    format = outputFormat
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Loads a Bitmap from [Uri] with automatic downsampling if huge,
     * and handles EXIF rotation to ensure correct orientation.
     */
    private fun loadBitmapWithExif(context: Context, uri: Uri): Bitmap? {
        val resolver = context.contentResolver

        // Step 1: Check dimensions first to avoid OutOfMemoryError
        val options = BitmapFactory.Options().apply {
            inJustDecodeBounds = true
        }
        resolver.openInputStream(uri)?.use { inputStream ->
            BitmapFactory.decodeStream(inputStream, null, options)
        }

        val maxDimension = 4096
        var sampleSize = 1
        val rawWidth = options.outWidth
        val rawHeight = options.outHeight

        if (rawWidth > maxDimension || rawHeight > maxDimension) {
            val halfHeight = rawHeight / 2
            val halfWidth = rawWidth / 2
            while ((halfHeight / sampleSize) >= maxDimension || (halfWidth / sampleSize) >= maxDimension) {
                sampleSize *= 2
            }
        }

        // Step 2: Decode real bitmap
        val decodeOptions = BitmapFactory.Options().apply {
            inSampleSize = sampleSize
            inPreferredConfig = Bitmap.Config.ARGB_8888
        }
        val rawBitmap = resolver.openInputStream(uri)?.use { inputStream ->
            BitmapFactory.decodeStream(inputStream, null, decodeOptions)
        } ?: return null

        // Step 3: Handle EXIF orientation rotation
        var orientation = ExifInterface.ORIENTATION_NORMAL
        try {
            resolver.openInputStream(uri)?.use { inputStream ->
                val exif = ExifInterface(inputStream)
                orientation = exif.getAttributeInt(
                    ExifInterface.TAG_ORIENTATION,
                    ExifInterface.ORIENTATION_NORMAL
                )
            }
        } catch (e: Exception) {
            // Some formats (PNG, etc.) might not have EXIF headers
        }

        val matrix = Matrix()
        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
            ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
            ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
            else -> return rawBitmap
        }

        return Bitmap.createBitmap(
            rawBitmap, 0, 0, rawBitmap.width, rawBitmap.height, matrix, true
        )
    }
}
