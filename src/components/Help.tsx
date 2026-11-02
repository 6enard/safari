import { ArrowLeft, Bell, CircleHelp, MapPin, Package, Ticket, UserRound, Wallet } from 'lucide-react';

type Props = {
  onBack: () => void;
  onBookTrip: () => void;
  onSendParcel: () => void;
};

const BOOKING_STEPS = [
  { title: 'Choose your route', text: 'Pick where you are travelling from and to. Popular routes are listed first.' },
  { title: 'Pick a date and departure', text: 'Select a travel date, then choose the departure time that suits you.' },
  { title: 'Select your seats', text: 'Tap the seats you want on the seat map. You can book up to 10 seats in one go.' },
  { title: 'Enter passenger details and pay', text: 'Add the passenger name and phone number, then pay with M-Pesa.' },
  { title: 'Get your receipt', text: 'Your booking is confirmed straight away. Find every trip and download receipts under My bookings.' },
];

const PARCEL_STEPS = [
  { title: 'Open Parcels and tap Send new', text: 'The send form opens first, so you can start a parcel straight away.' },
  { title: 'Set the route and pickup point', text: 'Choose the route, then tell us where the parcel is collected and where it should be dropped off.' },
  { title: 'Add sender and recipient details', text: 'Enter names and phone numbers for both people so the driver can reach them.' },
  { title: 'Describe the parcel', text: 'Give a short description, the approximate weight, and the type of parcel. This sets the delivery fee.' },
  { title: 'Confirm and keep your tracking number', text: 'You receive a tracking number. Follow the parcel status under My parcels.' },
];

const FAQS = [
  {
    question: 'Do I need an account to book a trip?',
    answer: 'Yes. Sign in first so your bookings and parcels are saved to your account and appear under My bookings and My parcels.',
  },
  {
    question: 'How do I pay for my seats?',
    answer: 'Payment is made with M-Pesa during checkout. Your seats are confirmed once payment goes through, and the receipt is shown on screen.',
  },
  {
    question: 'Can I see or download my receipt later?',
    answer: 'Yes. Open My bookings, find the trip, and download the receipt as a PDF at any time.',
  },
  {
    question: 'How do I cancel a booking?',
    answer: 'Open My bookings and open the trip. If a trip is cancelled, the reason and refund status are shown on that booking.',
  },
  {
    question: 'Will I be reminded before my trip leaves?',
    answer: 'Yes. While the app is open, you will get a reminder 30 minutes and 5 minutes before the departure time of each confirmed trip.',
  },
  {
    question: 'Can I change my profile photo?',
    answer: 'Yes. Open your profile and tap your photo to choose a new one. Use a clear picture of yourself; it will be cropped to a square.',
  },
  {
    question: 'Why can I not see the Admin console?',
    answer: 'The Admin console is only for verified administrators. Verify your email address from your profile page to unlock it.',
  },
  {
    question: 'Can I delete a parcel I sent?',
    answer: 'Parcels that are still pending or have been cancelled can be deleted. Parcels already in transit or delivered cannot.',
  },
];

function StepList({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-4">
          <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
            {index + 1}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="font-semibold text-slate-900">{step.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Help({ onBack, onBookTrip, onSendParcel }: Props) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <button
        type="button"
        onClick={onBack}
        className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to home
      </button>

      <div className="mb-10 animate-slide-up">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-brand-100">
          <CircleHelp className="h-3.5 w-3.5" /> Help centre
        </span>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">How can we help?</h1>
        <p className="mt-1 max-w-2xl text-slate-600">
          Learn how to book a seat, send a parcel, and find answers to the questions travellers ask most.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="help-booking" className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm animate-slide-up">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 id="help-booking" className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Ticket className="h-5 w-5 text-brand-600" /> Book a trip
            </h2>
          </div>
          <StepList steps={BOOKING_STEPS} />
          <button
            type="button"
            onClick={onBookTrip}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/25 transition-all hover:brightness-110"
          >
            <Ticket className="h-4 w-4" /> Book a trip now
          </button>
        </section>

        <section aria-labelledby="help-parcel" className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm animate-slide-up animate-delay-100">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 id="help-parcel" className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Package className="h-5 w-5 text-brand-600" /> Send a parcel
            </h2>
          </div>
          <StepList steps={PARCEL_STEPS} />
          <button
            type="button"
            onClick={onSendParcel}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition-all hover:bg-brand-100"
          >
            <Package className="h-4 w-4" /> Send a parcel now
          </button>
        </section>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: MapPin, label: 'Pick-up points', text: 'Shown for each route' },
          { icon: Wallet, label: 'Payment', text: 'Paid with M-Pesa' },
          { icon: Bell, label: 'Reminders', text: '30 and 5 minutes before' },
          { icon: UserRound, label: 'Your profile', text: 'Name and photo' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 p-4">
              <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="truncate text-xs text-slate-500">{item.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      <section aria-labelledby="help-faq" className="mt-10">
        <h2 id="help-faq" className="mb-4 text-lg font-bold text-slate-900">Common questions</h2>
        <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group p-5 open:bg-brand-50/40">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 marker:hidden">
                {faq.question}
                <span className="text-brand-600 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
