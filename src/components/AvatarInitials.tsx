const PALETTE = [
  { bg: "#FFD700", text: "#7a5c00" },
  { bg: "#F97316", text: "#7c2d12" },
  { bg: "#A855F7", text: "#3b0764" },
  { bg: "#14B8A6", text: "#042f2e" },
  { bg: "#EC4899", text: "#500724" },
  { bg: "#3B82F6", text: "#1e3a5f" },
];

function nameHash(name: string): number {
  return [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

const AvatarInitials = ({
  name,
  size = 40,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) => {
  const color = PALETTE[nameHash(name) % PALETTE.length];
  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  return (
    <div
      className={`flex-shrink-0 rounded-full flex items-center justify-center font-black select-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundColor: color.bg,
        color: color.text,
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
};

export default AvatarInitials;
