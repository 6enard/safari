import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { jsPDF } from 'jspdf';

/** True when running inside the Android/iOS app, false in a normal browser. */
export const isNative = Capacitor.isNativePlatform();

/** Call once at startup. Does nothing in a browser. */
export async function initNative() {
  if (!isNative) return;

  try {
    await StatusBar.setStyle({ style: Style.Light });
  } catch {
    /* not supported on this OS version */
  }

  // Android hardware/gesture back button: go back to home first, then minimise.
  App.addListener('backButton', () => {
    if (window.location.hash && window.location.hash !== '#' && window.location.hash !== '#/') {
      window.location.hash = '';
    } else {
      void App.minimizeApp();
    }
  });

  // Tapping a trip reminder opens "My bookings".
  LocalNotifications.addListener('localNotificationActionPerformed', () => {
    window.location.hash = '#/bookings';
  });

  // Give the first paint a moment, then hide the splash screen.
  setTimeout(() => {
    void SplashScreen.hide();
  }, 600);
}

/**
 * Save a jsPDF document. In a browser it downloads the file as before.
 * In the app, webviews cannot download blobs, so we write the file to the
 * device cache and open the native share sheet (Save to Files, WhatsApp, Drive...).
 */
export async function savePdf(doc: jsPDF, filename: string) {
  if (!isNative) {
    doc.save(filename);
    return;
  }
  try {
    const dataUri = doc.output('datauristring');
    const base64 = dataUri.slice(dataUri.indexOf(',') + 1);
    const { uri } = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
    });
    await Share.share({ title: filename, url: uri, dialogTitle: 'Save or share your receipt' });
  } catch (err) {
    const msg = String((err as { message?: string })?.message ?? err);
    if (/cancel/i.test(msg)) return; // the user closed the share sheet
    window.alert('Sorry, we could not open the receipt. Please try again.');
  }
}
