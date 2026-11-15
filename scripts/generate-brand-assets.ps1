#requires -Version 5.1
<#
  Membuat ulang seluruh aset brand Ngoffe ID tanpa dependensi online:
  - ikon launcher Android (legacy, round, dan foreground adaptive)
  - splash screen semua orientasi/densitas
  - favicon dan ikon PWA

  Jalankan dari root proyek:
    powershell -NoProfile -ExecutionPolicy Bypass -File scripts/generate-brand-assets.ps1
#>

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$res = Join-Path $root 'android\app\src\main\res'
$public = Join-Path $root 'public'

$gradientStart = [System.Drawing.Color]::FromArgb(255, 18, 74, 53)
$gradientEnd = [System.Drawing.Color]::FromArgb(255, 47, 122, 92)
$white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
$softWhite = [System.Drawing.Color]::FromArgb(235, 255, 255, 255)
$mutedWhite = [System.Drawing.Color]::FromArgb(190, 255, 255, 255)

function New-RoundedPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = [Math]::Max(0, $Radius * 2)
  if ($diameter -le 0) {
    $path.AddRectangle([System.Drawing.RectangleF]::new($X, $Y, $Width, $Height))
    return $path
  }

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-GradientBrush {
  param(
    [System.Drawing.RectangleF]$Rect,
    [float]$Angle = 45
  )

  return [System.Drawing.Drawing2D.LinearGradientBrush]::new($Rect, $gradientStart, $gradientEnd, $Angle)
}

<#
  Cangkir kopi putih dengan tatakan dan uap. Semua koordinat memakai
  kotak normal 0..1 agar bisa diskalakan ke ukuran ikon berapa pun.
#>
function Draw-Cup {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$Left,
    [float]$Top,
    [float]$Size,
    [System.Drawing.Color]$Color = $white
  )

  $s = $Size
  $x = $Left
  $y = $Top
  $brush = [System.Drawing.SolidBrush]::new($Color)
  $stroke = [Math]::Max(1.2, $s * 0.035)
  $pen = [System.Drawing.Pen]::new($Color, $stroke)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

  # Uap: dua garis melengkung di atas cangkir.
  $steamPen = [System.Drawing.Pen]::new($Color, [Math]::Max(1.0, $s * 0.030))
  $steamPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $steamPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $steam1 = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $steam1.AddBezier(
    $x + 0.31 * $s, $y + 0.30 * $s,
    $x + 0.24 * $s, $y + 0.23 * $s,
    $x + 0.38 * $s, $y + 0.20 * $s,
    $x + 0.31 * $s, $y + 0.12 * $s
  )
  $steam2 = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $steam2.AddBezier(
    $x + 0.47 * $s, $y + 0.30 * $s,
    $x + 0.40 * $s, $y + 0.22 * $s,
    $x + 0.54 * $s, $y + 0.19 * $s,
    $x + 0.47 * $s, $y + 0.10 * $s
  )
  $Graphics.DrawPath($steamPen, $steam1)
  $Graphics.DrawPath($steamPen, $steam2)

  # Gagang: cincin putih di kanan badan cangkir.
  $handlePen = [System.Drawing.Pen]::new($Color, [Math]::Max(1.2, $s * 0.052))
  $handlePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $handlePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $handleRect = [System.Drawing.RectangleF]::new(
    $x + 0.57 * $s,
    $y + 0.41 * $s,
    0.21 * $s,
    0.20 * $s
  )
  $Graphics.DrawEllipse($handlePen, $handleRect)

  # Badan cangkir: rounded rectangle, sedikit lebih lebar di atas.
  $bodyPath = New-RoundedPath ($x + 0.19 * $s) ($y + 0.35 * $s) (0.46 * $s) (0.35 * $s) (0.10 * $s)
  $Graphics.FillPath($brush, $bodyPath)

  # Tatakan: elips putih di bawah badan.
  $saucerRect = [System.Drawing.RectangleF]::new(
    $x + 0.13 * $s,
    $y + 0.67 * $s,
    0.58 * $s,
    0.11 * $s
  )
  $Graphics.FillEllipse($brush, $saucerRect)

  # Aksen kecil di badan cangkir agar terasa seperti logo, bukan siluet kosong.
  $accentBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(60, 18, 74, 53))
  $Graphics.FillEllipse(
    $accentBrush,
    [System.Drawing.RectangleF]::new($x + 0.28 * $s, $y + 0.43 * $s, 0.11 * $s, 0.11 * $s)
  )

  $accentBrush.Dispose()
  $bodyPath.Dispose()
  $saucerRect = $null
  $handlePen.Dispose()
  $steam1.Dispose()
  $steam2.Dispose()
  $steamPen.Dispose()
  $pen.Dispose()
  $brush.Dispose()
}

