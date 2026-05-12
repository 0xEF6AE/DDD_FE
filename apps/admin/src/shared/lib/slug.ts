/**
 * 한글 음절(가-힣) / ASCII 영문 / 숫자 / 언더스코어만 남기고
 * 그 외 문자(공백·특수문자·이모지·자모)는 단일 `_` 로 정규화한다.
 *
 * 빈 입력이나 모두 제거되는 입력은 `""` 를 돌려준다.
 * 결과의 유효성(빈 문자열·중복) 검증은 호출부 책임이다.
 */
export function slugify(input: string): string {
  const normalized = input.trim().normalize("NFC").toLowerCase()
  const replaced = normalized.replace(/[^가-힣a-z0-9_]+/g, " ")
  return replaced.trim().replace(/\s+/g, "_")
}
