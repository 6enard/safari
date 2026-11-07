import { Suspense, lazy, useEffect, useState } from 'react';
import { AppLoader } from '@/components/AppLoader';
import { Header, Footer } from '@/components/Layout';
import { MobileBottomNav, type BottomNavView } from '@/components/MobileBottomNav';
import { BookingSteps } from '@/components/BookingSteps';
import { SignInGate } from '@/components/SignInGate';
import { HomeChoice } from '@/components/HomeChoice';
import { RouteSelection } from '@/components/RouteSelection';
import { DepartureList } from '@/components/DepartureList';
import { SeatSelection } from '@/components/SeatSelection';
import { Payment } from '@/components/Payment';
import { Receipt } from '@/components/Receipt';
import { DepartureReminders } from '@/components/DepartureReminders';
import { useAuth } from '@/lib/authContext';
import { isAdminEmail } from '@/lib/adminApi';
import { hideSplash } from '@/lib/native';
import type { Route, Departure } from '@/lib/db';

const Admin = lazy(() => import('@/components/Admin').then((m) => ({ default: m.Admin })));
const MyBookings = lazy(() => import('@/components/MyBookings').then((m) => ({ default: m.MyBookings })));
const Parcels = lazy(() => import('@/components/Parcels').then((m) => ({ default: m.Parcels })));
const Help = lazy(() => import('@/components/Help').then((m) => ({ default: m.Help })));
const Profile = lazy(() => import('@/components/Profile').then((m) => ({ default: m.Profile })));

type Step = 'routes' | 'departures' | 'seats' | 'payment' | 'receipt';
type View = 'home' | 'booking' | 'profile' | 'bookings' | 'admin' | 'parcels' | 'help';

const STEP_INDEX: Record<Step, number> = { routes: 0, departures: 1, seats: 2, payment: 3, receipt: 4 };

const VALID_VIEWS: View[] = ['home', 'booking', 'profile', 'bookings', 'admin', 'parcels', 'help'];

function viewFromHash(): View {
  const raw = window.location.hash.replace(/^#\/?/, '');
  return VALID_VIEWS.includes(raw as View) ? (raw as View) : 'home';
}

function App() {
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState<View>(() => viewFromHash());
  const [step, setStep] = useState<Step>('routes');
  const [route, setRoute] = useState<Route | null>(null);
  const [departure, setDeparture] = useState<Departure | null>(null);
  const [seats, setSeats] = useState<number[]>([]);
  const [bookingIds, setBookingIds] = useState<string[]>([]);
  const [paymentRef, setPaymentRef] = useState<string>('');

  const isSignedIn = Boolean(user);
  const canUseAdmin = Boolean(user && isAdminEmail(user.email) && user.emailVerified);

  // Keep the URL hash in sync with the current view.
  function changeView(next: View) {
    setView(next);
    if (next === 'home' || next === 'booking') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } else {
      window.history.replaceState(null, '', `#/${next}`);
    }
  }

  // If the user hits the back/forward button, follow the hash.
  useEffect(() => {
    function onHashChange() {
      setView(viewFromHash());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // If the saved view is unavailable for this user, fall back to home.
  useEffect(() => {
    if (view !== 'home' && view !== 'booking' && (!user || (view === 'admin' && !canUseAdmin))) {
      changeView('home');
    }
  }, [view, user, canUseAdmin]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [step, view, isSignedIn]);

  function startOver() {
    setStep('routes');
    setRoute(null);
    setDeparture(null);
    setSeats([]);
    setBookingIds([]);
    setPaymentRef('');
  }

  function goHome() {
    startOver();
    changeView('home');
  }

  function navigateFromBottomBar(next: BottomNavView) {
    if (next === 'home') {
      goHome();
      return;
    }
    if (next === 'booking' && view !== 'booking') startOver();
    changeView(next);
  }

  // Hand over from the native splash to the in-app loader once the first frame is ready.
  useEffect(() => {
    void hideSplash();
  }, []);

  if (authLoading) return <AppLoader />;

  return (
    <div className={`flex min-h-screen flex-col bg-slate-50 text-slate-900 gradient-mesh ${isSignedIn ? 'pb-24 sm:pb-0' : ''}`}>
      <Header
        onOpenProfile={() => changeView('profile')}
        onOpenBookings={() => changeView('bookings')}
        onOpenAdmin={() => changeView('admin')}
        onOpenParcels={() => changeView('parcels')}
        onOpenHelp={() => changeView('help')}
        onGoHome={() => changeView('home')}
      />
      <main className="flex-1">
        <Suspense fallback={<AppLoader inline />}>
        {!authLoading && !user && <SignInGate />}
        {!authLoading && user && view === 'profile' && <Profile onBack={() => changeView('home')} />}
        {!authLoading && user && view === 'bookings' && <MyBookings onBack={() => changeView('home')} />}
        {!authLoading && canUseAdmin && view === 'admin' && <Admin onBack={() => changeView('home')} />}
        {!authLoading && user && view === 'parcels' && <Parcels onBack={() => changeView('home')} />}
        {!authLoading && user && view === 'help' && (
          <Help
            onBack={() => changeView('home')}
            onBookTrip={() => changeView('booking')}
            onSendParcel={() => changeView('parcels')}
          />
        )}
        {!authLoading && user && view === 'home' && (
          <HomeChoice
            onBookTrip={() => changeView('booking')}
            onSendParcel={() => changeView('parcels')}
          />
        )}
        {!authLoading && user && view === 'booking' && (
          <>
            {step !== 'receipt' && <BookingSteps current={STEP_INDEX[step]} />}
            {step === 'routes' && (
              <RouteSelection
                onSelectRoute={(r) => {
                  setRoute(r);
                  setStep('departures');
                }}
              />
            )}
            {step === 'departures' && route && (
              <DepartureList
                route={route}
                onBack={startOver}
                onSelectDeparture={(d) => {
                  setDeparture(d);
                  setStep('seats');
                }}
              />
            )}
            {step === 'seats' && route && departure && (
              <SeatSelection
                route={route}
                departure={departure}
                onBack={() => setStep('departures')}
                onContinue={(s) => {
                  setSeats(s);
                  setStep('payment');
                }}
              />
            )}
            {step === 'payment' && route && departure && seats.length > 0 && (
              <Payment
                route={route}
                departure={departure}
                seats={seats}
                onBack={() => setStep('seats')}
                onPaid={(ids, ref) => {
                  setBookingIds(ids);
                  setPaymentRef(ref);
                  setStep('receipt');
                }}
              />
            )}
            {step === 'receipt' && bookingIds.length > 0 && (
              <Receipt paymentRef={paymentRef} onDone={goHome} />
            )}
          </>
        )}
        </Suspense>
      </main>
      <Footer />
      {!authLoading && user && <MobileBottomNav activeView={view} onNavigate={navigateFromBottomBar} />}
      {user && <DepartureReminders />}
    </div>
  );
}

export default App;
