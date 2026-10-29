# Manual fallback installer for the DSH desktop profile.
#
# Preferred: install this folder as a bundle through the DSH Plugin Manager or
# `dsh plugin --profile desktop add file:<repo>`. Use this script only when a
# manual file-copy install is required.
#
#   pwsh -File .\install.ps1
#   pwsh -File .\install.ps1 -NoEnable
#
# It copies the plugin into the profile's node_modules, records a file:
# dependency, and appends one loader insert row. Every modified file is backed
# up first. Do not combine it with a bundle install of the same package.

param(
  [string]$Profile = $(if ($env:DSH_PROFILE_DIR) { $env:DSH_PROFILE_DIR } else { Join-Path (Join-Path $env:USERPROFILE '.dsh') 'profiles\desktop' }),
  [switch]$NoEnable
)

$ErrorActionPreference = 'Stop'

$pkg = 'dsh-marketboard'
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not (Test-Path (Join-Path $repoRoot 'package.json'))) { throw "plugin source not found: $repoRoot" }
if (-not (Test-Path $Profile)) { throw "profile not found: $Profile" }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$target = Join-Path (Join-Path $Profile 'node_modules') $pkg

Write-Host "[1/4] copying plugin to $target"
if (Test-Path $target) {
  $item = Get-Item $target -Force
  if ($item.LinkType) {
    # A prior bundle install links the checkout. Remove only the link, never
    # recurse through it into the source repository.
    [System.IO.Directory]::Delete($target)
  } else {
    Remove-Item -Recurse -Force $target
  }
}
New-Item -ItemType Directory -Path $target -Force | Out-Null
foreach ($entry in @('package.json', 'cordis.patch.yml', 'icon.svg', 'README.md', 'README.zh.md', 'LICENSE', 'lib', 'locale')) {
  Copy-Item -Recurse -Force (Join-Path $repoRoot $entry) (Join-Path $target $entry)
}

Write-Host "[2/4] registering dependency in profile package.json"
$pkgPath = Join-Path $Profile 'package.json'
Copy-Item $pkgPath "$pkgPath.bak-$stamp" -Force
$manifest = Get-Content $pkgPath -Raw | ConvertFrom-Json
if ($null -eq $manifest.dependencies) {
  $manifest | Add-Member -MemberType NoteProperty -Name dependencies -Value ([pscustomobject]@{}) -Force
}
$fileSpec = 'file:' + ($repoRoot -replace '\\', '/')
$existing = $manifest.dependencies.PSObject.Properties[$pkg]
if ($null -eq $existing) {
  $manifest.dependencies | Add-Member -MemberType NoteProperty -Name $pkg -Value $fileSpec -Force
} else {
  $existing.Value = $fileSpec
}
$manifest | ConvertTo-Json -Depth 40 | Set-Content -Path $pkgPath -Encoding utf8

if ($NoEnable) {
  Write-Host "[3/4] -NoEnable set; skipping cordis.patch.yml edit"
  Write-Host "[4/4] done (not enabled)"
  return
}

Write-Host "[3/4] enabling plugin row in cordis.patch.yml"
$patchPath = Join-Path $Profile 'cordis.patch.yml'
Copy-Item $patchPath "$patchPath.bak-$stamp" -Force
$patch = Get-Content $patchPath -Raw
if ($patch -match "(?m)^\s*name:\s*['""]?$([regex]::Escape($pkg))['""]?\s*$") {
  Write-Host "      $pkg row already present; leaving as is"
} else {
  $block = @"

# --- $pkg plugin (added by install.ps1) ---
- insert:
    - id: $pkg
      name: $pkg
"@
  Add-Content -Path $patchPath -Value $block -Encoding utf8
  Write-Host "      row appended"
}

Write-Host "[4/4] done"
Write-Host "Refresh the DSH Web GUI (Ctrl+R) to load the browser half."
