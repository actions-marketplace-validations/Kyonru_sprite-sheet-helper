/**
 * Minimal stroke icon set for the lab, matching the lucide shapes the app
 * already uses so the mock reads like the real thing.
 */
type IconProps = { size?: number; style?: React.CSSProperties };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  style: { display: "block", flexShrink: 0 },
});

export function IconMenu({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}
export function IconBox({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  );
}
export function IconCamera({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
export function IconSun({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
    </svg>
  );
}
export function IconPalette({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="M12 22a10 10 0 1 1 10-10c0 1.7-1.3 3-3 3h-2a2 2 0 0 0-1.4 3.4A2 2 0 0 1 14 22Z" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" />
      <circle cx="16.5" cy="10.5" r="1" fill="currentColor" />
    </svg>
  );
}
export function IconSparkles({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="m12 3 1.9 4.8L18.7 9.7l-4.8 1.9L12 16.4l-1.9-4.8L5.3 9.7l4.8-1.9Z" />
      <path d="M19 15v4M17 17h4" />
    </svg>
  );
}
export function IconPerson({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v6M9 21l3-8 3 8M6 11h12" />
    </svg>
  );
}
export function IconWorkflow({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <path d="M10 6.5h3a2 2 0 0 1 2 2V14" />
    </svg>
  );
}
export function IconHelp({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}
export function IconUndo({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="M3 7v6h6" />
      <path d="M3 13a9 9 0 1 0 3-7.7L3 8" />
    </svg>
  );
}
export function IconRedo({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="M21 7v6h-6" />
      <path d="M21 13a9 9 0 1 1-3-7.7L21 8" />
    </svg>
  );
}
export function IconPlus({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
export function IconPlay({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="m6 3 14 9-14 9Z" />
    </svg>
  );
}
export function IconPause({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="M7 4v16M17 4v16" />
    </svg>
  );
}
export function IconCheck({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="m4 12 5 5L20 6" />
    </svg>
  );
}

export function IconLoop({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
export function IconPencil({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}
export function IconChevronLeft({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
export function IconChevronRight({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
export function IconAlert({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

export function IconLayers({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <path d="m12 2 9 5-9 5-9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  );
}

export function IconArchive({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <rect x="2" y="3" width="20" height="5" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  );
}
export function IconFilm({ size = 15, style }: IconProps) {
  return (
    <svg {...base(size)} style={{ ...base(size).style, ...style }}>
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path d="M7 3v18M17 3v18M2 9h5M2 15h5M17 9h5M17 15h5" />
    </svg>
  );
}
