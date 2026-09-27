type ClassValue = string | false | null | undefined;

/** Minimal classnames joiner — keeps the UI primitives dependency-free. */
export function cx(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ');
}
