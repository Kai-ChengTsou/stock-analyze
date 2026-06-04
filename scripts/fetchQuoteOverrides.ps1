param(
  [Parameter(Mandatory = $true)]
  [string]$Tickers
)

$ProgressPreference = "SilentlyContinue"
[Console]::OutputEncoding = [Text.UTF8Encoding]::UTF8
$asOfDate = Get-Date -Format "yyyy-MM-dd"

function Get-Avg($Items) {
  if (-not $Items -or $Items.Count -eq 0) { return $null }
  $sum = 0
  foreach ($item in $Items) { $sum += [double]$item }
  return $sum / $Items.Count
}

function Get-Quote($Ticker) {
  $url = "https://query1.finance.yahoo.com/v8/finance/chart/$([uri]::EscapeDataString($Ticker))?range=3mo&interval=1d&includePrePost=true"
  try {
    $raw = (Invoke-WebRequest -UseBasicParsing -TimeoutSec 20 -Uri $url).Content
    $data = $raw | ConvertFrom-Json
    $result = $data.chart.result[0]
    $meta = $result.meta
    $quote = $result.indicators.quote[0]
    $closes = @($quote.close | Where-Object { $null -ne $_ })
    $highs = @($quote.high | Where-Object { $null -ne $_ })
    $lows = @($quote.low | Where-Object { $null -ne $_ })
    $volumes = @($quote.volume | Where-Object { $null -ne $_ })
    if (-not $meta -or $closes.Count -lt 20) {
      return @{ ticker = $Ticker; ok = $false; reason = "歷史價格不足" }
    }
    if ($null -ne $meta.regularMarketPrice) {
      $latest = [double]$meta.regularMarketPrice
    } else {
      $latest = [double]$closes[$closes.Count - 1]
    }
    if ($null -ne $meta.regularMarketPreviousClose) {
      $previousClose = [double]$meta.regularMarketPreviousClose
    } else {
      $previousClose = [double]$closes[$closes.Count - 2]
    }
    $recentHighItems = @($highs | Select-Object -Last 20)
    $recentLowItems = @($lows | Select-Object -Last 20)
    return @{
      ticker = $Ticker
      ok = $true
      asOfDate = $asOfDate
      latest = $latest
      close = [double]$closes[$closes.Count - 1]
      previousClose = $previousClose
      dayHigh = if ($meta.regularMarketDayHigh) { [double]$meta.regularMarketDayHigh } else { $null }
      dayLow = if ($meta.regularMarketDayLow) { [double]$meta.regularMarketDayLow } else { $null }
      volume = if ($meta.regularMarketVolume) { [double]$meta.regularMarketVolume } else { [double]$volumes[$volumes.Count - 1] }
      avgVolume20 = Get-Avg (@($volumes | Select-Object -Last 20))
      ma5 = Get-Avg (@($closes | Select-Object -Last 5))
      ma10 = Get-Avg (@($closes | Select-Object -Last 10))
      ma20 = Get-Avg (@($closes | Select-Object -Last 20))
      ma60 = Get-Avg (@($closes | Select-Object -Last 60))
      recentHigh = [double]($recentHighItems | Measure-Object -Maximum).Maximum
      recentLow = [double]($recentLowItems | Measure-Object -Minimum).Minimum
      fiftyTwoWeekHigh = if ($meta.fiftyTwoWeekHigh) { [double]$meta.fiftyTwoWeekHigh } else { $null }
      fiftyTwoWeekLow = if ($meta.fiftyTwoWeekLow) { [double]$meta.fiftyTwoWeekLow } else { $null }
      currency = [string]$meta.currency
    }
  } catch {
    return @{ ticker = $Ticker; ok = $false; reason = $_.Exception.Message }
  }
}

$quotes = @{}
foreach ($ticker in ($Tickers -split ',')) {
  $quotes[$ticker] = Get-Quote $ticker
  Start-Sleep -Milliseconds 80
}

$quotes | ConvertTo-Json -Depth 8 -Compress