function New-IconBitmap {
  param(
    [int]$Size,
    [ValidateSet('rounded', 'round', 'square', 'foreground')]
    [string]$Shape
  )

  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $rect = [System.Drawing.RectangleF]::new(0, 0, $Size, $Size)

  if ($Shape -eq 'round') {
    $clip = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $clip.AddEllipse($rect)
    $graphics.SetClip($clip)
  } elseif ($Shape -eq 'rounded') {
    $clip = New-RoundedPath 0 0 $Size $Size ($Size * 0.22)
    $graphics.SetClip($clip)
  }

  if ($Shape -ne 'foreground') {
    $background = New-GradientBrush $rect 45
    $graphics.FillRectangle($background, $rect)
    $background.Dispose()
  }

  $cupSize = if ($Shape -eq 'foreground') { $Size * 0.80 } else { $Size * 0.62 }
  $cupLeft = ($Size - $cupSize) / 2
  $cupTop = ($Size - $cupSize) / 2 + ($Size * 0.01)
  Draw-Cup -Graphics $graphics -Left $cupLeft -Top $cupTop -Size $cupSize

  if ($Shape -eq 'round' -or $Shape -eq 'rounded') {
    $graphics.ResetClip()
    $clip.Dispose()
  }

  $graphics.Dispose()
  return $bitmap
}

