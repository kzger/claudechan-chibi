<#
.SYNOPSIS
  安裝 / 更新 / 移除 Claude 娘終端機陪伴 mod（chibi-companion）。

.DESCRIPTION
  1. 把本資料夾的 marketplace 與 plugin 複製到 ~/.claude/local-marketplaces/chibi-companion
  2. 以本機資料夾註冊 marketplace「chibi-local」
  3. 安裝 chibi-companion@chibi-local（預設 user scope：所有專案都會出現）
  已安裝時再執行一次即為更新；加 -Uninstall 為移除。
  Windows PowerShell 5.1 與 PowerShell 7 皆可執行。

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\install.ps1
  powershell -ExecutionPolicy Bypass -File .\install.ps1 -Uninstall
#>
param(
  [switch]$Uninstall,
  [ValidateSet('user', 'project', 'local')]
  [string]$Scope = 'user'
)

$ErrorActionPreference = 'Stop'
$PluginName = 'chibi-companion'
$Market = 'chibi-local'
$Src = $PSScriptRoot
$Dest = Join-Path $HOME ".claude\local-marketplaces\$PluginName"

function Invoke-Claude {
  param([string[]]$Arguments, [switch]$AllowFail)
  Write-Host "  > claude $($Arguments -join ' ')" -ForegroundColor DarkGray
  & claude @Arguments
  if ($LASTEXITCODE -ne 0 -and -not $AllowFail) {
    throw "claude $($Arguments -join ' ') 失敗（exit $LASTEXITCODE）"
  }
}

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
  throw '找不到 claude 指令。請先安裝 Claude Code：https://docs.claude.com/claude-code'
}

if ($Uninstall) {
  Write-Host "移除 $PluginName ..." -ForegroundColor Cyan
  Invoke-Claude -Arguments @('plugin', 'uninstall', "$PluginName@$Market", '-s', $Scope) -AllowFail
  Invoke-Claude -Arguments @('plugin', 'marketplace', 'remove', $Market) -AllowFail
  if (Test-Path $Dest) { Remove-Item $Dest -Recurse -Force }
  Write-Host '完成。重新啟動 Claude Code 後生效。' -ForegroundColor Green
  exit 0
}

foreach ($need in @('.claude-plugin\marketplace.json', 'plugin\.claude-plugin\plugin.json', 'plugin\hooks\register.tsx', 'plugin\hooks\frames-smooth.ts')) {
  if (-not (Test-Path (Join-Path $Src $need))) { throw "安裝包不完整：缺少 $need" }
}

Write-Host "複製檔案到 $Dest" -ForegroundColor Cyan
if (Test-Path $Dest) { Remove-Item $Dest -Recurse -Force }
New-Item -ItemType Directory -Force -Path $Dest | Out-Null
Copy-Item (Join-Path $Src '.claude-plugin') -Destination $Dest -Recurse
Copy-Item (Join-Path $Src 'plugin') -Destination $Dest -Recurse
foreach ($f in @('README.md', 'ATTRIBUTION.txt')) {
  if (Test-Path (Join-Path $Src $f)) { Copy-Item (Join-Path $Src $f) -Destination $Dest }
}
# 引擎在開發時寫入的型別檔不需要帶走
$generated = Join-Path $Dest 'plugin\.claude-plugin\types'
if (Test-Path $generated) { Remove-Item $generated -Recurse -Force }

Write-Host '註冊本機 marketplace' -ForegroundColor Cyan
$known = (& claude plugin marketplace list 2>$null | Out-String)
if ($known -match [regex]::Escape($Market)) {
  Invoke-Claude -Arguments @('plugin', 'marketplace', 'update', $Market) -AllowFail
} else {
  Invoke-Claude -Arguments @('plugin', 'marketplace', 'add', $Dest)
}

Write-Host "安裝 $PluginName@$Market（scope: $Scope）" -ForegroundColor Cyan
$installed = (& claude plugin list 2>$null | Out-String)
if ($installed -match [regex]::Escape("$PluginName@$Market")) {
  Write-Host '  已安裝：檔案已更新，在 Claude Code 內執行 /reload-plugins 或重新啟動即可。' -ForegroundColor Yellow
} else {
  Invoke-Claude -Arguments @('plugin', 'install', "$PluginName@$Market", '-s', $Scope)
}

Write-Host ''
Write-Host '完成！啟動 claude 後：' -ForegroundColor Green
Write-Host '  /chibi            查看目前設定'
Write-Host '  /chibi auto       寬螢幕側面板、窄螢幕上方列（預設）'
Write-Host '  /chibi set classic | smooth   切換圖庫'
