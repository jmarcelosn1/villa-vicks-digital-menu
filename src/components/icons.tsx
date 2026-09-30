/** Ponto separador da tagline BURGER • PIZZA • GRILL */
export function Dot({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-block size-[0.32em] translate-y-[-0.12em] rounded-full bg-vred align-middle ${className}`} />;
}
