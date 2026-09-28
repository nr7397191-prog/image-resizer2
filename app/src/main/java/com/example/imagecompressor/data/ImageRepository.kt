package com.example.imagecompressor.data

import android.content.Context
import android.net.Uri
import com.example.imagecompressor.data.local.HistoryDao
import com.example.imagecompressor.data.local.HistoryEntity
import com.example.imagecompressor.util.CompressResult
import com.example.imagecompressor.util.FileUtils
import com.example.imagecompressor.util.ImageCompressor
import com.example.imagecompressor.util.ImageFormat
import kotlinx.coroutines.flow.Flow

/**
 * Repository orchestrating image compression execution, media saving, and Room history logging.
 */
class ImageRepository(
    private val historyDao: HistoryDao,
    private val context: Context
) {

    val historyFlow: Flow<List<HistoryEntity>> = historyDao.getAllHistory()

    suspend fun compressToTargetSize(
        uri: Uri,
        targetSizeKB: Int,
        format: ImageFormat,
        onProgress: ((Int) -> Unit)? = null
    ): Result<CompressResult> {
        return ImageCompressor.compressToTargetSize(
            inputUri = uri,
            targetSizeKB = targetSizeKB,
            outputFormat = format,
            context = context,
            onProgress = onProgress
        )
    }

    suspend fun compressWithQuality(
        uri: Uri,
        qualityPercent: Int,
        format: ImageFormat
    ): Result<CompressResult> {
        return ImageCompressor.compressWithQuality(
            inputUri = uri,
            qualityPercent = qualityPercent,
            outputFormat = format,
            context = context
        )
    }

    suspend fun saveToGallery(byteArray: ByteArray, format: ImageFormat): Result<Uri> {
        return FileUtils.saveToGallery(context, byteArray, format)
    }

    suspend fun saveToDownloads(byteArray: ByteArray, format: ImageFormat): Result<Uri> {
        return FileUtils.saveToDownloads(context, byteArray, format)
    }

    fun shareImage(byteArray: ByteArray, format: ImageFormat) {
        FileUtils.shareImage(context, byteArray, format)
    }

    suspend fun recordHistory(
        fileName: String,
        savedUri: Uri?,
        result: CompressResult
    ): Long {
        val entry = HistoryEntity(
            fileName = fileName,
            filePath = savedUri?.toString() ?: "",
            originalSizeBytes = result.originalSizeBytes,
            compressedSizeBytes = result.actualSizeBytes,
            originalDimensions = "Source",
            compressedDimensions = "${result.width}x${result.height}",
            format = result.format.name,
            quality = result.quality
        )
        return historyDao.insert(entry)
    }

    suspend fun deleteHistory(entry: HistoryEntity) {
        historyDao.delete(entry)
    }

    suspend fun clearHistory() {
        historyDao.clearAll()
    }
}
