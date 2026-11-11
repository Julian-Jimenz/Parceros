import type { CategoryId } from "@/lib/config/event";

type InscriptionParams = {
  categoria?: CategoryId;
  jersey?: boolean;
};

/** Query en URL real (?categoria=) + ancla; compatible con recarga y useSearchParams. */
export function inscriptionHref(params?: InscriptionParams): string {
  const qs = new URLSearchParams();
  if (params?.categoria) qs.set("categoria", params.categoria);
  if (params?.jersey) qs.set("jersey", "1");
  const query = qs.toString();
  return query ? `/?${query}#inscripcion` : "/#inscripcion";
}

export function parseInscriptionParams(
  searchParams: URLSearchParams,
  hash?: string,
): { categoria: string | null; jersey: boolean } {
  let categoria = searchParams.get("categoria");
  let jersey = searchParams.get("jersey") === "1";

  if (hash?.includes("?")) {
    const legacy = new URLSearchParams(hash.split("?")[1] ?? "");
    categoria = categoria ?? legacy.get("categoria");
    if (!jersey) jersey = legacy.get("jersey") === "1";
  }

  return { categoria, jersey };
}

export function isValidCategoryId(value: string | null): value is CategoryId {
  return (
    value === "open-hombres" ||
    value === "open-mujeres" ||
    value === "recreativa-hombres" ||
    value === "recreativa-mujeres"
  );
}
