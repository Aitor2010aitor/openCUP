param(
  [Parameter(Mandatory=$true)][string]$Image,
  [int]$CropX = 108,
  [int]$CropY = 90,
  [int]$CropW = 1080,
  [int]$CropH = 690,
  [int]$Scale = 2,
  [string]$Out = ""
)

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Globalization.Language, Windows.Foundation, ContentType = WindowsRuntime]

function Await($WinRtTask, $ResultType) {
  $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
  })[0]
  $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
  $netTask = $asTask.Invoke($null, @($WinRtTask))
  $netTask.Wait(-1) | Out-Null
  $netTask.Result
}

$src = [System.Drawing.Image]::FromFile($Image)
$cropW = [Math]::Min($CropW, $src.Width - $CropX)
$cropH = [Math]::Min($CropH, $src.Height - $CropY)
$rect = New-Object System.Drawing.Rectangle $CropX, $CropY, $cropW, $cropH
$scaled = New-Object System.Drawing.Bitmap ($cropW * $Scale), ($cropH * $Scale)
$g = [System.Drawing.Graphics]::FromImage($scaled)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, ($cropW * $Scale), ($cropH * $Scale)), $rect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$src.Dispose()

$tmp = [System.IO.Path]::Combine($env:TEMP, "capcut-ocr-" + [guid]::NewGuid().ToString("N") + ".png")
$scaled.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
$scaled.Dispose()

try {
  $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($tmp)) ([Windows.Storage.StorageFile])
  $stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
  $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $lang = New-Object Windows.Globalization.Language "es-ES"
  $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
  $result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])

  $lines = @()
  foreach ($line in $result.Lines) { $lines += $line.Text }
  $text = ($lines -join "`n")

  if ($Out -ne "") {
    $text | Out-File -FilePath $Out -Encoding utf8
    Write-Output "OCR $Image -> $Out ($($lines.Count) lines)"
  } else {
    Write-Output $text
  }
} finally {
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
}
