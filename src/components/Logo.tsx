/** Tanda Waypoint: jalur vertikal dengan tiga titik singgah, titik tengah bercincin. Latar transparan. */
export const Logo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo">
    <circle cx="32" cy="9" r="5" fill="var(--logo-ink)" />
    <circle cx="32" cy="32" r="12" fill="none" stroke="var(--logo-ink)" strokeWidth="5.5" />
    <circle cx="32" cy="55" r="5" fill="var(--logo-ink)" />
  </svg>
);
