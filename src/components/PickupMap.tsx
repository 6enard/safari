import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type MapMarker = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  label?: string;
  highlighted?: boolean;
};

type Props = {
  markers: MapMarker[];
  fitKey: string;
  onMapClick?: (latitude: number, longitude: number) => void;
  className?: string;
};

const KENYA_CENTER: L.LatLngExpression = [-0.6, 36.2];

function markerIcon(label: string, highlighted: boolean) {
  const tone = highlighted ? 'bg-slate-900 ring-amber-400' : 'bg-brand-600 ring-white';
  return L.divIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `<div class="flex h-8 w-8 items-center justify-center rounded-full ring-4 ${tone} text-xs font-bold text-white shadow-lg">${label}</div>`,
  });
}

export function PickupMap({ markers, fitKey, onMapClick, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const clickRef = useRef(onMapClick);

  useEffect(() => {
    clickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { center: KENYA_CENTER, zoom: 6, scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    const layer = L.layerGroup().addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => clickRef.current?.(e.latlng.lat, e.latlng.lng));
    mapRef.current = map;
    layerRef.current = layer;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    markers.forEach((m, index) => {
      L.marker([m.latitude, m.longitude], {
        icon: markerIcon(m.label ?? String(index + 1), Boolean(m.highlighted)),
        title: m.name,
        keyboard: false,
      })
        .bindTooltip(m.name, { direction: 'top', offset: [0, -16] })
        .addTo(layer);
    });
  }, [markers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.latitude, m.longitude] as L.LatLngTuple));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14, animate: true });
    // Re-fit only when fitKey changes so editing one stop does not move the view.
  }, [fitKey]);

  return <div ref={containerRef} className={className} />;
}
