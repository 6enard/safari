import { useEffect, useState } from 'react';
import { ArrowLeft, Circle, User, Check, Loader2, X } from 'lucide-react';
import { db, type Departure, type Route } from '@/lib/db';
import { formatKes, formatDate, formatTime } from '@/lib/format';

type Props = {
  route: Route;
  departure: Departure;
  onBack: () => void;
  onContinue: (seat: number) => void;
};

type SeatStatus = 'available' | 'taken';

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

  // 10-seater matatu layout: rows of 2 seats on the left, 2 on the right,
  // with the driver at the front. Seat 1 is the front-left passenger.
  // Layout: [driver] + 4 rows of [1,2 | 3,4]... Actually for a 10-seater:
  // Row0: Driver + Seat1
  // Row1: Seat2,Seat3 | aisle | Seat4,Seat5
  // Row2: Seat6,Seat7 | aisle | Seat8,Seat9
  // Row3: Seat10 (back row full-width)
  const rows: (number[] | 'driver' | 'aisle')[] = [
    'driver',
    [2, 3, 4, 5],
    [6, 7, 8, 9],
    [10],
  ];
  // Seat 1 sits next to the driver (front passenger)
  const frontPassenger = 1;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to departures
      </button>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {route.origin} → {route.destination}
                </p>
                <p className="text-sm text-slate-500">
                  {departure.vehicle_name} · Plate {departure.plate_number}
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
              <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
              Couldn't load seat availability. {error}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
                Select your seat
              </h3>

              {/* Matatu body */}
              <div className="mx-auto max-w-md rounded-[2rem] border-2 border-slate-300 bg-slate-50 p-4">
                {/* Front / driver area */}
                <div className="mb-3 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                  <span className="text-xs font-medium text-slate-500">Front</span>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
                      <Circle className="h-5 w-5" />
                    </span>
                    <SeatButton
                      n={frontPassenger}
                      status={seatStatus(frontPassenger)}
                      selected={selected === frontPassenger}
                      onSelect={setSelected}
                    />
                  </div>
                </div>

                {/* Passenger rows */}
                <div className="space-y-3">
                  {rows.map((row, idx) => {
                    if (row === 'driver') return null;
                    const seats = row as number[];
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-center gap-3"
                      >
                        {seats.length === 4 ? (
                          <>
                            <SeatButton
                              n={seats[0]}
                              status={seatStatus(seats[0])}
                              selected={selected === seats[0]}
                              onSelect={setSelected}
                            />
                            <SeatButton
                              n={seats[1]}
                              status={seatStatus(seats[1])}
                              selected={selected === seats[1]}
                              onSelect={setSelected}
                            />
                            <div className="mx-2 h-10 w-6 rounded-md bg-slate-200/60" aria-hidden />
                            <SeatButton
                              n={seats[2]}
                              status={seatStatus(seats[2])}
                              selected={selected === seats[2]}
                              onSelect={setSelected}
                            />
                            <SeatButton
                              n={seats[3]}
                              status={seatStatus(seats[3])}
                              selected={selected === seats[3]}
                              onSelect={setSelected}
                            />
                          </>
                        ) : (
                          <div className="flex w-full justify-center gap-3">
                            {seats.map((n) => (
                              <SeatButton
                                key={n}
                                n={n}
                                status={seatStatus(n)}
                                selected={selected === n}
                                onSelect={setSelected}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 text-center text-xs font-medium text-slate-400">
                  Back of matatu
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded-md border border-slate-300 bg-white" /> Available
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded-md bg-emerald-600" /> Selected
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded-md bg-slate-300" /> Taken
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-6 h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Your selection
          </h3>
          {selected ? (
            <div className="mt-4">
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white">
                  {selected}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-700">Seat {selected}</p>
                  <p className="text-xs text-emerald-700">Available</p>
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
                  <dd className="font-bold text-emerald-700">{formatKes(departure.fare)}</dd>
                </div>
              </dl>
              <button
                onClick={() => onContinue(selected)}
                className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                Continue to payment
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">
              <User className="mx-auto mb-2 h-6 w-6 opacity-60" />
              Pick a seat from the matatu layout to continue.
            </div>
          )}
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
        'relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold transition-all',
        taken
          ? 'cursor-not-allowed bg-slate-300 text-slate-500'
          : selected
            ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
            : 'border border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:bg-emerald-50',
      ].join(' ')}
    >
      {taken ? <X className="h-4 w-4" /> : selected ? <Check className="h-4 w-4" /> : n}
    </button>
  );
}
