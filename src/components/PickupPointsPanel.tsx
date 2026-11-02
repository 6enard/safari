import { useEffect, useMemo, useState } from 'react';
import { Loader as Loader2, MapPin } from 'lucide-react';
import { db, type PickupPoint } from '@/lib/db';
import { PickupMap } from '@/components/PickupMap';

type Props = {
  routeId: string;
};

export function PickupPointsPanel({ routeId }: Props) {
  const [points, setPoints] = useState<PickupPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await db.listPickupPoints(routeId);
        if (!active) return;
        setPoints(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Could not load boarding points.');
      }
    })();
    return () => {
      active = false;
    };
  }, [routeId]);

  const markers = useMemo(
    () =>
      (points ?? []).map((p) => ({ id: p.id, name: p.name, latitude: p.latitude, longitude: p.longitude })),
    [points],
  );

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm animate-slide-up">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-brand-50 to-brand-100 px-6 py-4 text-sm font-semibold uppercase tracking-wide text-brand-800">
        <MapPin className="h-4 w-4" /> Where you board
      </div>

      {error && (
        <div role="alert" className="p-6 text-sm text-red-700">
          {error}
        </div>
      )}

      {!error && !points && (
        <div className="flex items-center justify-center py-14">
          <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
        </div>
      )}

      {!error && points && points.length === 0 && (
        <p className="p-6 text-sm text-slate-500">Boarding points for this route have not been added yet.</p>
      )}

      {!error && points && points.length > 0 && (
        <div>
          <PickupMap markers={markers} fitKey={routeId} className="h-64 w-full sm:h-80" />
          <ol className="divide-y divide-slate-100">
            {points.map((p, idx) => (
              <li key={p.id} className="flex items-start gap-4 px-6 py-4">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  {p.address && <p className="mt-0.5 text-sm text-slate-500">{p.address}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
