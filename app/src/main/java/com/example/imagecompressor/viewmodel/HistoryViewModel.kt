package com.example.imagecompressor.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.imagecompressor.ImageCompressorApp
import com.example.imagecompressor.data.ImageRepository
import com.example.imagecompressor.data.local.HistoryEntity
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class HistoryViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: ImageRepository by lazy {
        val app = application as ImageCompressorApp
        ImageRepository(app.database.historyDao(), app)
    }

    val historyList: StateFlow<List<HistoryEntity>> = repository.historyFlow
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun deleteItem(entity: HistoryEntity) {
        viewModelScope.launch {
            repository.deleteHistory(entity)
        }
    }

    fun clearAllHistory() {
        viewModelScope.launch {
            repository.clearHistory()
        }
    }
}
