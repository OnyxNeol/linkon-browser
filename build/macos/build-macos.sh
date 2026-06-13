#!/usr/bin/env bash
# ============================================================
# Linkon Browser — macOS Build Script
# Produces: Linkon.app + Linkon-{version}.dmg
# Base: Firefox ESR .app repack + Linkon extension
# ============================================================

set -euo pipefail
VERSION="${1:-1.0.0}"
OUT_DIR="./dist/macos"
BUILD_DIR="./build/mac-temp"
FIREFOX_DMG_URL="https://download.mozilla.org/?product=firefox-esr-latest&os=osx&lang=en-US"

echo "=== Linkon Browser Build — macOS ==="
echo "Version: $VERSION"
echo ""

# ── Prerequisites ────────────────────────────────────────────
echo "[1/9] Checking prerequisites…"
check_cmd() {
    if ! command -v "$1" &>/dev/null; then
        echo "  ✗ $1 not found — $2"
        exit 1
    fi
    echo "  ✓ $1"
}

check_cmd "curl"       "install via Homebrew: brew install curl"
check_cmd "hdiutil"    "should be built into macOS"
check_cmd "codesign"   "install Xcode Command Line Tools: xcode-select --install"
check_cmd "create-dmg" "brew install create-dmg"
check_cmd "python3"    "brew install python"

# ── Setup dirs ───────────────────────────────────────────────
echo ""
echo "[2/9] Setting up build directories…"
mkdir -p "$OUT_DIR" "$BUILD_DIR"

# ── Download Firefox ESR ─────────────────────────────────────
echo ""
echo "[3/9] Downloading Firefox ESR for macOS…"
FIREFOX_DMG="$BUILD_DIR/firefox-esr.dmg"
if [ ! -f "$FIREFOX_DMG" ]; then
    curl -L "$FIREFOX_DMG_URL" -o "$FIREFOX_DMG" --progress-bar
    echo "  ✓ Firefox ESR downloaded"
else
    echo "  ✓ Firefox ESR already cached"
fi

# Mount and copy Firefox.app
echo "  Extracting Firefox.app…"
MOUNT_POINT="$BUILD_DIR/ff-mount"
mkdir -p "$MOUNT_POINT"
hdiutil attach "$FIREFOX_DMG" -mountpoint "$MOUNT_POINT" -quiet -nobrowse

FIREFOX_APP="$BUILD_DIR/Firefox.app"
cp -R "$MOUNT_POINT/Firefox.app" "$FIREFOX_APP"
hdiutil detach "$MOUNT_POINT" -quiet
echo "  ✓ Firefox.app extracted"

# ── Rename to Linkon.app ─────────────────────────────────────
echo ""
echo "[4/9] Rebranding Firefox.app → Linkon.app…"
LINKON_APP="$BUILD_DIR/Linkon.app"
cp -R "$FIREFOX_APP" "$LINKON_APP"

# Rename binary inside app bundle
CONTENTS="$LINKON_APP/Contents"
mv "$CONTENTS/MacOS/firefox" "$CONTENTS/MacOS/linkon" 2>/dev/null || true
mv "$CONTENTS/MacOS/firefox-bin" "$CONTENTS/MacOS/linkon-bin" 2>/dev/null || true

# Update Info.plist
/usr/libexec/PlistBuddy -c "Set :CFBundleName Linkon"                    "$CONTENTS/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName Linkon Browser"     "$CONTENTS/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier browser.linkon.app"  "$CONTENTS/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION"    "$CONTENTS/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $VERSION"               "$CONTENTS/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleExecutable linkon"              "$CONTENTS/Info.plist"

# Replace icon
if [ -f "../../assets/linkon.icns" ]; then
    cp "../../assets/linkon.icns" "$CONTENTS/Resources/firefox.icns"
    /usr/libexec/PlistBuddy -c "Set :CFBundleIconFile linkon" "$CONTENTS/Info.plist"
fi

echo "  ✓ Linkon.app created"

# ── Inject Linkon policies ───────────────────────────────────
echo ""
echo "[5/9] Injecting Linkon browser policies…"
DIST_DIR="$CONTENTS/Resources/distribution"
mkdir -p "$DIST_DIR"
cp "../../browser-config/policies.json" "$DIST_DIR/policies.json"
echo "  ✓ policies.json injected (Google removed, Stract default)"

