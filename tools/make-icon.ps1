param(
  [string]$Out = "C:\Users\aitor\Desktop\cacup\build\cacup.ico"
)

Add-Type -AssemblyName System.Drawing

$sizes = @(16, 24, 32, 48, 64, 128, 256)
$master = New-Object System.Drawing.Bitmap 256, 256
$g = [System.Drawing.Graphics]::FromImage($master)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::Transparent)

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$radius = 56
$diameter = $radius * 2
$path.AddArc(0, 0, $diameter, $diameter, 180, 90)
$path.AddArc(256 - $diameter, 0, $diameter, $diameter, 270, 90)
$path.AddArc(256 - $diameter, 256 - $diameter, $diameter, $diameter, 0, 90)
$path.AddArc(0, 256 - $diameter, $diameter, $diameter, 90, 90)
$path.CloseFigure()

$gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point 12, 10),
  (New-Object System.Drawing.Point 244, 246),
  ([System.Drawing.Color]::FromArgb(77, 245, 230)),
  ([System.Drawing.Color]::FromArgb(57, 189, 248))
)
$g.FillPath($gradient, $path)
$g.DrawPath((New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(120, 255, 255, 255)), 3), $path)

$triangle = @(
  (New-Object System.Drawing.PointF 102, 76),
  (New-Object System.Drawing.PointF 190, 128),
  (New-Object System.Drawing.PointF 102, 180)
)
$g.FillPolygon((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(6, 22, 20))), $triangle)
$g.Dispose()

$images = @()
foreach ($size in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $ctx = [System.Drawing.Graphics]::FromImage($bmp)
  $ctx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $ctx.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $ctx.Clear([System.Drawing.Color]::Transparent)
  $ctx.DrawImage($master, 0, 0, $size, $size)
  $ctx.Dispose()
  $stream = New-Object System.IO.MemoryStream
  $bmp.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  $images += ,$stream.ToArray()
  $stream.Dispose()
  $bmp.Dispose()
}
$master.Dispose()
$gradient.Dispose()

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $Out) | Out-Null
$file = [System.IO.File]::Create($Out)
$writer = New-Object System.IO.BinaryWriter $file
$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]$sizes.Count)
$offset = 6 + (16 * $sizes.Count)
for ($index = 0; $index -lt $sizes.Count; $index++) {
  $size = $sizes[$index]
  $bytes = $images[$index]
  $writer.Write([Byte]$(if ($size -ge 256) { 0 } else { $size }))
  $writer.Write([Byte]$(if ($size -ge 256) { 0 } else { $size }))
  $writer.Write([Byte]0)
  $writer.Write([Byte]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]32)
  $writer.Write([UInt32]$bytes.Length)
  $writer.Write([UInt32]$offset)
  $offset += $bytes.Length
}
foreach ($bytes in $images) { $writer.Write($bytes) }
$writer.Flush()
$writer.Dispose()
$file.Dispose()
Write-Output "icon -> $Out ($($sizes.Count) sizes)"
