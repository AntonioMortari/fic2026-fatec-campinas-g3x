// "Ana Paula Souza" -> "Ana S.": enough for a person to recognise their own sign-up on a page that anyone holding the link opens.
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]! : '';
  return last ? `${first} ${last.charAt(0).toLocaleUpperCase('pt-BR')}.` : first;
}