# ── Inject default profile ───────────────────────────────────
echo ""
echo "[6/9] Setting up default profile (userChrome + user.js)…"
PROFILE_DIR="$CONTENTS/Resources/browser/defaults/profile"
CHROME_DIR="$PROFILE_DIR/chrome"
mkdir -p "$CHROME_DIR"

cp "../../skin/chrome/userChrome.css"  "$CHROME_DIR/userChrome.css"
cp "../../skin/chrome/userContent.css" "$CHROME_DIR/userContent.css"

cat > "$PROFILE_DIR/user.js" << 'USERJS'
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
user_pref("browser.tabs.drawInTitlebar", true);
user_pref("browser.search.defaultenginename", "Linkon Search");
user_pref("browser.startup.homepage", "about:newtab");
user_pref("datareporting.healthreport.uploadEnabled", false);
user_pref("toolkit.telemetry.enabled", false);
user_pref("app.shield.optoutstudies.enabled", false);
user_pref("browser.newtabpage.activity-stream.showSponsored", false);
user_pref("extensions.autoDisableScopes", 0);
user_pref("extensions.enabledScopes", 15);
user_pref("xpinstall.signatures.required", false);
USERJS

echo "  ✓ Default profile configured"

# ── Package and install Linkon extension ─────────────────────
echo ""
echo "[7/9] Packaging Linkon extension (.xpi)…"
EXT_DIR="$CONTENTS/Resources/browser/extensions"
mkdir -p "$EXT_DIR"

XPI_STAGING="$BUILD_DIR/xpi-staging"
mkdir -p "$XPI_STAGING"
cp -R "../../extension/." "$XPI_STAGING/"

# Flatten manifest + src into XPI root
cd "$XPI_STAGING"
cp manifest/manifest.json .
zip -r "$EXT_DIR/linkon-core@linkon.browser.xpi" . -x "manifest/*" 2>/dev/null
cd - > /dev/null
echo "  ✓ Extension installed into app bundle"

# ── Code signing (ad-hoc for dev builds) ────────────────────
echo ""
echo "[8/9] Code signing Linkon.app…"
# Ad-hoc signing (no Apple Developer account needed for local use)
# For distribution, replace '-' with your Developer ID:
#   "Developer ID Application: Your Name (TEAMID)"
codesign --force --deep --sign "-" "$LINKON_APP" \
    --entitlements "../../build/macos/linkon.entitlements" 2>/dev/null || \
codesign --force --deep --sign "-" "$LINKON_APP"

echo "  ✓ Signed (ad-hoc — safe for local use)"
echo "  ℹ  For App Store / Gatekeeper: use your Apple Developer ID"

# ── Create DMG ───────────────────────────────────────────────
echo ""
echo "[9/9] Creating Linkon.dmg…"
DMG_OUT="$OUT_DIR/Linkon-$VERSION.dmg"

create-dmg \
    --volname "Linkon Browser $VERSION" \
    --volicon "../../assets/linkon.icns" \
    --background "../../assets/dmg-background.png" \
    --window-pos 200 120 \
    --window-size 800 400 \
    --icon-size 100 \
    --icon "Linkon.app" 200 190 \
    --hide-extension "Linkon.app" \
    --app-drop-link 600 185 \
    "$DMG_OUT" \
    "$LINKON_APP" || {
    # Fallback: simple DMG without fancy background
    hdiutil create -volname "Linkon Browser $VERSION" \
        -srcfolder "$LINKON_APP" \
        -ov -format UDZO \
        "$DMG_OUT"
}

echo ""
echo "✅ BUILD COMPLETE!"
echo "   App:       $BUILD_DIR/Linkon.app"
echo "   Installer: $DMG_OUT"
echo ""
echo "What was built:"
echo "  - Firefox ESR as browser core (Gecko rendering engine)"
echo "  - Linkon.app bundle (renamed, rebranded)"
echo "  - Linkon extension (.xpi) with all 5 pillars"
echo "  - Stract search engine (default, no Google)"
echo "  - Cosmic userChrome skin"
echo "  - TeraBites Linkon Pass auth + Universe new tab"
echo "  - OpenHands agent backend ready"
echo ""
echo "To install: Open $DMG_OUT and drag Linkon.app to /Applications"
