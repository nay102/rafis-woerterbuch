param(
  [Parameter(Mandatory = $true)]
  [string]$InputFile,

  [string]$OutputFile = "",

  [switch]$NoQuotes,

  [switch]$AsArray
)

if (-not (Test-Path -LiteralPath $InputFile)) {
  Write-Error "Input file not found: $InputFile"
  exit 1
}

$raw = Get-Content -LiteralPath $InputFile -Raw

if ($AsArray) {
  $parts = [regex]::Split([string]$raw, "\r?\n\r?\n") |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ -ne "" }
  $jsonSafe = ConvertTo-Json -InputObject @($parts) -Compress
} else {
  $jsonSafe = ConvertTo-Json -InputObject ([string]$raw) -Compress
}

if ($NoQuotes) {
  if ($jsonSafe.Length -ge 2 -and $jsonSafe.StartsWith('"') -and $jsonSafe.EndsWith('"')) {
    $jsonSafe = $jsonSafe.Substring(1, $jsonSafe.Length - 2)
  }
}

if ([string]::IsNullOrWhiteSpace($OutputFile)) {
  Write-Output $jsonSafe
} else {
  Set-Content -LiteralPath $OutputFile -Value $jsonSafe -Encoding UTF8
  Write-Output "Saved JSON-safe text to: $OutputFile"
}
