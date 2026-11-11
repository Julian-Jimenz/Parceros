import { EVENT } from "@/lib/config/event";

const EVENT_PARTS = EVENT.dateIso.split("-").map(Number) as [number, number, number];

export function ageAtEventDate(birthDateIso: string): number | null {
  if (!birthDateIso) return null;
  const parts = birthDateIso.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;

  const [by, bm, bd] = parts;
  const [ey, em, ed] = EVENT_PARTS;

  let age = ey - by;
  if (em < bm || (em === bm && ed < bd)) age -= 1;
  return age;
}

export function isAdultAtEvent(birthDateIso: string): boolean {
  const age = ageAtEventDate(birthDateIso);
  if (age === null) return false;
  return age >= 18;
}
