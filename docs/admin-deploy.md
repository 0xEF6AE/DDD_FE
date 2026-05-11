# DDD 어드민 배포 — Vercel + 백엔드 연동 가이드 (단일 출처)

> 본 문서는 `apps/admin` 프론트엔드를 Vercel 에 배포하고 기존 백엔드와 연동하기 위한
> **단일 출처(single source of truth)** 다. 도메인 / CORS / 쿠키 / OAuth 관련 작업은 이 문서를 기준으로 한다.
>
> 인증 흐름 자체는 [docs/admin-auth.md](./admin-auth.md) 가 단일 출처. 본 문서는 **배포·도메인 컷오버**에 초점.

---

## 1. 도메인 매핑 (결정된 구도)

| 역할 | 도메인 | 비고 |
| ---- | ------ | ---- |
| 어드민 프론트 (Vercel) | `https://manage.dddstudy.kr` | 신규 배포 대상 |
| 백엔드 API | `https://admin.dddstudy.kr` | **현재 운영 중인 도메인 유지** |

- 두 도메인 모두 eTLD+1 이 `dddstudy.kr` 로 동일 → **same-site** → `SameSite=Lax` httpOnly 쿠키 그대로 동작.
- 백엔드 도메인은 그대로 두므로, 백엔드 쿠키 정책·OAuth Google Cloud 콘솔 redirect URI 는 **변경 불필요**.
- (향후 백엔드를 `api.dddstudy.kr` 로 옮길 계획이 잡히면 본 문서 §7 참고하여 컷오버.)

---

## 2. 백엔드 담당자에게 요청할 항목 (배포 전 필수)

별도 레포 작업이라 프론트에서는 변경 불가. 아래 3가지를 한 번에 전달한다.

### 2.1 CORS allow-origin 화이트리스트

```
https://manage.dddstudy.kr         # prod
https://*-ddd-admin.vercel.app     # Vercel preview (정규식 매칭으로)
http://localhost:5173              # local dev (이미 등록되어 있을 가능성 높음)
```

- `Access-Control-Allow-Credentials: true` 유지.
- preview 도메인 패턴은 Vercel 프로젝트 이름에 따라 달라진다 (예: `ddd-admin-git-<branch>-<team>.vercel.app`). 정확한 패턴은 첫 preview 배포 후 한 번 확인 후 전달.

### 2.2 `CLIENT_REDIRECT_URL` 환경변수 갱신

OAuth 콜백 완료 후 사용자가 돌아오는 프론트 주소.

```
CLIENT_REDIRECT_URL=https://manage.dddstudy.kr/
```

- dev 모드의 JSON 디버그 분기(`google-auth.controller.ts:80-83`) 는 prod 환경에서 비활성화 보장.

### 2.3 Google Cloud Console — 변경 없음 (확인만)

OAuth 클라이언트의 Authorized redirect URI 가 백엔드 콜백을 가리키고 있는지 확인.

```
https://admin.dddstudy.kr/api/v1/auth/google/callback
```

- 프론트 도메인은 OAuth redirect URI 와 무관 → 추가 등록 불필요.

### 2.4 (선택) 쿠키 / 보안 헤더 점검

prod 환경에서 다음이 활성화되어 있는지 확인 — 이미 되어있다면 회신만.

- `access_token`, `refresh_token` 모두 `httpOnly: true`, `secure: true`, `sameSite: 'lax'`
- `refresh_token` 의 path 가 `/api/v1/auth/refresh` 로 한정되어 있음
- `domain` 속성은 미설정(host-only) 권장

---

## 3. 프론트 측 변경 (이 레포)

### 3.1 환경변수

Vercel 콘솔의 **Environment Variables** (Production + Preview):

```
VITE_API_URL=https://admin.dddstudy.kr
VITE_MSW_ENABLED=false
```

- 로컬 개발용 `apps/admin/.env.local` 은 그대로 (`http://localhost:3000`).
- `VITE_API_URL` 누락 시 `main.tsx:12` 에서 즉시 throw.

### 3.2 `apps/admin/vercel.json` 신규

SPA fallback + 어드민 비노출 헤더.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Robots-Tag", "value": "noindex, nofollow" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### 3.3 `apps/admin/public/robots.txt` 신규

```
User-agent: *
Disallow: /
```

### 3.4 `apps/admin/index.html` `<head>` 에 meta 추가

```html
<meta name="robots" content="noindex, nofollow" />
```

---

## 4. Vercel 프로젝트 설정

| 항목 | 값 |
| ---- | --- |
| Framework Preset | Vite (또는 Other) |
| **Root Directory** | `apps/admin` |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |
| Build Command | `pnpm --filter @ddd/admin build` |
| Output Directory | `dist` |
| Node Version | 20.x |
| Ignored Build Step | `git diff --quiet HEAD^ HEAD -- apps/admin packages/api` |

### 4.1 커스텀 도메인 연결

1. Vercel 프로젝트 → Settings → Domains → `manage.dddstudy.kr` 추가
2. DNS(가비아/Cloudflare 등)에 CNAME 등록:
   ```
   manage  CNAME  cname.vercel-dns.com.
   ```
3. Vercel 측에서 자동으로 Let's Encrypt 인증서 발급 (보통 수 분 이내)

### 4.2 Preview 배포 보호 — 선택

어드민 미인증 상태 노출이 부담스러우면 Vercel **Deployment Protection** (Standard Protection) 활성화. Preview 도메인을 사내만 볼 수 있게 잠금. (Pro 플랜 필요)

---

## 5. 배포 후 검증 시나리오

브라우저 DevTools(Network + Application 탭) 열고 순서대로 통과 확인.

