import { useEffect, useState } from 'react';
import { Star, MapPin, Loader as Loader2 } from 'lucide-react';
import { db, type PassengerReview } from '@/lib/db';
import { formatDate } from '@/lib/format';

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function Stars({ rating, label }: { rating: number; label: string }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
        />
      ))}
    </div>
  );
}

export function PassengerReviews() {
  const [reviews, setReviews] = useState<PassengerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await db.listPassengerReviews();
        if (active) setReviews(data);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not load reviews');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
        We couldn't load passenger reviews right now.
      </p>
    );
  }

  if (reviews.length === 0) return null;

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section aria-labelledby="reviews-heading" className="mt-16">
      <div className="mb-8 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Passenger reviews</p>
          <h2 id="reviews-heading" className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            What our passengers say
          </h2>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 shadow-sm">
          <span className="text-2xl font-bold text-slate-900">{average.toFixed(1)}</span>
          <div>
            <Stars rating={Math.round(average)} label={`Average rating ${average.toFixed(1)} out of 5`} />
            <p className="mt-0.5 text-xs text-slate-500">from {reviews.length} trips</p>
          </div>
        </div>
      </div>

      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review, idx) => (
          <li
            key={review.id}
            className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-slide-up"
            style={{ animationDelay: `${idx * 0.06}s` }}
          >
            <Stars rating={review.rating} label={`${review.rating} out of 5 stars`} />
            <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">&ldquo;{review.comment}&rdquo;</p>
            <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
              <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-teal-600 text-sm font-bold text-white">
                {initials(review.passenger_name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{review.passenger_name}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{review.route_label}</span>
                  <span aria-hidden>·</span>
                  <span className="whitespace-nowrap">{formatDate(review.travelled_on)}</span>
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
