export type Route = {
  id: string;
  origin: string;
  destination: string;
  distance_km: number;
  duration_hours: number;
  base_fare: number;
  popular: boolean;
  created_at: string;
};

export type Departure = {
  id: string;
  route_id: string;
  departure_date: string;
  departure_time: string;
  vehicle_name: string;
  plate_number: string;
  total_seats: number;
  fare: number;
  amenities: string[];
  created_at: string;
};

export type Booking = {
  id: string;
  departure_id: string;
  seat_number: number;
  passenger_name: string;
  passenger_phone: string;
  payment_method: string;
  payment_ref: string;
  status: string;
  created_at: string;
};

export const SEAT_LAYOUT = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

const DB_NAME = 'tiketi-db';
const STORE = 'store';
const VERSION = 2;

type RecordMap = {
  routes: Route[];
  departures: Departure[];
  bookings: Booking[];
};

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const idb = req.result;
      if (!idb.objectStoreNames.contains(STORE)) {
        idb.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function readAll(db: IDBDatabase): Promise<RecordMap> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get('records');
    req.onsuccess = () => {
      const data = (req.result as RecordMap | undefined) ?? {
        routes: [],
        departures: [],
        bookings: [],
      };
      resolve(data);
    };
    req.onerror = () => reject(req.error);
  });
}

async function writeAll(db: IDBDatabase, data: RecordMap): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(data, 'records');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function mutate(fn: (data: RecordMap) => void): Promise<RecordMap> {
  const idb = await openDb();
  const data = await readAll(idb);
  fn(data);
  await writeAll(idb, data);
  return data;
}

async function read<T>(selector: (data: RecordMap) => T): Promise<T> {
  const idb = await openDb();
  const data = await readAll(idb);
  return selector(data);
}

function seedData(): RecordMap {
  const routes: Route[] = [
    { origin: 'Nairobi', destination: 'Mombasa', distance_km: 485, duration_hours: 8.0, base_fare: 1500, popular: true },
    { origin: 'Nakuru', destination: 'Nairobi', distance_km: 160, duration_hours: 3.0, base_fare: 700, popular: true },
    { origin: 'Nakuru', destination: 'Bomet', distance_km: 135, duration_hours: 2.5, base_fare: 600, popular: false },
    { origin: 'Kericho', destination: 'Kisumu', distance_km: 115, duration_hours: 2.0, base_fare: 500, popular: false },
  ].map((r) => ({
    ...r,
    id: uid('route'),
    created_at: new Date().toISOString(),
  }));

  const trips = [
    { departure_time: '07:30', vehicle_name: 'Safari Express', plate_number: 'KDA 100A', fare_adjust: 0, amenities: ['WiFi', 'AC', 'Charging'] },
    { departure_time: '14:00', vehicle_name: 'Safari Express', plate_number: 'KDB 220B', fare_adjust: -100, amenities: ['AC'] },
    { departure_time: '18:30', vehicle_name: 'Safari Express', plate_number: 'KDC 330C', fare_adjust: 150, amenities: ['WiFi', 'AC', 'Charging', 'Snacks'] },
  ];

  const departures: Departure[] = [];
  for (const route of routes) {
    for (let day = 0; day < 30; day++) {
      for (const t of trips) {
        departures.push({
          id: uid('dep'),
          route_id: route.id,
          departure_date: isoDate(day),
          departure_time: t.departure_time,
          vehicle_name: t.vehicle_name,
          plate_number: t.plate_number,
          total_seats: 10,
          fare: route.base_fare + t.fare_adjust,
          amenities: t.amenities,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  return { routes, departures, bookings: [] };
}

async function ensureSeeded(): Promise<void> {
  const idb = await openDb();
  const data = await readAll(idb);
  const needsSeed = data.routes.length === 0 || data.departures.some((d) => d.vehicle_name !== 'Safari Express');
  if (needsSeed) {
    const fresh = seedData();
    await writeAll(idb, fresh);
  }
}

export const db = {
  async listRoutes(): Promise<Route[]> {
    await ensureSeeded();
    return read((d) => [...d.routes].sort((a, b) => Number(b.popular) - Number(a.popular) || a.origin.localeCompare(b.origin)));
  },

  async listDepartures(routeId: string): Promise<Departure[]> {
    await ensureSeeded();
    const today = isoDate(0);
    return read((d) =>
      d.departures
        .filter((dep) => dep.route_id === routeId && dep.departure_date >= today)
        .sort((a, b) => a.departure_date.localeCompare(b.departure_date) || a.departure_time.localeCompare(b.departure_time)),
    );
  },

  async listDeparturesForDate(routeId: string, date: string): Promise<Departure[]> {
    await ensureSeeded();
    return read((d) =>
      d.departures
        .filter((dep) => dep.route_id === routeId && dep.departure_date === date)
        .sort((a, b) => a.departure_time.localeCompare(b.departure_time)),
    );
  },

  async listAvailableDates(routeId: string): Promise<string[]> {
    await ensureSeeded();
    const today = isoDate(0);
    return read((d) =>
      Array.from(
        new Set(
          d.departures
            .filter((dep) => dep.route_id === routeId && dep.departure_date >= today)
            .map((dep) => dep.departure_date),
        ),
      ).sort(),
    );
  },

  async listBookedSeats(departureId: string): Promise<number[]> {
    await ensureSeeded();
    return read((d) =>
      d.bookings
        .filter((b) => b.departure_id === departureId && b.status === 'confirmed')
        .map((b) => b.seat_number),
    );
  },

  async createBooking(input: {
    departure_id: string;
    seat_number: number;
    passenger_name: string;
    passenger_phone: string;
    payment_method: string;
    payment_ref: string;
  }): Promise<{ id: string }> {
    await ensureSeeded();
    const id = uid('booking');
    let conflict = false;
    await mutate((data) => {
      const exists = data.bookings.some(
        (b) => b.departure_id === input.departure_id && b.seat_number === input.seat_number && b.status === 'confirmed',
      );
      if (exists) {
        conflict = true;
        return;
      }
      data.bookings.push({
        id,
        departure_id: input.departure_id,
        seat_number: input.seat_number,
        passenger_name: input.passenger_name,
        passenger_phone: input.passenger_phone,
        payment_method: input.payment_method,
        payment_ref: input.payment_ref,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      });
    });
    if (conflict) {
      throw { code: '23505', message: 'Seat already booked' };
    }
    return { id };
  },

  async getBooking(id: string): Promise<{ booking: Booking; departure: Departure; route: Route } | null> {
    await ensureSeeded();
    return read((d) => {
      const booking = d.bookings.find((b) => b.id === id);
      if (!booking) return null;
      const departure = d.departures.find((dep) => dep.id === booking.departure_id);
      if (!departure) return null;
      const route = d.routes.find((r) => r.id === departure.route_id);
      if (!route) return null;
      return { booking, departure, route };
    });
  },
};
