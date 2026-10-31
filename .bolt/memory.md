# Project memory

## Product intent & audience

- Travel/transport booking app where users browse available routes and book trips.
- Bookings are per-user: each booking records which signed-in user made it.
- Bookings are currently stored locally in IndexedDB (browser-only), not in the shared Supabase database — so bookings don't sync across devices.
- Auth uses Firebase; database uses Supabase (schema exists, migrations present).

## Brand personality & voice

- Production-quality, polished, non-cookie-cutter design.
- Beautiful and fully featured, suitable for production deployment.

## Visual design & UX direction

- Tech stack: Vite + React (JSX), Tailwind CSS, lucide-react icons, `@/` path alias to `src/`.
- Avoid installing additional UI/theme/icon packages unless necessary.
- My Bookings page: should show user's bookings grouped by receipt, separated into upcoming and past trips.
- Available routes section: styling needs improvement — user flagged current design as insufficient; aim for a more refined, visually appealing layout.

## Decisions, constraints & rationale

- Booking data model extended to include an `owner`/user ID field on each booking so bookings can be tied to signed-in users.
- Payment step was updated to save the signed-in user with each booking.
- A data-layer query returns a user's bookings grouped by receipt.
- Bookings made before the owner field was added have no owner and won't appear on the My Bookings page.
- Moving bookings to Supabase for cross-device sync would require auth setup changes — not yet scoped.

## Open questions & assumptions

- My Bookings page UI is not yet built (edit budget ran out).
- Navigation links to My Bookings (header button, account menu) are not yet wired.
- Available routes section restyling is not yet started.
- Assumption: Firebase auth provides a stable user ID usable as booking owner; Supabase schema may need a matching column if bookings move there.
- Open: should bookings migrate from IndexedDB to Supabase to enable cross-device visibility? Needs decision and scoping.