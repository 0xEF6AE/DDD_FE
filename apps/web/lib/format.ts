const PHONE_MAX_DIGITS = 11;
const BIRTH_DIGITS = 8;

/** 입력 도중에도 숫자만 뽑아 `010-0000-0000` 형태로 맞춘다. (01082409930 → 010-8240-9930) */
export function formatPhoneInput(value: string): string {
  // +82 10-… 형태로 붙여넣어도 국내 표기(010-…)로 맞춘다.
  const digits = value.replace(/\D/g, "").replace(/^82/, "0").slice(0, PHONE_MAX_DIGITS);
  if (digits.length <= 3) return digits;

  const head = digits.slice(0, 3);
  const middleLength = digits.length > 10 ? 4 : 3;
  const middle = digits.slice(3, 3 + middleLength);
  const tail = digits.slice(3 + middleLength);

  return tail ? `${head}-${middle}-${tail}` : `${head}-${middle}`;
}

/** 입력 도중에도 숫자만 뽑아 `YYYY / MM / DD` 형태로 맞춘다. (19990101 → 1999 / 01 / 01) */
export function formatBirthInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, BIRTH_DIGITS);
  if (digits.length <= 4) return digits;

  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);

  return day ? `${year} / ${month} / ${day}` : `${year} / ${month}`;
}

export function birthInputToApiDate(birth: string): string | undefined {
  const digits = birth.replace(/\D/g, "");
  if (digits.length !== BIRTH_DIGITS) return undefined;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
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
