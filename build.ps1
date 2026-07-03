# Concatenate src parts into the single playable index.html
$root = $PSScriptRoot
$parts = @('head.html','00_core.js','01_audio.js','02_materials.js','03_characters.js','03b_body.js','04_enemies.js',
           '05_props.js','06_zones.js','07_dialogue.js','08_ui.js','09_player.js','10_game.js','11_touch.js','tail.html')
$out = foreach($p in $parts){ Get-Content -Raw -Encoding UTF8 (Join-Path $root "src\$p") }
Set-Content -Path (Join-Path $root 'index.html') -Value ($out -join "`n") -Encoding UTF8 -NoNewline
Write-Host "Built index.html ($((Get-Item (Join-Path $root 'index.html')).Length) bytes)"
