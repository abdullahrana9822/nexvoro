export type SocialNetwork = "instagram" | "x" | "youtube" | "linkedin";

/**
 * Inline brand glyphs. The icon library no longer ships brand logos, and using
 * hand-written paths keeps the footer free of third-party asset requests.
 */
export function SocialIcon({
  network,
  className = "size-4",
}: {
  network: SocialNetwork;
  className?: string;
}) {
  const paths: Record<SocialNetwork, React.ReactNode> = {
    instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </>
    ),
    x: <path d="M4 4l7.2 9.1L4.6 20h2.3l5.5-5.9 4.7 5.9H20l-7.4-9.3L19.4 4h-2.3l-4.9 5.3L8 4H4z" fill="currentColor" stroke="none" />,
    youtube: (
      <>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
        <path d="M10.5 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
      </>
    ),
    linkedin: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M8 10.5v6M8 7.5v.01M12 16.5v-3.2a2 2 0 0 1 4 0v3.2" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      focusable="false"
    >
      {paths[network]}
    </svg>
  );
}
