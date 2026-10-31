import { useEffect, useState } from 'react';
import { Loader as Loader2 } from 'lucide-react';
import { Header, Footer } from '@/components/Layout';
import { Admin } from '@/components/Admin';
import { MyBookings } from '@/components/MyBookings';
import { BookingSteps } from '@/components/BookingSteps';
import { SignInGate } from '@/components/SignInGate';
import { Profile } from '@/components/Profile';
import { RouteSelection } from '@/components/RouteSelection';
import { DepartureList } from '@/components/DepartureList';
import { SeatSelection } from '@/components/SeatSelection';
import { Payment } from '@/components/Payment';
import { Receipt } from '@/components/Receipt';
import { useAuth } from '@/lib/authContext';
import { isAdminEmail } from '@/lib/adminApi';
import type { Route, Departure } from '@/lib/db';

type Step = 'routes' | 'departures' | 'seats' | 'payment' | 'receipt';
type View = 'booking' | 'profile' | 'bookings' | 'admin';

const STEP_INDEX: Record<Step, number> = { routes: 0, departures: 1, seats: 2, payment: 3, receipt: 4 };

function App() {
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState<View>('booking');
  const [step, setStep] = useState<Step>('routes');
  const [route, setRoute] = useState<Route | null>(null);
  const [departure, setDeparture] = useState<Departure | null>(null);
  const [seats, setSeats] = useState<number[]>([]);
  const [bookingIds, setBookingIds] = useState<string[]>([]);
  const [paymentRef, setPaymentRef] = useState<string>('');

  const isSignedIn = Boolean(user);
  const canUseAdmin = Boolean(user && isAdminEmail(user.email) && user.emailVerified);

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

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 gradient-mesh">
      <Header
        onOpenProfile={() => setView('profile')}
        onOpenBookings={() => setView('bookings')}
        onOpenAdmin={() => setView('admin')}
      />
      <main className="flex-1">
        {authLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
          </div>
        )}
        {!authLoading && !user && <SignInGate />}
        {!authLoading && user && view === 'profile' && <Profile onBack={() => setView('booking')} />}
        {!authLoading && user && view === 'bookings' && <MyBookings onBack={() => setView('booking')} />}
        {!authLoading && canUseAdmin && view === 'admin' && <Admin onBack={() => setView('booking')} />}
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
              <Receipt paymentRef={paymentRef} onDone={startOver} />
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
