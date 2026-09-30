import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Terça a domingo, 18h às 23h30 — horário de Itapecuru-Mirim (MA), independente do fuso do visitante. */
const OPEN_MIN = 18 * 60;
const CLOSE_MIN = 23 * 60 + 30;
const CLOSED_DAY = 1; // segunda
const DAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function localParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Fortaleza", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  return { day: WEEKDAYS[get("weekday")] ?? 0, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

export function openStatus(date = new Date()) {
  const { day, minutes } = localParts(date);
  const openToday = day !== CLOSED_DAY;
  if (openToday && minutes >= OPEN_MIN && minutes < CLOSE_MIN) return { open: true, text: "Aberto agora, até 23h30" };
  if (openToday && minutes < OPEN_MIN) return { open: false, text: "Abre hoje às 18h" };
  const tomorrow = (day + 1) % 7;
  if (tomorrow !== CLOSED_DAY) return { open: false, text: "Abre amanhã às 18h" };
  return { open: false, text: `Abre ${DAY_NAMES[(day + 2) % 7]} às 18h` };
}

export function OpenStatus({ className }: { className?: string }) {
  const [status, setStatus] = useState(() => openStatus());
  useEffect(() => {
    const id = window.setInterval(() => setStatus(openStatus()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <p aria-live="polite" className={cn("inline-flex items-center gap-2 text-[0.88rem] text-bone/85", className)}>
      <span aria-hidden="true" className={cn("size-2 rounded-full", status.open ? "bg-[#3ecf6a] shadow-[0_0_0_4px_rgb(62_207_106/0.18)]" : "bg-white/35")} />
      {status.text}
    </p>
  );
}
