import { Check } from 'lucide-react';

const STEP_LABELS = ['Route', 'Date & matatu', 'Seats', 'Payment'];
const NEXT_HINTS = [
  'choose a route to see its departures',
  'pick a travel date, then a matatu',
  'tap the seats you want, then continue',
  'enter your details and pay',
];

type Props = {
  current: number;
};

export function BookingSteps({ current }: Props) {
  return (
    <nav aria-label="Booking progress" className="mx-auto max-w-3xl px-4 pt-8">
      <ol className="flex items-center">
        {STEP_LABELS.map((label, idx) => {
          const done = idx < current;
          const active = idx === current;
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    'inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300',
                    done
                      ? 'bg-brand-600 text-white'
                      : active
                        ? 'bg-gradient-to-br from-brand-500 to-teal-600 text-white ring-4 ring-brand-100'
                        : 'bg-slate-200 text-slate-500',
                  ].join(' ')}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : idx + 1}
                </span>
                <span
                  className={[
                    'hidden text-sm font-semibold sm:inline',
                    active ? 'text-brand-800' : done ? 'text-slate-700' : 'text-slate-400',
                  ].join(' ')}
                >
                  {label}
                </span>
              </div>
              {idx < STEP_LABELS.length - 1 && (
                <span
                  className={[
                    'mx-3 h-0.5 flex-1 rounded-full transition-colors duration-300',
                    done ? 'bg-brand-500' : 'bg-slate-200',
                  ].join(' ')}
                />
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm font-medium text-slate-600" aria-live="polite">
        Step {current + 1} of {STEP_LABELS.length}: <span className="text-brand-700">{NEXT_HINTS[current]}</span>
      </p>
    </nav>
  );
}
