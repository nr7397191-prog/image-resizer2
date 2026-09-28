package com.example.imagecompressor.data.local

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

/**
 * Data Access Object for compression history table.
 */
@Dao
interface HistoryDao {

    @Query("SELECT * FROM compression_history ORDER BY timestamp DESC")
    fun getAllHistory(): Flow<List<HistoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entry: HistoryEntity): Long

    @Delete
    suspend fun delete(entry: HistoryEntity)

    @Query("DELETE FROM compression_history WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM compression_history")
    suspend fun clearAll()
}
