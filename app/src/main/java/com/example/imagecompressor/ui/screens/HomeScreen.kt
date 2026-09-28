package com.example.imagecompressor.ui.screens

import android.app.Activity
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.imagecompressor.R
import com.example.imagecompressor.ui.components.*
import com.example.imagecompressor.util.AdManager
import com.example.imagecompressor.viewmodel.CompressViewModel
import com.example.imagecompressor.viewmodel.CompressionUiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: CompressViewModel,
    onNavigateToResult: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val activity = context as? Activity
    val selectedUris by viewModel.selectedUris.collectAsState()
    val activeIndex by viewModel.activeUriIndex.collectAsState()
    val mode by viewModel.compressionMode.collectAsState()
    val targetSizeKB by viewModel.targetSizeKB.collectAsState()
    val qualityPercent by viewModel.qualityPercent.collectAsState()
    val outputFormat by viewModel.outputFormat.collectAsState()
    val uiState by viewModel.uiState.collectAsState()

    val scrollState = rememberScrollState()

    // Automatically navigate to result view if compression succeeds
    LaunchedEffect(uiState) {
        if (uiState is CompressionUiState.Success) {
            activity?.let { act ->
                AdManager.onCompressionCompleted(act) {
                    onNavigateToResult()
                }
            } ?: onNavigateToResult()
        }
    }

    Scaffold(
        bottomBar = {
            Column {
                BannerAdView()
            }
        }
    ) { innerPadding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(scrollState)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = stringResource(R.string.app_name),
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.ExtraBold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = stringResource(R.string.app_tagline),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Image Picker Section
            ImagePickerCard(
                selectedUris = selectedUris,
                activeUriIndex = activeIndex,
                onImagesSelected = { uris ->
                    viewModel.onImagesSelected(uris)
                }
            )

            // Multiple Selection Horizontal Thumbnails Strip
            if (selectedUris.size > 1) {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    itemsIndexed(selectedUris) { index, uri ->
                        val isSelected = index == activeIndex
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .border(
                                    width = if (isSelected) 2.5.dp else 1.dp,
                                    color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant,
                                    shape = RoundedCornerShape(10.dp)
                                )
                                .clickable { viewModel.setActiveImageIndex(index) }
                        ) {
                            AsyncImage(
                                model = ImageRequest.Builder(context).data(uri).crossfade(true).build(),
                                contentDescription = null,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                    }
                }
            }

            // Compression Settings
            TargetSizeInput(
                mode = mode,
                targetSizeKB = targetSizeKB,
                qualityPercent = qualityPercent,
                onModeChange = { viewModel.setCompressionMode(it) },
                onTargetSizeChange = { viewModel.setTargetSizeKB(it) },
                onQualityChange = { viewModel.setQualityPercent(it) }
            )

            // Output Format Selector
            FormatSelector(
                selectedFormat = outputFormat,
                onFormatSelected = { viewModel.setOutputFormat(it) }
            )

            // Compression Action Button
            val isCompressing = uiState is CompressionUiState.Compressing
            val currentProgress = (uiState as? CompressionUiState.Compressing)?.progress ?: 0

            Button(
                onClick = { viewModel.startCompression() },
                enabled = selectedUris.isNotEmpty() && !isCompressing,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                if (isCompressing) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(22.dp),
                        color = MaterialTheme.colorScheme.onPrimary,
                        strokeWidth = 2.5.dp
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = stringResource(R.string.compressing_progress, currentProgress),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                } else {
                    Icon(imageVector = Icons.Rounded.Compress, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = stringResource(R.string.compress_now),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Error display
            if (uiState is CompressionUiState.Error) {
                val errorMsg = (uiState as CompressionUiState.Error).message
                Surface(
                    color = MaterialTheme.colorScheme.errorContainer,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Warning,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.error
                        )
                        Text(
                            text = errorMsg,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onErrorContainer
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}
