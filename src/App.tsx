import { useState } from 'react';
import { Header, Footer } from '@/components/Layout';
import { RouteSelection } from '@/components/RouteSelection';
import { DepartureList } from '@/components/DepartureList';
import { SeatSelection } from '@/components/SeatSelection';
import { Payment } from '@/components/Payment';
import { Receipt } from '@/components/Receipt';
import type { Route, Departure } from '@/lib/db';

type Step = 'routes' | 'departures' | 'seats' | 'payment' | 'receipt';

function App() {
  const [step, setStep] = useState<Step>('routes');
  const [route, setRoute] = useState<Route | null>(null);
  const [departure, setDeparture] = useState<Departure | null>(null);
  const [seats, setSeats] = useState<number[]>([]);
  const [bookingIds, setBookingIds] = useState<string[]>([]);
  const [paymentRef, setPaymentRef] = useState<string>('');

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
      <Header />
      <main className="flex-1">
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
          <Receipt bookingIds={bookingIds} paymentRef={paymentRef} onDone={startOver} />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
