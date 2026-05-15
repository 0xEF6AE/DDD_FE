export function birthInputToApiDate(birth: string): string | undefined {
  const match = birth.trim().match(/^(\d{4})[/.-](\d{2})[/.-](\d{2})$/);
  if (!match) return undefined;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

/** OpenAPI `applicantPhone` 패턴(01x-…-xxxx)에 맞게 하이픈을 넣는다. */
export function formatApplicantPhoneKorea(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 11 && /^01[0-9]/.test(digits)) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
  if (digits.length === 10 && /^01[0-9]/.test(digits)) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  return trimmed;
}