function New-SplashBitmap {
  param(
    [int]$Width,
    [int]$Height
  )

  $bitmap = [System.Drawing.Bitmap]::new($Width, $Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $rect = [System.Drawing.RectangleF]::new(0, 0, $Width, $Height)
  $background = New-GradientBrush $rect 90
  $graphics.FillRectangle($background, $rect)
  $background.Dispose()

  $base = [Math]::Min($Width, $Height)
  $cupSize = $base * 0.34
  $cupLeft = ($Width - $cupSize) / 2
  $cupTop = ($Height * 0.50) - ($cupSize * 0.62)
  Draw-Cup -Graphics $graphics -Left $cupLeft -Top $cupTop -Size $cupSize -Color $white

  $titleFontSize = [Math]::Max(20, $base * 0.085)
  $titleFont = [System.Drawing.Font]::new('Georgia', $titleFontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $taglineFontSize = [Math]::Max(11, $titleFontSize * 0.32)
  $taglineFont = [System.Drawing.Font]::new('Segoe UI', $taglineFontSize, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $titleBrush = [System.Drawing.SolidBrush]::new($white)
  $taglineBrush = [System.Drawing.SolidBrush]::new($mutedWhite)
  $center = [System.Drawing.StringFormat]::new()
  $center.Alignment = [System.Drawing.StringAlignment]::Center
  $center.LineAlignment = [System.Drawing.StringAlignment]::Center

  $titleRect = [System.Drawing.RectangleF]::new(0, $Height * 0.63, $Width, $titleFontSize * 1.4)
  $graphics.DrawString('Ngoffe ID', $titleFont, $titleBrush, $titleRect, $center)

  $taglineRect = [System.Drawing.RectangleF]::new(0, $Height * 0.63 + $titleFontSize * 1.25, $Width, $taglineFontSize * 2)
  $graphics.DrawString('CAF' + [char]0x00C9 + ' & HOTEL', $taglineFont, $taglineBrush, $taglineRect, $center)

  $center.Dispose()
  $taglineBrush.Dispose()
  $titleBrush.Dispose()
  $taglineFont.Dispose()
  $titleFont.Dispose()
  $graphics.Dispose()
  return $bitmap
}

function Save-Png {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [string]$Path
  )

  $directory = Split-Path -Parent $Path
  if (-not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }
  $Bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

$launcherDensities = @(
  @{ Folder = 'mipmap-mdpi'; Size = 48 },
  @{ Folder = 'mipmap-hdpi'; Size = 72 },
  @{ Folder = 'mipmap-xhdpi'; Size = 96 },
  @{ Folder = 'mipmap-xxhdpi'; Size = 144 },
  @{ Folder = 'mipmap-xxxhdpi'; Size = 192 }
)

foreach ($density in $launcherDensities) {
  $folder = Join-Path $res $density.Folder
  $size = $density.Size

  $icon = New-IconBitmap -Size $size -Shape rounded
  Save-Png -Bitmap $icon -Path (Join-Path $folder 'ic_launcher.png')
  $icon.Dispose()

  $round = New-IconBitmap -Size $size -Shape round
  Save-Png -Bitmap $round -Path (Join-Path $folder 'ic_launcher_round.png')
  $round.Dispose()

  $foregroundSize = [int]($size * 2.25)
  $foreground = New-IconBitmap -Size $foregroundSize -Shape foreground
  Save-Png -Bitmap $foreground -Path (Join-Path $folder 'ic_launcher_foreground.png')
  $foreground.Dispose()
}

$splashScreens = @(
  @{ Folder = 'drawable'; Width = 480; Height = 320 },
  @{ Folder = 'drawable-land-mdpi'; Width = 480; Height = 320 },
  @{ Folder = 'drawable-land-hdpi'; Width = 800; Height = 480 },
  @{ Folder = 'drawable-land-xhdpi'; Width = 1280; Height = 720 },
  @{ Folder = 'drawable-land-xxhdpi'; Width = 1600; Height = 960 },
  @{ Folder = 'drawable-land-xxxhdpi'; Width = 1920; Height = 1280 },
  @{ Folder = 'drawable-port-mdpi'; Width = 320; Height = 480 },
  @{ Folder = 'drawable-port-hdpi'; Width = 480; Height = 800 },
  @{ Folder = 'drawable-port-xhdpi'; Width = 720; Height = 1280 },
  @{ Folder = 'drawable-port-xxhdpi'; Width = 960; Height = 1600 },
  @{ Folder = 'drawable-port-xxxhdpi'; Width = 1280; Height = 1920 }
)

foreach ($screen in $splashScreens) {
  $splash = New-SplashBitmap -Width $screen.Width -Height $screen.Height
  Save-Png -Bitmap $splash -Path (Join-Path (Join-Path $res $screen.Folder) 'splash.png')
  $splash.Dispose()
}

$webIcons = @(
  @{ Name = 'favicon.png'; Size = 64; Shape = 'rounded' },
  @{ Name = 'icon-192.png'; Size = 192; Shape = 'square' },
  @{ Name = 'icon-512.png'; Size = 512; Shape = 'square' },
  @{ Name = 'apple-touch-icon.png'; Size = 180; Shape = 'square' }
)

foreach ($webIcon in $webIcons) {
  $icon = New-IconBitmap -Size $webIcon.Size -Shape $webIcon.Shape
  Save-Png -Bitmap $icon -Path (Join-Path $public $webIcon.Name)
  $icon.Dispose()
}

Write-Host 'Aset brand Ngoffe ID berhasil dibuat:'
Write-Host "  - ikon launcher: 5 densitas (legacy, round, foreground)"
Write-Host "  - splash: $($splashScreens.Count) orientasi/densitas"
Write-Host "  - ikon web: favicon 64, PWA 192/512, apple-touch 180"
