package com.example.imagecompressor.util

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
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
import java.io.InputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * File utilities for reading, saving to MediaStore/Downloads, and sharing.
 */
object FileUtils {

    /**
     * Resolves the real file size in bytes from a [Uri].
     */
    fun getFileSize(context: Context, uri: Uri): Long {
        return try {
            context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
                if (sizeIndex != -1 && cursor.moveToFirst()) {
                    cursor.getLong(sizeIndex)
                } else {
                    0L
                }
            } ?: 0L
        } catch (e: Exception) {
            0L
        }
    }

    /**
     * Formats bytes into clean human-readable KB and MB strings.
     */
    fun formatFileSize(bytes: Long): String {
        val kb = bytes / 1024.0
        val mb = kb / 1024.0
        return when {
            mb >= 1.0 -> String.format(Locale.US, "%.2f MB", mb)
            kb >= 1.0 -> String.format(Locale.US, "%.1f KB", kb)
            else -> "$bytes B"
        }
    }

    /**
     * Saves compressed byte array to the public Pictures/Gallery collection using MediaStore API.
     */
    suspend fun saveToGallery(
        context: Context,
        byteArray: ByteArray,
        format: ImageFormat
    ): Result<Uri> = withContext(Dispatchers.IO) {
        try {
            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val filename = "Compressed_$timestamp.${format.extension}"

            val values = ContentValues().apply {
                put(MediaStore.Images.Media.DISPLAY_NAME, filename)
                put(MediaStore.Images.Media.MIME_TYPE, format.mimeType)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    put(MediaStore.Images.Media.RELATIVE_PATH, "${Environment.DIRECTORY_PICTURES}/ImageCompressor")
                    put(MediaStore.Images.Media.IS_PENDING, 1)
                }
            }

            val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
            } else {
                MediaStore.Images.Media.EXTERNAL_CONTENT_URI
            }

            val itemUri = context.contentResolver.insert(collection, values)
                ?: return@withContext Result.failure(Exception("Unable to create MediaStore entry"))

            context.contentResolver.openOutputStream(itemUri)?.use { outputStream ->
                outputStream.write(byteArray)
                outputStream.flush()
            } ?: return@withContext Result.failure(Exception("Unable to open output stream"))

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                values.clear()
                values.put(MediaStore.Images.Media.IS_PENDING, 0)
                context.contentResolver.update(itemUri, values, null, null)
            }

            Result.success(itemUri)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Saves compressed byte array directly into the Downloads folder.
     */
    suspend fun saveToDownloads(
        context: Context,
        byteArray: ByteArray,
        format: ImageFormat
    ): Result<Uri> = withContext(Dispatchers.IO) {
        try {
            val timestamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val filename = "Compressed_$timestamp.${format.extension}"

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, filename)
                    put(MediaStore.Downloads.MIME_TYPE, format.mimeType)
                    put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                    put(MediaStore.Downloads.IS_PENDING, 1)
                }
                val uri = context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                    ?: return@withContext Result.failure(Exception("Failed to create download entry"))
                context.contentResolver.openOutputStream(uri)?.use { it.write(byteArray) }
                values.clear()
                values.put(MediaStore.Downloads.IS_PENDING, 0)
                context.contentResolver.update(uri, values, null, null)
                Result.success(uri)
            } else {
                @Suppress("DEPRECATION")
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                if (!downloadsDir.exists()) downloadsDir.mkdirs()
                val targetFile = File(downloadsDir, filename)
                FileOutputStream(targetFile).use { it.write(byteArray) }
                Result.success(Uri.fromFile(targetFile))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Shares compressed bytes via standard Android system Sharesheet.
     */
    fun shareImage(context: Context, byteArray: ByteArray, format: ImageFormat) {
        try {
            val cachePath = File(context.cacheDir, "shared_images").apply { mkdirs() }
            val file = File(cachePath, "shared_compressed.${format.extension}")
            FileOutputStream(file).use { it.write(byteArray) }

            val contentUri: Uri = FileProvider.getUriForFile(
                context,
                "${context.packageName}.fileprovider",
                file
            )

            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                type = format.mimeType
                putExtra(Intent.EXTRA_STREAM, contentUri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            context.startActivity(Intent.createChooser(shareIntent, "Share Compressed Image"))
        } catch (e: Exception) {
            // Fallback: If FileProvider is not ready yet, write to external cache
            e.printStackTrace()
        }
    }
}
