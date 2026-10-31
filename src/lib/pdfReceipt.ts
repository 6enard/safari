import { jsPDF } from 'jspdf';
import type { Booking, Departure, Route } from '@/lib/db';
import { formatKes, formatDate, formatTime, formatDateTime } from '@/lib/format';

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
  const margin = 40;
  let y = 50;

  // Header band
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, pageWidth, 80, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('South Rift Luxury Shuttle', margin, 35);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('Booking Receipt', margin, 55);
  doc.setFontSize(10);
  doc.text(formatDateTime(first.created_at), pageWidth - margin, 55, { align: 'right' });

  y = 110;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Receipt No.', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.text(paymentRef, margin + 110, y);

  y += 10;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 25;

  const rows: [string, string][] = [
    ['Route', `${route.origin} - ${route.destination}`],
    ['Matatu', `${departure.vehicle_name} (${departure.plate_number})`],
    ['Date', formatDate(departure.departure_date)],
    ['Departure', formatTime(departure.departure_time)],
    ['Passenger', first.passenger_name],
    ['Phone', first.passenger_phone],
    ['Payment method', first.payment_method],
  ];

  doc.setFontSize(11);
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(value, margin + 140, y);
    y += 22;
  }

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text('Seats', margin, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const seatsText = bookings.map((b) =>
    b.status === 'cancelled' ? `Seat ${b.seat_number} (cancelled)` : `Seat ${b.seat_number}`,
  );
  doc.text(seatsText.join(',  '), margin, y, { maxWidth: pageWidth - margin * 2 });
  y += 25;

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 25;

  const fareLine = `${activeBookings.length} ${activeBookings.length === 1 ? 'seat' : 'seats'} x ${formatKes(departure.fare)}`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(fareLine, margin, y);
  y += 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105);
  doc.text('Amount paid', margin, y);
  doc.text(formatKes(totalFare), pageWidth - margin, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Show this receipt to the conductor before boarding. South Rift Luxury Shuttle.',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 30,
    { align: 'center' },
  );

  doc.save(`receipt-${paymentRef}.pdf`);
}