1. `https://manage.dddstudy.kr/` 진입 → 보호 페이지에서 401 → 로그인 페이지로 리다이렉트
2. "Google로 로그인" 클릭 → `https://admin.dddstudy.kr/api/v1/auth/google` 로 **top-level navigation** (fetch X)
3. Google 동의 → 백엔드 콜백 → `https://manage.dddstudy.kr/` 로 복귀
4. Application → Cookies → `admin.dddstudy.kr` 에 `access_token`, `refresh_token` 둘 다 표시:
   - HttpOnly ✅ / Secure ✅ / SameSite=Lax ✅
5. 어드민 보호 API 호출(예: 코호트 목록) → 200 + Request Headers 의 Cookie 자동 첨부 ✅
6. (선택) access_token 만료 강제 — 쿠키 직접 삭제 후 보호 API 호출 →
   401 → `POST /api/v1/auth/refresh` 자동 호출 → 원 요청 재시도 → 200 ✅
7. 로그아웃 버튼 (`useLogoutFlow`) → 쿠키 삭제 + 쿼리 캐시 클리어 + `/` 로 리다이렉트 ✅

---

## 6. Preview 배포에서 로그인까지 동작시키기

기본 Vercel preview 도메인(`*.vercel.app`)에서 실제 OAuth 흐름을 돌리려면 백엔드 측 §2.1 화이트리스트에 preview 패턴이 포함되어야 한다.

- preview 도메인 패턴 확인 방법: 첫 PR 배포 후 발급된 URL 확인 (예: `ddd-admin-git-<branch>-<team>.vercel.app`)
- 백엔드 CORS 가 정규식/와일드카드를 지원하면 패턴 한 줄로 처리. 미지원이면 PR 단위로 도메인이 바뀔 때마다 화이트리스트 갱신이 필요해 비효율적이라 정규식 매칭 권장.
- preview에서 OAuth 콜백을 prod 쿠키 도메인과 분리하기 위해 백엔드는 preview 도메인 검출 시 `CLIENT_REDIRECT_URL` 를 동적으로 설정하거나, preview 전용 stage 백엔드를 띄우는 방안도 고려.

> 운영 부담을 줄이려면 **Preview 는 UI 확인용으로만 쓰고 인증 흐름은 prod 에서만 검증** 하는 정책도 충분히 합리적이다.

---

## 7. 향후 백엔드 도메인 정리 (옵션 2-A 컷오버)

언젠가 백엔드를 `api.dddstudy.kr` 로 옮기기로 결정되면:

1. 백엔드 신규 도메인 `api.dddstudy.kr` 발급 + 인증서 + DNS
2. Google Cloud Console OAuth Authorized redirect URI 에 신규 콜백 추가:
   `https://api.dddstudy.kr/api/v1/auth/google/callback`
3. 백엔드 env 변경: 자기 자신 self-URL / CORS / `CLIENT_REDIRECT_URL`
4. 프론트 Vercel env `VITE_API_URL` 만 신규 도메인으로 갱신 → 재배포
5. 기존 `admin.dddstudy.kr` 는 grace period 동안 301 redirect (또는 양쪽 모두 trafficable)
6. 본 문서 §1 표와 §2 / §5 의 도메인 표기 일괄 정정

프론트 코드는 env 한 줄만 바뀌므로 영향 최소.

---

## 8. 작업 시 확인 항목 (체크리스트)

배포 직전 한 번 더 훑는다.

### 백엔드 측 (담당자 회신 필요)
- [ ] CORS 화이트리스트에 `https://manage.dddstudy.kr` 추가됨
- [ ] CORS 화이트리스트에 Vercel preview 패턴 추가됨 (preview 로그인 테스트 가능 정책 선택 시)
- [ ] `CLIENT_REDIRECT_URL=https://manage.dddstudy.kr/` 갱신됨
- [ ] prod 쿠키 플래그 (`httpOnly`, `secure`, `sameSite=lax`) 점검 완료
- [ ] dev JSON 디버그 분기 prod 비활성화 확인

### 프론트 측 (이 레포)
- [ ] `apps/admin/vercel.json` 추가
- [ ] `apps/admin/public/robots.txt` 추가
- [ ] `apps/admin/index.html` 에 `<meta name="robots" content="noindex, nofollow">` 추가
- [ ] Vercel 프로젝트 생성 + Root Directory `apps/admin` 설정
- [ ] Vercel Env (`VITE_API_URL`, `VITE_MSW_ENABLED`) 등록 (Production + Preview)
- [ ] 커스텀 도메인 `manage.dddstudy.kr` 연결 + DNS CNAME 등록

### 배포 후 (브라우저)
- [ ] §5 검증 시나리오 1~7 전 통과
- [ ] DevTools Network 탭에서 보호 API 호출에 Cookie 자동 첨부 확인
- [ ] 새로고침 시 SPA 라우트가 404 없이 살아남는지 (`/cohorts/123` 등)

---

## 9. 핵심 파일 매핑

| 책임 | 파일 |
| ---- | ---- |
| Vite 빌드 설정 | `apps/admin/vite.config.ts` |
| 환경변수 사용 | `apps/admin/src/main.tsx`, `apps/admin/src/pages/login/LoginPage.tsx` |
| API 클라이언트 + 401/refresh 인터셉터 | `packages/api/src/client.ts` |
| 로그인 진입점 | `apps/admin/src/pages/login/LoginPage.tsx` |
| 로그아웃 흐름 | `apps/admin/src/entities/auth/model/useLogoutFlow.ts` |
| Vercel 설정 (신규) | `apps/admin/vercel.json` |
| 크롤러 차단 (신규) | `apps/admin/public/robots.txt`, `apps/admin/index.html` |

---

**마지막 수정**: 2026-05-11
