export function PhotoBackdrop() {
  return (
    <>
      <img
        src="/assets/images/OPTION_6_page-0001.jpg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-600/90 via-brand-700/85 to-brand-900/90" />
    </>
  );
}
