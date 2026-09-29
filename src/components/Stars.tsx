export default function Stars({ value }: { value: number | null }) {
  const n = Math.round(value ?? 0);
  return <span className="stars" aria-label={`${value} estrelas`}>{"★".repeat(n)}{"☆".repeat(5 - n)}</span>;
}
