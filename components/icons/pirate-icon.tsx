interface PirateIconProps {
  className?: string
}

export function PirateIcon({ className = "w-6 h-6" }: PirateIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Head circle */}
      <circle cx="12" cy="10" r="4" />
      {/* Pirate hat */}
      <path d="M8 6 L12 4 L16 6" />
      <path d="M7 6 L17 6 L16 8 L8 8 Z" />
      {/* Eye patch */}
      <line x1="10" y1="9" x2="11" y2="9" />
      {/* Body */}
      <path d="M12 14 L12 18" />
      <path d="M12 16 L9 18" />
      <path d="M12 16 L15 18" />
    </svg>
  )
}
