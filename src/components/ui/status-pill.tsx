type Tone = "neutral" | "green" | "orange" | "red" | "blue";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-label-2",
  green: "bg-green/15 text-green",
  orange: "bg-orange/15 text-orange",
  red: "bg-red/15 text-red",
  blue: "bg-blue/15 text-blue",
};

export function StatusPill({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
