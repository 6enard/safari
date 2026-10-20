import { useEffect, useState } from 'react';
import { ArrowLeft, Circle, User, Check, Loader as Loader2, X } from 'lucide-react';
import { db, type Departure, type Route } from '@/lib/db';
import { formatKes, formatDate, formatTime } from '@/lib/format';

type Props = {
  route: Route;
  departure: Departure;
  onBack: () => void;
  onContinue: (seat: number) => void;
};

type SeatStatus = 'available' | 'taken';

// Driver sits on the right; seat 1 is on the left, directly above seat 2.
//
//   Row 0 (front):  1     | (empty)    Driver →
//   Row 1:          2     |  3, 4
//   Row 2:          5     |  6, 7
//   Row 3:          8     |  9, 10
const rows: { left: number | null; right: [number, number] | null }[] = [
  { left: 1, right: null },
  { left: 2, right: [3, 4] },
  { left: 5, right: [6, 7] },
  { left: 8, right: [9, 10] },
];

function SeatSVG({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Headrest */}
      <rect x="13" y="4" width="22" height="7" rx="3.5" fill="currentColor" opacity="0.7" />
      {/* Backrest */}
      <rect x="10" y="9" width="28" height="14" rx="5" fill="currentColor" opacity="0.9" />
      {/* Seat cushion */}
      <rect x="8" y="21" width="32" height="14" rx="6" fill="currentColor" />
      {/* Cushion highlight stripe */}
      <rect x="12" y="24" width="24" height="2" rx="1" fill="white" opacity="0.18" />
      {/* Seat base */}
      <rect x="12" y="33" width="6" height="6" rx="2" fill="currentColor" opacity="0.6" />
      <rect x="30" y="33" width="6" height="6" rx="2" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function SeatSelection({ route, departure, onBack, onContinue }: Props) {
  const [takenSeats, setTakenSeats] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const seats = await db.listBookedSeats(departure.id);
        if (!active) return;
        setTakenSeats(seats);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message ?? 'Failed to load seats');
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [departure.id]);

  const seatStatus = (n: number): SeatStatus =>
    takenSeats.includes(n) ? 'taken' : 'available';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <button
        onClick={onBack}
        className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to available matatus
      </button>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="animate-slide-up">
          <div className="mb-5 overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {route.origin} → {route.destination}
                </p>
                <p className="text-sm text-slate-500">
                  Safari Express · Plate {departure.plate_number}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-semibold text-slate-800">
                  {formatDate(departure.departure_date)}
                </p>
                <p className="text-slate-500">{formatTime(departure.departure_time)}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 animate-fade-in">
              Couldn't load seat availability. {error}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm animate-fade-in animate-delay-100">
              <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
                Select your seat
              </h3>

              {/* Matatu body */}
              <div className="mx-auto max-w-sm rounded-[2rem] border-2 border-slate-300 bg-gradient-to-b from-slate-50 to-slate-100 p-4 shadow-inner">
                {/* Driver on the right side; seat 1 on the left */}
                <div className="mb-3 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                  <span className="text-xs font-medium text-slate-400">Front</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">Driver</span>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-500" title="Driver">
                      <Circle className="h-5 w-5" />
                    </span>
                  </div>
                </div>

                {/* Seat rows */}
                <div className="space-y-3">
                  {rows.map((row, idx) => (
                    <div key={idx} className="flex items-center justify-center gap-3" style={{ animationDelay: `${idx * 0.08}s` }}>
                      {row.left !== null ? (
                        <SeatButton
                          n={row.left}
                          status={seatStatus(row.left)}
                          selected={selected === row.left}
                          onSelect={setSelected}
                        />
                      ) : (
                        <span className="h-12 w-12" />
                      )}
                      <div className="mx-1 h-12 w-6 rounded-md bg-slate-200/60" aria-hidden />
                      {row.right !== null ? (
                        <>
                          <SeatButton
                            n={row.right[0]}
                            status={seatStatus(row.right[0])}
                            selected={selected === row.right[0]}
                            onSelect={setSelected}
                          />
                          <SeatButton
                            n={row.right[1]}
                            status={seatStatus(row.right[1])}
                            selected={selected === row.right[1]}
                            onSelect={setSelected}
                          />
                        </>
                      ) : (
                        <span className="h-12 w-[104px]" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-center text-xs font-medium text-slate-400">
                  Back of matatu
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center text-slate-300">
                    <SeatSVG className="h-5 w-5" />
                  </span>
                  Available
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center text-brand-600">
                    <SeatSVG className="h-5 w-5" />
                  </span>
                  Selected
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center text-red-500">
                    <SeatSVG className="h-5 w-5" />
                  </span>
                  Taken
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm animate-slide-in-right lg:sticky lg:top-6">
          <div className="bg-gradient-to-r from-brand-50 to-teal-50 px-6 py-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-800">
              Your selection
            </h3>
          </div>
          <div className="p-6">
            {selected ? (
              <div className="animate-fade-in-scale">
                <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-brand-50 to-teal-50 p-4 ring-1 ring-brand-200">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-teal-600 font-bold text-white shadow-md shadow-brand-500/30">
                    {selected}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Seat {selected}</p>
                    <p className="text-xs text-brand-700">Available</p>
                  </div>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Route</dt>
                    <dd className="font-medium text-slate-800">
                      {route.origin} - {route.destination}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Departure</dt>
                    <dd className="font-medium text-slate-800">
                      {formatTime(departure.departure_time)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
                    <dt className="font-semibold text-slate-700">Fare</dt>
                    <dd className="font-bold text-brand-700">{formatKes(departure.fare)}</dd>
                  </div>
                </dl>
                <button
                  onClick={() => onContinue(selected)}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-brand-500 to-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-xl hover:shadow-brand-500/40 hover:brightness-110 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  Continue to payment
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 animate-fade-in">
                <User className="mx-auto mb-2 h-6 w-6 opacity-60" />
                Pick a seat from the matatu layout to continue.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SeatButton({
  n,
  status,
  selected,
  onSelect,
}: {
  n: number;
  status: SeatStatus;
  selected: boolean;
  onSelect: (n: number) => void;
}) {
  const taken = status === 'taken';
  return (
    <button
      type="button"
      disabled={taken}
      onClick={() => onSelect(n)}
      aria-label={`Seat ${n}${taken ? ' (taken)' : selected ? ' (selected)' : ' available'}`}
      className={[
        'group relative inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200',
        taken
          ? 'cursor-not-allowed text-red-500'
          : selected
            ? 'text-white scale-110 shadow-lg shadow-brand-500/40 ring-2 ring-brand-300 animate-pop-in'
            : 'text-slate-300 hover:text-brand-600 hover:scale-110 active:scale-95',
      ].join(' ')}
    >
      {taken ? (
        <>
          <SeatSVG className="h-10 w-10" />
          <span className="absolute inset-0 flex items-center justify-center">
            <X className="h-4 w-4 text-red-600" strokeWidth={3} />
          </span>
        </>
      ) : selected ? (
        <>
          <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500 to-teal-600" />
          <SeatSVG className="relative h-10 w-10" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        </>
      ) : (
        <>
          <SeatSVG className="h-10 w-10 transition-colors group-hover:text-brand-400" />
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-600 group-hover:text-brand-700">
            {n}
          </span>
        </>
      )}
    </button>
  );
}
