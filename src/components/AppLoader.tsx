type Props = {
  /** Smaller version for use inside a page (e.g. while a screen loads). */
  inline?: boolean;
};

/** Branded loading screen: the shuttle drives along a moving road. */
export function AppLoader({ inline = false }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={
        inline
          ? 'flex flex-col items-center justify-center px-6 py-20'
          : 'flex min-h-screen flex-col items-center justify-center bg-white px-6'
      }
    >
      <div className="loader-fade-in w-[min(78vw,360px)]">
        <img
          src="/assets/images/logo-van.webp"
          alt="South Rift Luxury Shuttle"
          width={900}
          height={328}
          className="loader-van block h-auto w-full select-none"
          draggable={false}
        />
        <div className="loader-road -mt-1" aria-hidden="true" />
      </div>
      <p className="loader-fade-in mt-7 flex items-center gap-1 text-sm font-semibold tracking-wide text-slate-500">
        Getting your trip ready
        <span className="loader-dot" style={{ animationDelay: '0s' }}>.</span>
        <span className="loader-dot" style={{ animationDelay: '0.15s' }}>.</span>
        <span className="loader-dot" style={{ animationDelay: '0.3s' }}>.</span>
      </p>
    </div>
  );
}
