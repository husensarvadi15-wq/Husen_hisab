package com.example

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.viewinterop.AndroidView

class MainActivity : ComponentActivity() {

  private var filePathCallback: ValueCallback<Array<Uri>>? = null

  private val fileChooserLauncher =
    registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
      if (result.resultCode == Activity.RESULT_OK) {
        val data: Intent? = result.data
        val uris = WebChromeClient.FileChooserParams.parseResult(result.resultCode, data)
        filePathCallback?.onReceiveValue(uris)
      } else {
        filePathCallback?.onReceiveValue(null)
      }
      filePathCallback = null
    }

  @SuppressLint("SetJavaScriptEnabled")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()

    setContent {
      var webViewInstance by remember { mutableStateOf<WebView?>(null) }

      BackHandler(enabled = true) {
        if (webViewInstance?.canGoBack() == true) {
          webViewInstance?.goBack()
        } else {
          finish()
        }
      }

      Box(
        modifier =
          Modifier.fillMaxSize()
            .background(Color(0xFF121212))
            .statusBarsPadding()
            .testTag("husen_hisab_main_container")
      ) {
        AndroidView(
          modifier = Modifier.fillMaxSize().testTag("hisab_webview"),
          factory = { context ->
            WebView(context).apply {
              setBackgroundColor(android.graphics.Color.parseColor("#121212"))

              settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                @Suppress("DEPRECATION")
                allowFileAccessFromFileURLs = true
                @Suppress("DEPRECATION")
                allowUniversalAccessFromFileURLs = true
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
                cacheMode = WebSettings.LOAD_DEFAULT
                useWideViewPort = true
                loadWithOverviewMode = true
              }

              webViewClient = object : WebViewClient() {
                override fun onReceivedError(
                  view: WebView?,
                  errorCode: Int,
                  description: String?,
                  failingUrl: String?
                ) {
                  super.onReceivedError(view, errorCode, description, failingUrl)
                }
              }

              webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(
                  webView: WebView?,
                  filePathCallback: ValueCallback<Array<Uri>>?,
                  fileChooserParams: FileChooserParams?
                ): Boolean {
                  this@MainActivity.filePathCallback?.onReceiveValue(null)
                  this@MainActivity.filePathCallback = filePathCallback

                  val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                    type = "*/*"
                    addCategory(Intent.CATEGORY_OPENABLE)
                  }

                  try {
                    fileChooserLauncher.launch(intent)
                  } catch (e: Exception) {
                    this@MainActivity.filePathCallback = null
                    Toast.makeText(context, "ફાઇલ ખોલવામાં ભૂલ થઈ.", Toast.LENGTH_SHORT).show()
                    return false
                  }
                  return true
                }
              }

              setDownloadListener { url, _, _, mimeType, _ ->
                try {
                  val intent = Intent(Intent.ACTION_VIEW).apply {
                    setDataAndType(Uri.parse(url), mimeType)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                  }
                  context.startActivity(intent)
                } catch (e: Exception) {
                  Toast.makeText(context, "ડાઉનલોડ શરૂ થયું...", Toast.LENGTH_SHORT).show()
                }
              }

              loadUrl("file:///android_asset/www/index.html")
              webViewInstance = this
            }
          },
          update = { view ->
            webViewInstance = view
          }
        )
      }
    }
  }
}
