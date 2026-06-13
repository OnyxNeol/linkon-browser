# ============================================================
# Linkon Browser — Windows Build Script
# Produces: LinkonSetup.exe (NSIS installer)
# Base: Firefox ESR portable repack + Linkon extension
# ============================================================

param(
    [string]$Version = "1.0.0",
    [string]$OutDir  = ".\dist\windows"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "=== Linkon Browser Build — Windows ===" -ForegroundColor Cyan
Write-Host "Version: $Version"

# ── Prerequisites check ──────────────────────────────────────
function Require($cmd, $name, $installHint) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "$name not found. $installHint"
        exit 1
    }
    Write-Host "  ✓ $name found" -ForegroundColor Green
}

Write-Host "`n[1/8] Checking prerequisites…"
Require "git"    "Git"     "Install from https://git-scm.com"
Require "python" "Python"  "Install from https://python.org"
# NSIS (Nullsoft Installer) for packaging
Require "makensis" "NSIS"  "Install from https://nsis.sourceforge.io"

# ── Setup directories ────────────────────────────────────────
Write-Host "`n[2/8] Setting up build directories…"
$BuildDir  = ".\build\win-temp"
$FirefoxDir = "$BuildDir\firefox"
$LinkonDir  = "$BuildDir\linkon"
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
New-Item -ItemType Directory -Force -Path $BuildDir | Out-Null
New-Item -ItemType Directory -Force -Path $LinkonDir | Out-Null

# ── Download Firefox ESR ─────────────────────────────────────
Write-Host "`n[3/8] Downloading Firefox ESR…"
$FirefoxUrl = "https://download.mozilla.org/?product=firefox-esr-latest&os=win64&lang=en-US"
$FirefoxInstaller = "$BuildDir\firefox-esr-setup.exe"
if (-not (Test-Path $FirefoxInstaller)) {
    Invoke-WebRequest -Uri $FirefoxUrl -OutFile $FirefoxInstaller -UseBasicParsing
    Write-Host "  ✓ Firefox ESR downloaded" -ForegroundColor Green
} else {
    Write-Host "  ✓ Firefox ESR already downloaded (cached)" -ForegroundColor Yellow
}

# Extract Firefox (silent install to temp dir)
Write-Host "  Extracting Firefox ESR…"
Start-Process -FilePath $FirefoxInstaller `
    -ArgumentList "/S /D=$((Resolve-Path .).Path)\$FirefoxDir" `
    -Wait -NoNewWindow
Write-Host "  ✓ Firefox ESR extracted" -ForegroundColor Green

# ── Inject Linkon configs ────────────────────────────────────
Write-Host "`n[4/8] Injecting Linkon browser configuration…"

# policies.json — disables Google, sets Linkon search
$DistributionDir = "$FirefoxDir\distribution"
New-Item -ItemType Directory -Force -Path $DistributionDir | Out-Null
Copy-Item "..\..\browser-config\policies.json" "$DistributionDir\policies.json"

# autoconfig (sets Linkon as homepage, disables telemetry)
Copy-Item "..\..\browser-config\autoconfig.js" "$FirefoxDir\defaults\pref\autoconfig.js"
Copy-Item "..\..\browser-config\linkon.cfg"    "$FirefoxDir\linkon.cfg"

Write-Host "  ✓ Browser config injected" -ForegroundColor Green

# ── Package Linkon extension ─────────────────────────────────
Write-Host "`n[5/8] Packaging Linkon extension (.xpi)…"
$ExtSrc  = "..\..\extension"
$XpiPath = "$LinkonDir\linkon-core.xpi"

# XPI is just a renamed ZIP
Compress-Archive -Path "$ExtSrc\*" -DestinationPath "$LinkonDir\linkon-core.zip" -Force
Rename-Item "$LinkonDir\linkon-core.zip" "linkon-core.xpi" -Force

# Place in Firefox extensions dir (auto-install on launch)
$ExtDir = "$FirefoxDir\browser\extensions"
New-Item -ItemType Directory -Force -Path $ExtDir | Out-Null
Copy-Item $XpiPath "$ExtDir\linkon-core@linkon.browser.xpi"
Write-Host "  ✓ Extension packaged + installed" -ForegroundColor Green

# ── Inject Linkon skin (userChrome) ─────────────────────────
Write-Host "`n[6/8] Injecting cosmic skin…"
$DefaultProfile = "$FirefoxDir\browser\defaults\profile\chrome"
New-Item -ItemType Directory -Force -Path $DefaultProfile | Out-Null
Copy-Item "..\..\skin\chrome\userChrome.css"   "$DefaultProfile\userChrome.css"
Copy-Item "..\..\skin\chrome\userContent.css"  "$DefaultProfile\userContent.css"

