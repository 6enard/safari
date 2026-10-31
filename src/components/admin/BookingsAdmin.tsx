import { useMemo, useState } from 'react';
import { Armchair, Bus, Calendar, Clock, MapPin, Phone, User as UserIcon, X, Info, Search, Ticket, Download, Ban, Loader as Loader2 } from 'lucide-react';
import { adminApi, errorText, type AdminBooking, type AdminData } from '@/lib/adminApi';
import { FormError, inputClass } from '@/components/admin/AdminShared';
import { formatDate, formatKes, formatTime, formatDateTime } from '@/lib/format';

type Props = {
  data: AdminData;
  onChanged: () => Promise<void>;
};

type SeatInfo = { status: 'available' | 'taken'; booking?: AdminBooking };

const SEAT_COUNT = 10;
const SEAT_ROWS: { left: number | null; right: [number, number] | null }[] = [
  { left: 2, right: [3, 4] },
  { left: 5, right: [6, 7] },
  { left: 8, right: [9, 10] },
];

function SeatSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="13" y="4" width="22" height="7" rx="3.5" fill="currentColor" opacity="0.7" />
      <rect x="10" y="9" width="28" height="14" rx="5" fill="currentColor" opacity="0.9" />
      <rect x="8" y="21" width="32" height="14" rx="6" fill="currentColor" />
      <rect x="12" y="24" width="24" height="2" rx="1" fill="white" opacity="0.18" />
      <rect x="12" y="33" width="6" height="6" rx="2" fill="currentColor" opacity="0.6" />
      <rect x="30" y="33" width="6" height="6" rx="2" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function BookingsAdmin({ data, onChanged }: Props) {
  const [search, setSearch] = useState('');
  const [passengerSearch, setPassengerSearch] = useState('');
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const routeById = useMemo(() => new Map(data.routes.map((r) => [r.id, r])), [data.routes]);
  const vehicleById = useMemo(() => new Map(data.vehicles.map((v) => [v.id, v])), [data.vehicles]);

  const bookingsByDeparture = useMemo(() => {
    const map = new Map<string, Map<number, AdminBooking>>();
    for (const b of data.bookings) {
      if (b.status === 'cancelled') continue;
      let seatMap = map.get(b.departure_id);
      if (!seatMap) {
        seatMap = new Map();
        map.set(b.departure_id, seatMap);
      }
      seatMap.set(b.seat_number, b);
    }
    return map;
  }, [data.bookings]);

  const departuresWithInfo = useMemo(
    () =>
      data.departures
        .map((d) => {
          const route = routeById.get(d.route_id);
          const vehicle = vehicleById.get(d.vehicle_id ?? '');
          const seatMap = bookingsByDeparture.get(d.id) ?? new Map();
          const bookedCount = seatMap.size;
          return { dep: d, route, vehicle, seatMap, bookedCount };
        })
        .sort((a, b) =>
          `${b.dep.departure_date}${b.dep.departure_time}`.localeCompare(
            `${a.dep.departure_date}${a.dep.departure_time}`,
          ),
        ),
    [data.departures, routeById, vehicleById, bookingsByDeparture],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return departuresWithInfo;
    return departuresWithInfo.filter((item) => {
      const label = `${item.route?.origin ?? ''} ${item.route?.destination ?? ''} ${item.vehicle?.plate_number ?? ''} ${item.vehicle?.vehicle_name ?? ''} ${item.dep.departure_date}`.toLowerCase();
      return label.includes(q);
    });
  }, [departuresWithInfo, search]);

  // Group filtered trips by date (newest date first, latest time first within a date)
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const list = map.get(item.dep.departure_date) ?? [];
      list.push(item);
      map.set(item.dep.departure_date, list);
    }
    return [...map.entries()]
      .map(([date, items]) => ({
        date,
        items: items.sort((a, b) => b.dep.departure_time.localeCompare(a.dep.departure_time)),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filtered]);

  const [selectedDepartureIdx, setSelectedDepartureIdx] = useState(0);
  const current = filtered[selectedDepartureIdx];

  const seatStates: SeatInfo[] = useMemo(() => {
    const states: SeatInfo[] = [];
    for (let n = 1; n <= SEAT_COUNT; n++) {
      const booking = current?.seatMap.get(n);
      states[n] = { status: booking ? 'taken' : 'available', booking };
    }
    return states;
  }, [current]);

  const selectedBooking = selectedSeat != null ? seatStates[selectedSeat]?.booking : undefined;

  function handleSelectSeat(n: number) {
    const info = seatStates[n];
    if (info?.status === 'taken') {
      setSelectedSeat((prev) => (prev === n ? null : n));
    }
  }

  // Passenger search: searches across ALL bookings, not just selected trip
  const passengerResults = useMemo(() => {
    const q = passengerSearch.trim().toLowerCase();
    if (q.length < 2) return [];
    return data.bookings
      .filter((b) => b.status !== 'cancelled')
      .filter((b) => {
        return (
          b.passenger_name.toLowerCase().includes(q) ||
          b.passenger_phone.toLowerCase().includes(q) ||
          b.payment_ref.toLowerCase().includes(q)
        );
      })
      .slice(0, 20);
  }, [data.bookings, passengerSearch]);

  const allPassengers = useMemo(() => {
    return data.bookings
      .filter((b) => b.status !== 'cancelled')
      .map((b) => {
        const dep = b.departures;
        const route = dep?.routes;
        const vehicle = dep?.vehicles;
        return {
          booking: b,
          routeName: route ? `${route.origin} - ${route.destination}` : '',
          date: dep?.departure_date ?? '',
          time: dep?.departure_time ?? '',
          vehicleName: vehicle ? `${vehicle.vehicle_name} (${vehicle.plate_number})` : '',
          fare: dep?.fare ?? 0,
        };
      });
  }, [data.bookings]);

  function handleExport() {
    const headers = ['Passenger Name', 'Phone', 'Seat', 'Route', 'Date', 'Time', 'Matatu', 'Payment Method', 'Receipt No.', 'Fare (KES)', 'Booked On', 'Status'];
    const rows: string[][] = [headers];
    for (const p of allPassengers) {
      rows.push([
        p.booking.passenger_name,
        p.booking.passenger_phone,
        String(p.booking.seat_number),
        p.routeName,
        p.date,
        p.time,
        p.vehicleName,
        p.booking.payment_method,
        p.booking.payment_ref,
        String(p.fare),
        formatDateTime(p.booking.created_at),
        p.booking.status,
      ]);
    }
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCsv(rows, `bookings-export-${dateStr}.csv`);
  }

  async function handleCancelBooking(bookingId: string) {
    setPageError(null);
    setCancellingId(bookingId);
    try {
      await adminApi.cancelBooking(bookingId);
      setSelectedSeat(null);
      await onChanged();
    } catch (err) {
      setPageError(errorText(err));
    } finally {
      setCancellingId(null);
    }
  }

  if (data.departures.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-slate-500">
        <Ticket className="mx-auto mb-3 h-8 w-8 opacity-50" />
        <p className="font-medium text-slate-700">No trips scheduled yet</p>
        <p className="mt-1 text-sm">Add departures in the Schedules tab to see bookings here.</p>
      </div>
    );
  }

  return (
    <section>
      {pageError && <div className="mb-4"><FormError message={pageError} /></div>}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm text-slate-600">
          {allPassengers.length} active {allPassengers.length === 1 ? 'booking' : 'bookings'} across {data.departures.length} {data.departures.length === 1 ? 'trip' : 'trips'}.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className={`${inputClass} pl-10`}
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedDepartureIdx(0); setSelectedSeat(null); }}
              placeholder="Search trips by route, plate, date..."
            />
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={allPassengers.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition-all hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Passenger search */}
      <div className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="relative mb-3">
          <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClass} pl-10`}
            type="search"
            value={passengerSearch}
            onChange={(e) => setPassengerSearch(e.target.value)}
            placeholder="Search by passenger name, phone, or receipt number..."
          />
        </div>
        {passengerSearch.trim().length >= 2 && (
          passengerResults.length === 0 ? (
            <p className="py-3 text-center text-sm text-slate-500">No passengers found matching "{passengerSearch}".</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {passengerResults.map((b) => {
                const dep = b.departures;
                const route = dep?.routes;
                const vehicle = dep?.vehicles;
                return (
                  <li key={b.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <UserIcon className="h-3.5 w-3.5 text-brand-600" />
                        {b.passenger_name}
                        <span className="rounded-md bg-brand-100 px-1.5 text-xs font-bold text-brand-700">Seat {b.seat_number}</span>
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{b.passenger_phone}</span>
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{route ? `${route.origin} - ${route.destination}` : '—'}</span>
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{dep ? formatDate(dep.departure_date) : '—'}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{dep ? formatTime(dep.departure_time) : '—'}</span>
                        {vehicle && <span className="inline-flex items-center gap-1"><Bus className="h-3 w-3" />{vehicle.plate_number}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      <span className="font-mono text-xs text-slate-500">{b.payment_ref}</span>
                      <button
                        type="button"
                        disabled={cancellingId === b.id}
                        onClick={() => handleCancelBooking(b.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        {cancellingId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                        Cancel
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        )}
        {passengerSearch.trim().length < 2 && passengerSearch.trim().length > 0 && (
          <p className="py-2 text-center text-xs text-slate-400">Type at least 2 characters to search.</p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-slate-500">
          <p className="font-medium text-slate-700">No trips match your search</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Trip list grouped by date (newest first) */}
          <div className="space-y-4 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
            {grouped.map((group) => {
              const bookedSeats = group.items.reduce((sum, it) => sum + it.bookedCount, 0);
              return (
                <div key={group.date}>
                  <div className="sticky top-0 z-10 mb-2 flex items-center justify-between rounded-lg bg-slate-100/90 px-3 py-2 backdrop-blur-sm">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-800">
                      <Calendar className="h-4 w-4 text-brand-600" />
                      {formatDate(group.date)}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {group.items.length} {group.items.length === 1 ? 'trip' : 'trips'} · {bookedSeats} {bookedSeats === 1 ? 'seat' : 'seats'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const idx = filtered.indexOf(item);
                      const active = idx === selectedDepartureIdx;
                      const route = item.route;
                      const vehicle = item.vehicle;
                      return (
                        <button
                          key={item.dep.id}
                          type="button"
                          onClick={() => { setSelectedDepartureIdx(idx); setSelectedSeat(null); }}
                          className={[
                            'w-full rounded-xl border p-4 text-left transition-all',
                            active
                              ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-300 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/50',
                          ].join(' ')}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">
                              {route ? `${route.origin} - ${route.destination}` : 'Unknown route'}
                            </p>
                            <span className={[
                              'flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-bold',
                              item.bookedCount === SEAT_COUNT ? 'bg-red-100 text-red-700' : item.bookedCount > 0 ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500',
                            ].join(' ')}>
                              {item.bookedCount}/{SEAT_COUNT}
                            </span>
                          </div>
                          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(item.dep.departure_time)}</span>
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                            <Bus className="h-3 w-3" />
                            {vehicle ? `${vehicle.vehicle_name} · ${vehicle.plate_number}` : 'No matatu assigned'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Seat map + passenger detail */}
          {current && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-bold text-slate-900">
                      {current.route ? `${current.route.origin} → ${current.route.destination}` : 'Unknown route'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatDate(current.dep.departure_date)} · {formatTime(current.dep.departure_time)} · {current.vehicle ? `${current.vehicle.vehicle_name} (${current.vehicle.plate_number})` : 'No matatu'}
                    </p>
                  </div>
                  <span className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700 ring-1 ring-brand-100">
                    {current.bookedCount} / {SEAT_COUNT} seats booked
                  </span>
                </div>

                <div className="mb-4 flex items-center justify-center gap-2 rounded-lg bg-brand-50 px-4 py-2 text-xs text-brand-700 ring-1 ring-brand-100">
                  <Info className="h-3.5 w-3.5 flex-shrink-0" />
                  Click a booked (colored) seat to see the passenger details.
                </div>

                {/* Matatu body */}
                <div className="mx-auto max-w-sm rounded-[2rem] border-2 border-slate-300 bg-gradient-to-b from-slate-50 to-slate-100 p-4 shadow-inner">
                  {/* Front row: Seat 1 + Driver */}
                  <div className="mb-3 flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                    <AdminSeatButton
                      n={1}
                      info={seatStates[1]}
                      selected={selectedSeat === 1}
                      onSelect={handleSelectSeat}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">Driver</span>
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
                        <UserIcon className="h-5 w-5" />
                      </span>
                    </div>
                  </div>

                  {/* Seat rows */}
                  <div className="space-y-3">
                    {SEAT_ROWS.map((row, idx) => (
                      <div key={idx} className="flex items-center justify-center gap-3">
                        {row.left !== null ? (
                          <AdminSeatButton
                            n={row.left}
                            info={seatStates[row.left]}
                            selected={selectedSeat === row.left}
                            onSelect={handleSelectSeat}
                          />
                        ) : (
                          <span className="h-12 w-12" />
                        )}
                        <div className="mx-1 h-12 w-6 rounded-md bg-slate-200/60" aria-hidden />
                        {row.right !== null ? (
                          <>
                            <AdminSeatButton
                              n={row.right[0]}
                              info={seatStates[row.right[0]]}
                              selected={selectedSeat === row.right[0]}
                              onSelect={handleSelectSeat}
                            />
                            <AdminSeatButton
                              n={row.right[1]}
                              info={seatStates[row.right[1]]}
                              selected={selectedSeat === row.right[1]}
                              onSelect={handleSelectSeat}
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
                <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-600">
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
                    Booked
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center text-amber-600">
                      <SeatSVG className="h-5 w-5" />
                    </span>
                    Selected
                  </span>
                </div>
              </div>

              {/* Passenger detail panel */}
              {selectedSeat != null && selectedBooking ? (
                <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm animate-fade-in-scale">
                  <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-brand-50 px-5 py-3">
                    <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Armchair className="h-4 w-4 text-amber-600" />
                      Seat {selectedSeat} — Passenger details
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedSeat(null)}
                      className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <dl className="divide-y divide-slate-100">
                    <DetailRow icon={<UserIcon className="h-4 w-4" />} label="Passenger name" value={selectedBooking.passenger_name} />
                    <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={selectedBooking.passenger_phone} />
                    <DetailRow icon={<Ticket className="h-4 w-4" />} label="Payment method" value={selectedBooking.payment_method} />
                    <DetailRow icon={<Ticket className="h-4 w-4" />} label="Receipt no." value={selectedBooking.payment_ref} mono />
                    <DetailRow icon={<Calendar className="h-4 w-4" />} label="Booked on" value={formatDateTime(selectedBooking.created_at)} />
                    <DetailRow
                      icon={<MapPin className="h-4 w-4" />}
                      label="Route"
                      value={current.route ? `${current.route.origin} - ${current.route.destination}` : '—'}
                    />
                    <DetailRow
                      icon={<Bus className="h-4 w-4" />}
                      label="Matatu"
                      value={current.vehicle ? `${current.vehicle.vehicle_name} · ${current.vehicle.plate_number}` : '—'}
                    />
                    <DetailRow
                      icon={<Clock className="h-4 w-4" />}
                      label="Departs"
                      value={`${formatDate(current.dep.departure_date)} · ${formatTime(current.dep.departure_time)}`}
                    />
                    <DetailRow
                      icon={<Ticket className="h-4 w-4" />}
                      label="Fare paid"
                      value={formatKes(current.dep.fare)}
                    />
                  </dl>
                  <div className="border-t border-slate-100 p-4">
                    <button
                      type="button"
                      disabled={cancellingId === selectedBooking.id}
                      onClick={() => handleCancelBooking(selectedBooking.id)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-all hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {cancellingId === selectedBooking.id ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Cancelling...</>
                      ) : (
                        <><Ban className="h-4 w-4" /> Cancel this booking</>
                      )}
                    </button>
                  </div>
                </div>
              ) : selectedSeat != null ? (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500 animate-fade-in">
                  Seat {selectedSeat} is not booked yet.
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-400 animate-fade-in">
                  <Armchair className="mx-auto mb-2 h-6 w-6 opacity-50" />
                  Select a booked seat on the matatu layout above to see who picked it.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function DetailRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
        <dd className={`truncate text-sm font-medium text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</dd>
      </div>
    </div>
  );
}

