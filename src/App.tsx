import { useState } from 'react';
import { Header, Footer } from '@/components/Layout';
import { RouteSelection } from '@/components/RouteSelection';
import { DepartureList } from '@/components/DepartureList';
import { SeatSelection } from '@/components/SeatSelection';
import { Payment } from '@/components/Payment';
import { Receipt } from '@/components/Receipt';
import type { Route, Departure } from '@/lib/supabase';

type Step = 'routes' | 'departures' | 'seats' | 'payment' | 'receipt';

function App() {
  const [step, setStep] = useState<Step>('routes');
  const [route, setRoute] = useState<Route | null>(null);
  const [departure, setDeparture] = useState<Departure | null>(null);
  const [seat, setSeat] = useState<number | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState<string>('');

  function startOver() {
    setStep('routes');
    setRoute(null);
    setDeparture(null);
    setSeat(null);
    setBookingId(null);
    setPaymentRef('');
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
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
              setSeat(s);
              setStep('payment');
            }}
          />
        )}
        {step === 'payment' && route && departure && seat !== null && (
          <Payment
            route={route}
            departure={departure}
            seat={seat}
            onBack={() => setStep('seats')}
            onPaid={(id, ref) => {
              setBookingId(id);
              setPaymentRef(ref);
              setStep('receipt');
            }}
          />
        )}
        {step === 'receipt' && bookingId && (
          <Receipt bookingId={bookingId} paymentRef={paymentRef} onDone={startOver} />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