# user.js — enable userChrome
@"
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
user_pref("browser.tabs.drawInTitlebar", true);
user_pref("browser.search.defaultenginename", "Linkon Search");
user_pref("browser.startup.homepage", "about:newtab");
user_pref("datareporting.healthreport.uploadEnabled", false);
user_pref("toolkit.telemetry.enabled", false);
user_pref("app.shield.optoutstudies.enabled", false);
user_pref("browser.newtabpage.activity-stream.feeds.section.highlights", false);
user_pref("browser.newtabpage.activity-stream.showSponsored", false);
user_pref("browser.safebrowsing.malware.enabled", true);
user_pref("extensions.autoDisableScopes", 0);
user_pref("extensions.enabledScopes", 15);
"@ | Set-Content "$DefaultProfile\..\user.js"

Write-Host "  ✓ Cosmic skin applied" -ForegroundColor Green

# ── Rename executable ────────────────────────────────────────
Write-Host "`n[7/8] Branding the executable…"
if (Test-Path "$FirefoxDir\firefox.exe") {
    Copy-Item "$FirefoxDir\firefox.exe" "$FirefoxDir\Linkon.exe"
    Write-Host "  ✓ Renamed to Linkon.exe" -ForegroundColor Green
}

# ── NSIS installer ───────────────────────────────────────────
Write-Host "`n[8/8] Building NSIS installer…"

$NsisScript = @"
!define PRODUCT_NAME "Linkon Browser"
!define PRODUCT_VERSION "$Version"
!define PRODUCT_PUBLISHER "TeraBites"
!define PRODUCT_WEB_SITE "https://linkon.browser"
!define PRODUCT_DIR_REGKEY "Software\Microsoft\Windows\CurrentVersion\App Paths\Linkon.exe"
!define PRODUCT_UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\`${PRODUCT_NAME}"

SetCompressor /SOLID lzma
Name "`${PRODUCT_NAME} `${PRODUCT_VERSION}"
OutFile "$OutDir\LinkonSetup-$Version.exe"
InstallDir "`$PROGRAMFILES64\Linkon Browser"
InstallDirRegKey HKLM "`${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show

; Modern UI
!include "MUI2.nsh"
!define MUI_ABORTWARNING
!define MUI_ICON "..\..\assets\linkon.ico"
!define MUI_UNICON "..\..\assets\linkon.ico"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "..\..\assets\installer-header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "..\..\assets\installer-welcome.bmp"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\..\LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Section "Linkon Browser (required)" SEC01
  SetOutPath "`$INSTDIR"
  File /r "$FirefoxDir\*.*"
  CreateDirectory "`$SMPROGRAMS\Linkon Browser"
  CreateShortCut  "`$SMPROGRAMS\Linkon Browser\Linkon Browser.lnk" "`$INSTDIR\Linkon.exe"
  CreateShortCut  "`$DESKTOP\Linkon Browser.lnk" "`$INSTDIR\Linkon.exe"
  WriteRegStr HKLM "`${PRODUCT_DIR_REGKEY}" "" "`$INSTDIR\Linkon.exe"
  WriteRegStr HKLM "`${PRODUCT_UNINST_KEY}" "DisplayName"    "`$(^Name)"
  WriteRegStr HKLM "`${PRODUCT_UNINST_KEY}" "UninstallString" "`$INSTDIR\uninstall.exe"
  WriteRegStr HKLM "`${PRODUCT_UNINST_KEY}" "DisplayVersion"  "`${PRODUCT_VERSION}"
  WriteRegStr HKLM "`${PRODUCT_UNINST_KEY}" "Publisher"       "`${PRODUCT_PUBLISHER}"
  WriteRegStr HKLM "`${PRODUCT_UNINST_KEY}" "URLInfoAbout"    "`${PRODUCT_WEB_SITE}"
  WriteUninstaller "`$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "`$INSTDIR\uninstall.exe"
  RMDir /r "`$INSTDIR"
  Delete "`$SMPROGRAMS\Linkon Browser\Linkon Browser.lnk"
  RMDir  "`$SMPROGRAMS\Linkon Browser"
  Delete "`$DESKTOP\Linkon Browser.lnk"
  DeleteRegKey HKLM "`${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "`${PRODUCT_DIR_REGKEY}"
SectionEnd
"@

$NsisScript | Set-Content "$BuildDir\linkon-installer.nsi"
makensis "$BuildDir\linkon-installer.nsi"

Write-Host "`n✅ BUILD COMPLETE!" -ForegroundColor Green
Write-Host "   Installer: $OutDir\LinkonSetup-$Version.exe" -ForegroundColor Cyan
Write-Host "`nWhat was built:"
Write-Host "  - Firefox ESR as browser core (Gecko rendering)"
Write-Host "  - Linkon extension (.xpi) with all 5 pillars"
Write-Host "  - Stract search engine (default, no Google)"
Write-Host "  - Cosmic userChrome skin"
Write-Host "  - TeraBites auth + Linkon Universe new tab"
Write-Host "  - OpenHands agent backend ready"
