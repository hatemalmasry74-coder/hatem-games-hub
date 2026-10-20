#!/usr/bin/env bash
# Build the Android package from the Play-edition web assets.
#
#   scripts/build.sh debug   [--src DIR | --build-web DIR] [--split-voice]
#   scripts/build.sh release [--src DIR | --build-web DIR] [--split-voice]
#   scripts/build.sh both    ...
#
#   --src DIR        use an already built Play-edition web folder (contains index.html)
#   --build-web DIR  first run   node tools/play/build.js DIR   at the repo root (fails clearly if that tool is missing)
#   --split-voice    put assets/voice in the install-time asset pack (release AAB only; see docs/play/DECISION.md)
#
# Outputs:  debug   -> android/android/app/build/outputs/apk/debug/app-debug.apk        (sideload / emulator)
#           release -> android/android/app/build/outputs/bundle/release/app-release.aab (upload to Play)
# Release signing comes ONLY from the environment (never from a file in the repo):
#   KEYSTORE_PATH KEYSTORE_PASSWORD KEY_ALIAS KEY_PASSWORD     (missing -> UNSIGNED aab, with a warning)
# Version:  android/version.json, or VERSION_NAME / VERSION_CODE env.   App id: android/capacitor.config.ts
# Needs: Node 20+, JDK 21 (Capacitor 8) , Android SDK (ANDROID_HOME) with platform 36 + build-tools 36.
set -euo pipefail
cd "$(dirname "$0")/.."                # android/
ANDROID_DIR="$PWD"; REPO_ROOT="$(cd .. && pwd)"
MODE="${1:-debug}"; shift || true
SRC=""; BUILD_WEB=""; SPLIT=""
while [ $# -gt 0 ]; do case "$1" in
  --src) SRC="$2"; shift 2;; --build-web) BUILD_WEB="$2"; shift 2;; --split-voice) SPLIT="--split-voice"; shift;;
  *) echo "unknown option $1"; exit 2;; esac; done
die() { echo "ERROR: $*" >&2; exit 1; }
case "$MODE" in debug|release|both) ;; *) die "mode must be debug | release | both";; esac

command -v node >/dev/null || die "node not found"
command -v java >/dev/null || die "java not found (JDK 21 needed)"
[ -n "${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}" ] || die "ANDROID_HOME is not set (Android SDK with platforms;android-36 and build-tools;36.0.0)"
export ANDROID_HOME="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"

if [ -n "$BUILD_WEB" ]; then
  [ -f "$REPO_ROOT/tools/play/build.js" ] || die "tools/play/build.js does not exist yet (the Play-edition build tool). Build the web folder another way and pass --src DIR."
  echo "== Play-edition web build -> $BUILD_WEB"; (cd "$REPO_ROOT" && node tools/play/build.js "$BUILD_WEB"); SRC="$REPO_ROOT/$BUILD_WEB"
fi
[ -n "$SRC" ] || die "give --src DIR (built Play-edition folder) or --build-web DIR"

echo "== npm ci"; if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi
echo "== www"; node scripts/make_www.js --src "$SRC" $SPLIT
echo "== cap sync"; npx cap sync android

GRADLE_ARGS=(--no-daemon --stacktrace)
[ -n "$SPLIT" ] && GRADLE_ARGS+=(-PvoicePack=true)
cd android
if [ "$MODE" = debug ] || [ "$MODE" = both ]; then
  [ -n "$SPLIT" ] && echo "NOTE: the debug APK does not include install-time asset packs; for a debug build with voice, build WITHOUT --split-voice."
  echo "== assembleDebug"; ./gradlew "${GRADLE_ARGS[@]}" assembleDebug
  echo "APK: $PWD/app/build/outputs/apk/debug/app-debug.apk"
fi
if [ "$MODE" = release ] || [ "$MODE" = both ]; then
  if [ -z "${KEYSTORE_PATH:-}" ]; then echo "WARNING: KEYSTORE_PATH not set -> the AAB will be UNSIGNED (fine for a local test, not uploadable)."; fi
  echo "== bundleRelease"; ./gradlew "${GRADLE_ARGS[@]}" bundleRelease
  echo "AAB: $PWD/app/build/outputs/bundle/release/app-release.aab"
fi
