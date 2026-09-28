package com.example.imagecompressor.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Compress
import androidx.compose.material.icons.rounded.History
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import com.example.imagecompressor.R
import com.example.imagecompressor.ui.screens.CompressScreen
import com.example.imagecompressor.ui.screens.HomeScreen
import com.example.imagecompressor.ui.screens.HistoryScreen
import com.example.imagecompressor.ui.screens.SettingsScreen
import com.example.imagecompressor.viewmodel.CompressViewModel
import com.example.imagecompressor.viewmodel.HistoryViewModel

sealed class Screen(val route: String, val titleRes: Int, val icon: ImageVector) {
    object Home : Screen("home", R.string.home_title, Icons.Rounded.Compress)
    object History : Screen("history", R.string.history_title, Icons.Rounded.History)
    object Settings : Screen("settings", R.string.settings_title, Icons.Rounded.Settings)
    object Result : Screen("result", R.string.compression_success, Icons.Rounded.Compress)
}

@Composable
fun AppNavigation(
    compressViewModel: CompressViewModel,
    historyViewModel: HistoryViewModel
) {
    val navController = rememberNavController()
    val snackbarHostState = remember { SnackbarHostState() }
    val userMessage by compressViewModel.userMessage.collectAsState()

    LaunchedEffect(userMessage) {
        userMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            compressViewModel.clearUserMessage()
        }
    }

    val bottomNavItems = listOf(Screen.Home, Screen.History, Screen.Settings)
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            if (currentRoute != Screen.Result.route) {
                NavigationBar {
                    bottomNavItems.forEach { screen ->
                        NavigationBarItem(
                            icon = { Icon(screen.icon, contentDescription = stringResource(screen.titleRes)) },
                            label = { Text(stringResource(screen.titleRes)) },
                            selected = currentRoute == screen.route,
                            onClick = {
                                navController.navigate(screen.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Home.route) {
                HomeScreen(
                    viewModel = compressViewModel,
                    onNavigateToResult = {
                        navController.navigate(Screen.Result.route)
                    }
                )
            }
            composable(Screen.Result.route) {
                CompressScreen(
                    viewModel = compressViewModel,
                    onNavigateBack = {
                        navController.popBackStack()
                    }
                )
            }
            composable(Screen.History.route) {
                HistoryScreen(viewModel = historyViewModel)
            }
            composable(Screen.Settings.route) {
                SettingsScreen()
            }
        }
    }
}
