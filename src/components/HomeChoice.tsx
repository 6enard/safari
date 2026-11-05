import { Bus, Package, ArrowRight, Sparkles } from 'lucide-react';
import { PassengerReviews } from '@/components/PassengerReviews';
import { PhotoBackdrop } from '@/components/PhotoBackdrop';

type Props = {
  onBookTrip: () => void;
  onSendParcel: () => void;
};

export function HomeChoice({ onBookTrip, onSendParcel }: Props) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="relative mb-12 overflow-hidden rounded-3xl bg-brand-900 px-6 py-14 text-center text-white shadow-2xl shadow-brand-900/30 sm:px-12 sm:py-20">
        <PhotoBackdrop />
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-400/30 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-brand-300/20 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-96 -translate-x-1/2 rounded-full bg-brand-300/10 blur-2xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-sm animate-fade-in">
            <Sparkles className="h-4 w-4" /> Welcome to South Rift Luxury Shuttle
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight animate-slide-up sm:text-6xl">
            What would you like to do?
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-brand-50/90 animate-slide-up animate-delay-100 sm:text-lg">
            Book a seat for your next trip, or send a parcel across Kenya.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <button
          type="button"
          onClick={onBookTrip}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-8 text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-900/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 animate-slide-up"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand-500 to-brand-600 transition-transform duration-500 group-hover:scale-x-100" />

          <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 transition-transform duration-300 group-hover:scale-110">
            <Bus className="h-8 w-8" />
          </span>

          <h2 className="mt-6 text-2xl font-bold text-slate-900">Book a trip</h2>
          <p className="mt-2 text-sm text-slate-600">
            Pick a route, choose your seat, and pay in seconds. No queues, no hassle.
          </p>

          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
            Get started
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-brand-600 group-hover:text-white">
              <ArrowRight className="h-4 w-4" />
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={onSendParcel}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-8 text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-xl hover:shadow-brand-900/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 animate-slide-up animate-delay-100"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand-500 to-brand-600 transition-transform duration-500 group-hover:scale-x-100" />

          <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 transition-transform duration-300 group-hover:scale-110">
            <Package className="h-8 w-8" />
          </span>

          <h2 className="mt-6 text-2xl font-bold text-slate-900">Send a parcel</h2>
          <p className="mt-2 text-sm text-slate-600">
            Send packages across Kenya with tracked delivery. Simple, fast, and reliable.
          </p>

          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
            Get started
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-brand-600 group-hover:text-white">
              <ArrowRight className="h-4 w-4" />
            </span>
          </span>
        </button>
      </div>

      <PassengerReviews />
    </div>
  );
}
