# Update: reminders, new icon/splash, clearer sign-in errors

1. Copy the contents of this zip over your repo root (overwrite when asked).
2. In your repo root run:
       npm install @capacitor/local-notifications
3. Open capacitor.config.ts and add this inside `plugins: { ... }`:
       LocalNotifications: {
         smallIcon: 'ic_stat_notify',
         iconColor: '#3F72AF',
       },
4. Run:  npm run cap:sync
5. Uninstall the old app from your phone (so the new icon/splash show), then Run from Android Studio.
