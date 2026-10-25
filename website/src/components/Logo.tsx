// Mark: a table whose header is the accent, rows fading out
export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <rect x="7" y="8" width="18" height="4" rx="1.5" fill="#fff" />
      <rect x="7" y="14" width="7" height="3" rx="1.5" fill="#fff" opacity=".85" />
      <rect x="16" y="14" width="9" height="3" rx="1.5" fill="#fff" opacity=".85" />
      <rect x="7" y="19" width="7" height="3" rx="1.5" fill="#fff" opacity=".6" />
      <rect x="16" y="19" width="9" height="3" rx="1.5" fill="#fff" opacity=".6" />
    </svg>
  );
}
