package com.example.imagecompressor.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Entity representing a compressed image record saved in the local Room database.
 */
@Entity(tableName = "compression_history")
data class HistoryEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val fileName: String,
    val filePath: String,
    val originalSizeBytes: Long,
    val compressedSizeBytes: Long,
    val originalDimensions: String,
    val compressedDimensions: String,
    val format: String,
    val quality: Int,
    val timestamp: Long = System.currentTimeMillis()
) {
    val savedPercentage: Float
        get() = if (originalSizeBytes > 0) {
            ((originalSizeBytes - compressedSizeBytes).toFloat() / originalSizeBytes) * 100f
        } else {
            0f
        }
}
