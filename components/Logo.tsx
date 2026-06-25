interface LogoProps {
  /** Rendered square size in px (default 20). */
  size?: number;
  className?: string;
  title?: string;
}

/**
 * The Glance brand mark (orange tile + magnifier), mirroring `assets/logo.svg`
 * from which the extension icons are generated. Used for in-app branding.
 */
export function Logo({ size = 20, className, title = 'Glance' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <linearGradient
          id="glance-logo-bg"
          x1="16"
          y1="12"
          x2="112"
          y2="116"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ffb43c" />
          <stop offset="0.55" stopColor="#f59000" />
          <stop offset="1" stopColor="#e07400" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="112" height="112" rx="28" fill="url(#glance-logo-bg)" />
      <g stroke="#ffffff" strokeLinecap="round" fill="none">
        <circle cx="54" cy="54" r="25" strokeWidth="9" />
        <line x1="72.5" y1="72.5" x2="92" y2="92" strokeWidth="11" />
      </g>
      <g strokeLinecap="round">
        <line x1="44" y1="48" x2="66" y2="48" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="4.5" />
        <line x1="44" y1="60" x2="64" y2="60" stroke="#ffffff" strokeWidth="5.5" />
      </g>
    </svg>
  );
}
