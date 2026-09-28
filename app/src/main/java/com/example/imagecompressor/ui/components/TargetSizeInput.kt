package com.example.imagecompressor.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Tune
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.imagecompressor.R
import com.example.imagecompressor.viewmodel.CompressionMode

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TargetSizeInput(
    mode: CompressionMode,
    targetSizeKB: Int,
    qualityPercent: Int,
    onModeChange: (CompressionMode) -> Unit,
    onTargetSizeChange: (Int) -> Unit,
    onQualityChange: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Mode Tabs (Target Size vs Quality %)
            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                SegmentedButton(
                    selected = mode == CompressionMode.TARGET_SIZE,
                    onClick = { onModeChange(CompressionMode.TARGET_SIZE) },
                    shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2)
                ) {
                    Text(stringResource(R.string.mode_target_size), fontWeight = FontWeight.SemiBold)
                }
                SegmentedButton(
                    selected = mode == CompressionMode.MANUAL_QUALITY,
                    onClick = { onModeChange(CompressionMode.MANUAL_QUALITY) },
                    shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2)
                ) {
                    Text(stringResource(R.string.mode_quality), fontWeight = FontWeight.SemiBold)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            if (mode == CompressionMode.TARGET_SIZE) {
                // Target Size KB Input
                var textValue by remember(targetSizeKB) { mutableStateOf(targetSizeKB.toString()) }

                OutlinedTextField(
                    value = textValue,
                    onValueChange = { input ->
                        val filtered = input.filter { it.isDigit() }
                        textValue = filtered
                        filtered.toIntOrNull()?.let { kb ->
                            if (kb in 10..15360) {
                                onTargetSizeChange(kb)
                            }
                        }
                    },
                    label = { Text(stringResource(R.string.target_size_label)) },
                    placeholder = { Text(stringResource(R.string.target_size_hint)) },
                    trailingIcon = { Text("KB", modifier = Modifier.padding(end = 12.dp), fontWeight = FontWeight.Bold) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Preset Quick Chips
                Text(
                    text = "Quick Presets:",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf(50, 100, 200, 500, 1024).forEach { presetKB ->
                        val isSelected = targetSizeKB == presetKB
                        FilterChip(
                            selected = isSelected,
                            onClick = {
                                textValue = presetKB.toString()
                                onTargetSizeChange(presetKB)
                            },
                            label = {
                                Text(if (presetKB >= 1024) "${presetKB / 1024} MB" else "$presetKB KB")
                            }
                        )
                    }
                }
            } else {
                // Quality Slider
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = stringResource(R.string.quality_slider_label, qualityPercent),
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.SemiBold
                    )
                    Icon(
                        imageVector = Icons.Rounded.Tune,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Slider(
                    value = qualityPercent.toFloat(),
                    onValueChange = { onQualityChange(it.toInt()) },
                    valueRange = 10f..100f,
                    steps = 17,
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("10% (Lowest size)", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("100% (High fidelity)", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}
