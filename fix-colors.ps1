$ErrorActionPreference = "Stop"

$map = @{
  '150' = '100'
  '205' = '200'
  '250' = '200'
  '350' = '300'
  '405' = '400'
  '450' = '400'
  '550' = '500'
  '650' = '600'
  '750' = '700'
  '805' = '800'
  '850' = '800'
}

$colors = 'slate|emerald|rose|amber|blue|gray|zinc|neutral'

$files = Get-ChildItem -Path "frontend/src" -Recurse -Include *.jsx,*.js

foreach ($file in $files) {
  $content = Get-Content -Path $file.FullName -Raw
  $original = $content

  foreach ($num in $map.Keys) {
    $replacement = $map[$num]
    $pattern = "($colors)-$num(\b)"
    $content = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, "`$1-$replacement`$2")
  }

  if ($content -ne $original) {
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Updated: $($file.FullName)"
  }
}

Write-Host "Done."
