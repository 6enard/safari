# South Rift Shuttle: Android & iOS apps (Capacitor)

The web app is wrapped with Capacitor 8. App ID: `com.southrift.shuttle` (change it in
`capacitor.config.ts` AND `android/app/build.gradle` / Xcode **before** your first store upload).

## What was changed for mobile
| File | Change |
|---|---|
| `capacitor.config.ts` | App config, splash, status bar, Firebase Google plugin |
| `src/lib/native.ts` | `isNative` flag, startup setup, Android back button, `savePdf()` |
| `src/lib/pdfReceipt.ts` | PDFs now save + open the share sheet in the app (browser unchanged) |
| `src/components/AuthDialog.tsx` | Google sign-in uses the native account picker in the app (popup kept for web) |
| `index.html`, `Layout.tsx` | `viewport-fit=cover` + header safe-area padding for notches |
| `package.json` | Firebase 11 -> 12 (required by the plugin) + Capacitor packages + `cap:*` scripts |
| `android/`, `ios/` | Generated native projects, icons and splash screens |
| `assets/` | Placeholder icon/splash sources (a navy bus). Replace with your logo, then `npm run cap:assets` |

## One-time setup (needs YOUR Firebase files)
Email/password login and everything else works without these. **Google sign-in will not work until they are added.**

1. Firebase console -> project `safari-196fc` -> Authentication -> Sign-in method -> make sure **Google** is enabled.
2. **Android:** Project settings -> Add app -> Android -> package `com.southrift.shuttle`.
   - Add your SHA-1 (debug: `cd android && ./gradlew signingReport`).
   - Download `google-services.json` into `android/app/`.
   - Later, for the Play Store build, ALSO add the SHA-1 of the *App signing key* shown in Play Console -> App integrity, and re-download the file.
3. **iOS:** Add app -> iOS -> bundle ID `com.southrift.shuttle`.
   - Download `GoogleService-Info.plist` and drag it into the `App` group in Xcode (tick "Copy items").
   - Xcode -> App target -> Info -> URL Types -> **+** -> paste the `REVERSED_CLIENT_ID` value from that plist into *URL Schemes*.

## Build & run
```bash
npm install
npm run cap:android     # builds web, syncs, opens Android Studio -> press Run
npm run cap:ios         # Mac only; opens Xcode -> pick a device -> Run
```
After ANY web code change: `npm run cap:sync`, then run again from the IDE.

## Publish
- **Android:** Android Studio -> Build -> Generate Signed Bundle (AAB) -> upload to Google Play Console. Keep the keystore safe.
- **iOS:** Xcode -> Product -> Archive -> Distribute -> App Store Connect. Needs Xcode 16.3+ (Swift 6.1).
- Both stores need a privacy policy URL and screenshots. Apple may reject "website in a wrapper" apps (guideline 4.2); the native
  Google login, receipt sharing, splash and safe-area handling help, and push notifications for departure reminders would help more.

## Known limits
- Needs an internet connection (data and fonts load from Supabase / Google Fonts).
- Admin panel (`#/admin`) works, but is designed for larger screens.
