package com.example.imagecompressor.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.imagecompressor.R
import com.example.imagecompressor.util.ImageFormat

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FormatSelector(
    selectedFormat: ImageFormat,
    onFormatSelected: (ImageFormat) -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = stringResource(R.string.output_format),
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(10.dp))

            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                ImageFormat.values().forEachIndexed { index, format ->
                    SegmentedButton(
                        selected = selectedFormat == format,
                        onClick = { onFormatSelected(format) },
                        shape = SegmentedButtonDefaults.itemShape(index = index, count = ImageFormat.values().size)
                    ) {
                        Text(
                            text = format.displayName,
                            fontWeight = if (selectedFormat == format) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            val formatDescription = when (selectedFormat) {
                ImageFormat.JPG -> "Best for standard photos with optimal compression ratio."
                ImageFormat.PNG -> "Preserves transparency, lossless quality (larger size)."
                ImageFormat.WEBP -> "Next-gen web format with high compression efficiency."
            }

            Text(
                text = formatDescription,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
