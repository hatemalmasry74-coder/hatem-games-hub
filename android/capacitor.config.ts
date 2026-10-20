import type { CapacitorConfig } from '@capacitor/cli';

/*
 * Moody & Aboody - Google Play wrapper.
 * !! appId is a PLACEHOLDER. Replace it with your own reverse-domain id BEFORE the first upload to
 * !! Google Play: the package name can never be changed afterwards. Use scripts/set_app_id.js.
 */
const config: CapacitorConfig = {
  appId: 'com.example.moodyadventures',          // <-- REPLACE (see docs/play/RELEASE_CHECKLIST.md)
  appName: 'مودي وعبودي',                          // launcher label is also set in res/values/strings.xml
  webDir: 'www',                                 // produced by scripts/make_www.js from the Play-edition build
  server: {
    androidScheme: 'https',                      // app is served from https://localhost (secure context -> SW, WebAudio, Wake Lock)
    // no `url`      -> never loads remote content: everything comes from the bundled www/
    // no `cleartext` -> http is not allowed
    allowNavigation: [],                         // the WebView may not navigate anywhere outside the app
  },
  android: {
    allowMixedContent: false,
    webContentsDebugEnabled: false,              // debug builds flip it on in MainActivity (BuildConfig.DEBUG)
    backgroundColor: '#0b1a33',
    // buildOptions (keystore) are intentionally NOT here: signing material only comes from CI secrets / gradle -P props
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,                     // Android 12+ system splash is used; the game has its own #splash
      backgroundColor: '#0b1a33',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
    },
  },
};

export default config;
