import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Armchair, Smartphone, LogIn, ShieldCheck, Ticket } from 'lucide-react';
import { AuthDialog } from '@/components/AuthDialog';

const steps = [
  { icon: LogIn, title: 'Sign in or create an account', desc: 'Takes less than a minute.' },
  { icon: Ticket, title: 'Choose your route and matatu', desc: 'Pick a date, then a departure time.' },
  { icon: Armchair, title: 'Pick your seats', desc: 'See the live seat map before you pay.' },
  { icon: Smartphone, title: 'Pay and get your receipt', desc: 'Show it to the conductor when boarding.' },
];

export function SignInGate() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="relative isolate flex min-h-screen flex-col justify-center overflow-hidden">
      {/* Full-page background image */}
      <img
        src="/assets/images/OPTION_6_page-0001.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 h-full w-full object-cover object-center scale-105 opacity-35 blur-[2px]"
      />
      {/* Overlay for readability */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-white/90 via-white/80 to-white/90" />

      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 py-12 sm:py-16">
        <div className="grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div className="animate-slide-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-brand-100">
              <ShieldCheck className="h-3.5 w-3.5" /> Sign in required
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              Sign in to book your trip
            </h1>
            <p className="mt-3 max-w-md text-slate-700">
              Your bookings and receipts stay tied to your account, so you can find them anytime.
            </p>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:shadow-brand-500/40 hover:brightness-110 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <LogIn className="h-4 w-4" /> Sign in to continue
            </button>
          </div>

          <ol className="space-y-3 animate-slide-in-right animate-delay-200">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm"
                >
                  <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-wide text-brand-700">Step {idx + 1}</span>
                    <span className="block text-sm font-semibold text-slate-900">{step.title}</span>
                    <span className="block text-sm text-slate-500">{step.desc}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {dialogOpen && createPortal(<AuthDialog onClose={() => setDialogOpen(false)} />, document.body)}
      </div>
    </div>
  );
}
