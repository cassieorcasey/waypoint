/** Tanda Waypoint: jalur vertikal dengan tiga titik singgah, titik tengah bercincin. */
export const Logo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo">
    <defs>
      <linearGradient id="wp-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="var(--amber)" />
        <stop offset="1" stopColor="var(--teal)" />
      </linearGradient>
    </defs>
    <rect width="64" height="64" rx="16" fill="var(--logo-bg)" />
    <path d="M32 10v44" stroke="var(--logo-line)" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="32" cy="14" r="4.5" fill="var(--teal)" />
    <circle cx="32" cy="32" r="10" fill="var(--logo-bg)" stroke="url(#wp-g)" strokeWidth="4.5" />
    <circle cx="32" cy="50" r="4.5" fill="var(--logo-line)" />
  </svg>
);
