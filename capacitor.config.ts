import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.southrift.shuttle',
  appName: 'South Rift Shuttle',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  experimental: {
    ios: {
      spm: {
        swiftToolsVersion: '6.1',
        packageOptions: {
          '@capacitor-firebase/authentication': { symlink: true },
        },
        // Keep Google Sign-In, leave out the unused Facebook SDK.
        packageTraits: {
          '@capacitor-firebase/authentication': ['Google'],
        },
      },
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: false,
      backgroundColor: '#112d4e',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
      overlaysWebView: false,
    },
    FirebaseAuthentication: {
      // Sign in natively with Google, then hand the token to the Firebase web SDK
      // so the rest of the app keeps working unchanged.
      skipNativeAuth: true,
      providers: ['google.com'],
    },
  },
};

export default config;
