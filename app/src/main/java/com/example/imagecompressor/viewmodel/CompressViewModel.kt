package com.example.imagecompressor.viewmodel

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.imagecompressor.ImageCompressorApp
import com.example.imagecompressor.data.ImageRepository
import com.example.imagecompressor.util.CompressResult
import com.example.imagecompressor.util.Constants
import com.example.imagecompressor.util.FileUtils
import com.example.imagecompressor.util.ImageFormat
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class CompressionMode {
    TARGET_SIZE,
    MANUAL_QUALITY
}

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

    // Selected images
    private val _selectedUris = MutableStateFlow<List<Uri>>(emptyList())
    val selectedUris: StateFlow<List<Uri>> = _selectedUris.asStateFlow()

    private val _activeUriIndex = MutableStateFlow(0)
    val activeUriIndex: StateFlow<Int> = _activeUriIndex.asStateFlow()

    // Configuration
    private val _compressionMode = MutableStateFlow(CompressionMode.TARGET_SIZE)
    val compressionMode: StateFlow<CompressionMode> = _compressionMode.asStateFlow()

    private val _targetSizeKB = MutableStateFlow(Constants.DEFAULT_TARGET_SIZE_KB)
    val targetSizeKB: StateFlow<Int> = _targetSizeKB.asStateFlow()

    private val _qualityPercent = MutableStateFlow(Constants.DEFAULT_QUALITY_PERCENT)
    val qualityPercent: StateFlow<Int> = _qualityPercent.asStateFlow()

    private val _outputFormat = MutableStateFlow(ImageFormat.JPG)
    val outputFormat: StateFlow<ImageFormat> = _outputFormat.asStateFlow()

    // State
    private val _uiState = MutableStateFlow<CompressionUiState>(CompressionUiState.Idle)
    val uiState: StateFlow<CompressionUiState> = _uiState.asStateFlow()

    // Notifications (Snackbar)
    private val _userMessage = MutableStateFlow<String?>(null)
    val userMessage: StateFlow<String?> = _userMessage.asStateFlow()

    val currentUri: Uri?
        get() = _selectedUris.value.getOrNull(_activeUriIndex.value)

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

    fun setCompressionMode(mode: CompressionMode) {
        _compressionMode.value = mode
    }

    fun setTargetSizeKB(kb: Int) {
        _targetSizeKB.value = kb.coerceIn(Constants.MIN_TARGET_SIZE_KB, Constants.MAX_TARGET_SIZE_KB)
    }

    fun setQualityPercent(percent: Int) {
        _qualityPercent.value = percent.coerceIn(1, 100)
    }

    fun setOutputFormat(format: ImageFormat) {
        _outputFormat.value = format
    }

    fun clearUserMessage() {
        _userMessage.value = null
    }

    fun startCompression() {
        val uri = currentUri
        if (uri == null) {
            _userMessage.value = "Please select an image first"
            return
        }

        viewModelScope.launch {
            _uiState.value = CompressionUiState.Compressing(progress = 10)

            val result = if (_compressionMode.value == CompressionMode.TARGET_SIZE) {
                repository.compressToTargetSize(
                    uri = uri,
                    targetSizeKB = _targetSizeKB.value,
                    format = _outputFormat.value,
                    onProgress = { progress ->
                        _uiState.value = CompressionUiState.Compressing(progress)
                    }
                )
            } else {
                repository.compressWithQuality(
                    uri = uri,
                    qualityPercent = _qualityPercent.value,
                    format = _outputFormat.value
                )
            }

            result.fold(
                onSuccess = { compressed ->
                    _uiState.value = CompressionUiState.Success(compressed)
                    _userMessage.value = "Compressed: ${FileUtils.formatFileSize(compressed.actualSizeBytes)}"
                },
                onFailure = { error ->
                    _uiState.value = CompressionUiState.Error(error.localizedMessage ?: "Compression failed")
                    _userMessage.value = "Error: ${error.message}"
                }
            )
        }
    }

    fun saveToGallery(onSuccess: (() -> Unit)? = null) {
        val state = _uiState.value as? CompressionUiState.Success ?: return
        viewModelScope.launch {
            val result = repository.saveToGallery(state.result.byteArray, state.result.format)
            result.fold(
                onSuccess = { uri ->
                    repository.recordHistory("Compressed_${System.currentTimeMillis()}", uri, state.result)
                    _userMessage.value = "Saved to Gallery!"
                    onSuccess?.invoke()
                },
                onFailure = { error ->
                    _userMessage.value = "Failed to save: ${error.message}"
                }
            )
        }
    }

    fun saveToDownloads(onSuccess: (() -> Unit)? = null) {
        val state = _uiState.value as? CompressionUiState.Success ?: return
        viewModelScope.launch {
            val result = repository.saveToDownloads(state.result.byteArray, state.result.format)
            result.fold(
                onSuccess = { uri ->
                    repository.recordHistory("Compressed_${System.currentTimeMillis()}", uri, state.result)
                    _userMessage.value = "Saved to Downloads folder!"
                    onSuccess?.invoke()
                },
                onFailure = { error ->
                    _userMessage.value = "Failed to save to Downloads: ${error.message}"
                }
            )
        }
    }

    fun shareImage() {
        val state = _uiState.value as? CompressionUiState.Success ?: return
        repository.shareImage(state.result.byteArray, state.result.format)
    }
}