function AdminSeatButton({
  n,
  info,
  selected,
  onSelect,
}: {
  n: number;
  info: SeatInfo | undefined;
  selected: boolean;
  onSelect: (n: number) => void;
}) {
  const taken = info?.status === 'taken';
  return (
    <button
      type="button"
      disabled={!taken}
      onClick={() => onSelect(n)}
      aria-label={`Seat ${n}${taken ? ' (booked)' : ' (available)'}`}
      className={[
        'group relative inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200',
        selected
          ? 'text-amber-600 scale-110 shadow-lg shadow-amber-500/40 ring-2 ring-amber-300 animate-pop-in'
          : taken
            ? 'text-brand-600 hover:scale-110 cursor-pointer'
            : 'text-slate-300 cursor-default',
      ].join(' ')}
    >
      {taken && !selected && (
        <span className="absolute inset-0 rounded-xl bg-brand-50 opacity-50" />
      )}
      <SeatSVG className="relative h-10 w-10" />
      <span className={[
        'absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[10px] font-bold',
        taken ? (selected ? 'text-amber-700' : 'text-brand-700') : 'text-slate-500',
      ].join(' ')}>
        {n}
      </span>
      {taken && (
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center">
          <span className="h-2 w-2 rounded-full bg-brand-500" />
        </span>
      )}
    </button>
  );
}
