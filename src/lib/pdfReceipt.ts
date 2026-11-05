import { jsPDF } from 'jspdf';
import type { Booking, Departure, Route, Parcel } from '@/lib/db';
import { formatKes, formatDate, formatTime, formatDateTime } from '@/lib/format';

const BRAND_NAME = 'South Rift Luxury Shuttle';
const MARGIN = 44;

const NAVY: [number, number, number] = [17, 45, 78];
const DEEP: [number, number, number] = [12, 36, 64];
const BLUE: [number, number, number] = [63, 114, 175];
const MIST: [number, number, number] = [219, 226, 239];
const PAPER: [number, number, number] = [249, 247, 247];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];
const RULE: [number, number, number] = [198, 211, 230];

function drawHeader(doc: jsPDF, title: string, dateText: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 96, 'F');
  doc.setFillColor(...BLUE);
  doc.rect(0, 96, pageWidth, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(BRAND_NAME, MARGIN, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...MIST);
  doc.text(title, MARGIN, 64);
  doc.setFontSize(10);
  doc.text(dateText, pageWidth - MARGIN, 64, { align: 'right' });
}

function drawRefBox(doc: jsPDF, y: number, label: string, value: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...MIST);
  doc.roundedRect(MARGIN, y, pageWidth - MARGIN * 2, 56, 8, 8, 'F');
  doc.setTextColor(...BLUE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(label.toUpperCase(), MARGIN + 16, y + 22);
  doc.setTextColor(...NAVY);
  doc.setFontSize(16);
  doc.text(value, MARGIN + 16, y + 42);
}

function drawRule(doc: jsPDF, y: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y, pageWidth - MARGIN, y);
}

function drawRows(doc: jsPDF, y: number, rows: [string, string][]): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFontSize(11);
  for (const [label, value] of rows) {
    if (y > doc.internal.pageSize.getHeight() - 110) {
      doc.addPage();
      y = 60;
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...MUTED);
    doc.text(label, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...INK);
    doc.text(String(value), MARGIN + 140, y, { maxWidth: pageWidth - MARGIN * 2 - 140 });
    y += 24;
  }
  return y;
}

function drawFooter(doc: jsPDF, text: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  drawRule(doc, pageHeight - 64);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(text, pageWidth / 2, pageHeight - 44, { align: 'center' });
}

function drawAmountBox(doc: jsPDF, y: number, caption: string, label: string, amount: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PAPER);
  doc.setDrawColor(...RULE);
  doc.roundedRect(MARGIN, y, pageWidth - MARGIN * 2, 80, 8, 8, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(caption, MARGIN + 16, y + 26);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...DEEP);
  doc.text(label, MARGIN + 16, y + 60);
  doc.setFontSize(22);
  doc.setTextColor(...NAVY);
  doc.text(amount, pageWidth - MARGIN - 16, y + 60, { align: 'right' });
}

export function downloadReceiptPDF(opts: {
  bookings: Booking[];
  departure: Departure;
  route: Route;
  paymentRef: string;
}) {
  const { bookings, departure, route, paymentRef } = opts;
  const activeBookings = bookings.filter((b) => b.status !== 'cancelled');
  const totalFare = departure.fare * activeBookings.length;
  const first = bookings[0];

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, 'Booking Receipt', formatDateTime(first.created_at));
  drawRefBox(doc, 124, 'Receipt No.', paymentRef);

  let y = drawRows(doc, 218, [
    ['Route', `${route.origin} - ${route.destination}`],
    ['Matatu', `${departure.vehicle_name} (${departure.plate_number})`],
    ['Date', formatDate(departure.departure_date)],
    ['Departure', formatTime(departure.departure_time)],
    ['Passenger', first.passenger_name],
    ['Phone', first.passenger_phone],
    ['Payment method', first.payment_method],
  ]);

  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  doc.text(bookings.length > 1 ? 'Seats' : 'Seat', MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...INK);
  const seatsText = bookings.map((b) =>
    b.status === 'cancelled' ? `${b.seat_number} (cancelled)` : `${b.seat_number}`,
  );
  doc.text(seatsText.join(', '), MARGIN + 140, y, { maxWidth: pageWidth - MARGIN * 2 - 140 });
  y += 26;

  drawRule(doc, y);
  y += 28;

  const fareLine = `${activeBookings.length} ${activeBookings.length === 1 ? 'seat' : 'seats'} x ${formatKes(departure.fare)}`;
  drawAmountBox(doc, y, fareLine, 'Amount paid', formatKes(totalFare));

  drawFooter(doc, `Show this receipt to the conductor before boarding. ${BRAND_NAME}.`);

  doc.save(`receipt-${paymentRef}.pdf`);
}

export function downloadParcelReceiptPDF(opts: {
  parcel: Parcel;
}) {
  const { parcel } = opts;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  drawHeader(doc, 'Parcel Receipt', formatDateTime(parcel.created_at));
  drawRefBox(doc, 124, 'Tracking No.', parcel.tracking_number);

  const dep = parcel.departures;
  const rows: [string, string][] = [
    ['Pickup', parcel.pickup_location],
    ['Drop-off', parcel.dropoff_location],
    ['Sender', parcel.sender_name],
    ['Sender phone', parcel.sender_phone],
    ['Recipient', parcel.recipient_name],
    ['Recipient phone', parcel.recipient_phone],
    ['Contents', parcel.description],
    ['Parcel type', parcel.parcel_type],
    ['Weight', `${parcel.weight_kg} kg`],
  ];
  if (dep) {
    rows.push(
      ['Travel date', formatDate(dep.departure_date)],
      ['Departure time', formatTime(dep.departure_time)],
    );
    if (dep.vehicles) {
      rows.push(['Matatu', `${dep.vehicles.vehicle_name} (${dep.vehicles.plate_number})`]);
    }
  }

  let y = drawRows(doc, 218, rows);
  y += 14;
  drawRule(doc, y);
  y += 28;

  drawAmountBox(doc, y, 'Parcel delivery', 'Delivery fee', formatKes(parcel.fee));

  drawFooter(doc, `Keep this receipt to track and collect your parcel. ${BRAND_NAME}.`);

  doc.save(`parcel-${parcel.tracking_number}.pdf`);
}
