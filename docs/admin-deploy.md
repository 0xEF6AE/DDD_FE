# DDD 어드민 배포 — same-origin (Caddy + GCP VM) 가이드 (단일 출처)

> 본 문서는 `apps/admin` 프론트엔드를 백엔드와 **같은 도메인(`admin.dddstudy.kr`)** 으로 배포하기 위한
> **단일 출처(single source of truth)** 다. 도메인 / 라우팅 / 배포 워크플로 관련 작업은 이 문서를 기준으로 한다.
>
> 인증 흐름 자체는 [docs/admin-auth.md](./admin-auth.md) 가 단일 출처. 본 문서는 **배포·도메인 구성**에 초점.

---

## 1. 배포 구도

| 역할 | 도메인 | 호스트 |
| ---- | ------ | ------ |
| 어드민 프론트 | `https://admin.dddstudy.kr/` (모든 경로) | GCP VM 의 정적 파일 |
| 백엔드 API | `https://admin.dddstudy.kr/api/*` | 같은 VM 의 Nest 앱(`app:3000`) |
| Swagger | `https://admin.dddstudy.kr/api-docs`, `/api-docs-json` | 같은 VM 의 Nest 앱 |

- **same-origin** → CORS 설정/예외 케이스 사실상 소멸
- **httpOnly 쿠키 단순화** — `SameSite=Lax` 그대로 동작
- **OAuth redirect URI 도 같은 도메인** — Google Cloud Console 변경 불필요

### 1.1 Caddy 라우팅

```
/api/*                       → app:3000 (BE)
/api-docs, /api-docs-json    → app:3000 (BE, Swagger)
그 외 모든 경로              → /srv/frontend (정적 파일 + try_files {path} /index.html)
```

OAuth 콜백은 전부 `/api/v1/*` 아래라 BE 가 처리. **프론트는 콜백 페이지를 만들지 않는다.**

| OAuth 엔드포인트 | 실제 경로 |
| --- | --- |
| Google 콜백 | `/api/v1/auth/google/callback` |
| Discord 콜백 | `/api/v1/discord/oauth/callback` |

---

## 2. 배포 전략

| 항목 | 결정 |
| --- | --- |
| 배포 트리거 | **FE 레포 CI 단독** — BE 배포와 독립 |
| 정적 파일 위치 | VM 호스트 `/opt/ddd-be/frontend/current/` (BE compose 가 `/srv/frontend` 로 마운트) |
| 배포 원자성 | **Symlink 스왑** — `releases/<sha>/` 에 풀고 `current` 심볼릭 링크 교체 |
| SSH 사용자 | BE 배포용 user 재사용 (`GCP_VM_USER` / `GCP_VM_SSH_KEY`) |
| 빌드 환경변수 | `VITE_API_URL=""` (코드가 `window.location.origin` 자동 결합) |
| 빌드 범위 | `pnpm --filter @ddd/admin... build` (의존 워크스페이스 포함) |
| 로그인 후 랜딩 | `/applications` |
| 인증 상태 체크 | 현재 옵션 B (보호 API 첫 호출 시 401). BE 가 `/users/me` 추가하면 옵션 A 로 전환 (별도 PR) |

---

## 3. 백엔드 측 작업 (참고용 — FE 가 직접 할 일 아님)

BE 가 선행해야 FE 첫 배포가 정상 동작한다. 핵심 작업:

- Caddyfile 에 `/api/*` 분기 + SPA fallback 추가
- `docker-compose.yml` 의 caddy 서비스에 `./frontend/current:/srv/frontend:ro` 볼륨 마운트
- `deploy.yml` 또는 부트스트랩 스크립트에 `mkdir -p /opt/ddd-be/frontend/current` + placeholder `index.html`
- 환경변수 `CLIENT_REDIRECT_URL=https://admin.dddstudy.kr/applications` 갱신
- (선택) `GET /api/v1/users/me` 엔드포인트 추가 — 옵션 A 가드 도입 시 필요
- 외부 콘솔(Google/Discord)의 OAuth redirect URI 가 이미 `admin.dddstudy.kr` 라면 변경 없음

---

## 4. 프론트엔드 — 적용 완료 항목 (참고용)

다음 변경은 same-origin 전환 PR 에서 이미 반영됨.

| 파일 | 변경 |
| --- | --- |
| `packages/api/src/client.ts` | `buildUrl()` 이 `baseUrl === ""` 일 때 `window.location.origin` 자동 결합 |
| `apps/admin/src/main.tsx` | `VITE_API_URL` 빈 값 허용 (`?? ""`), `onUnauthorized` 콜백을 `paths.login` 사용으로 통일 |
| `apps/admin/src/pages/login/LoginPage.tsx` | OAuth 진입을 `/api/v1/auth/google` 상대 경로로 (origin 자동) |
| `apps/admin/vite.config.ts` | `server.proxy['/api'] → http://localhost:3000` (cookieDomainRewrite 포함) |
| `apps/admin/.env.local`, `.env.production` | `VITE_API_URL=` (빈 값) |
| `apps/admin/index.html` | `<meta name="robots" content="noindex, nofollow">` (선재 존재) |
| `apps/admin/public/robots.txt` | `User-agent: * / Disallow: /` (선재 존재) |

> **확장 규칙**: API path 는 항상 `/api/v1/...` 절대 prefix 로 시작한다. baseURL 은 origin 자동 결합이므로 path 가 `/` 로 시작하지 않으면 `new URL` 이 의도와 다르게 동작한다.

---

## 5. GitHub Actions — `.github/workflows/deploy-admin.yml`

main 브랜치 push 시 트리거. `workflow_dispatch` 로 수동 실행도 가능.

### 5.1 단계 요약

1. `pnpm install --frozen-lockfile`
2. `pnpm --filter @ddd/admin... build` (env: `VITE_API_URL=""`, `VITE_MSW_ENABLED='false'`)
3. `apps/admin/dist` 를 tar 로 묶어 SCP (`appleboy/scp-action`)
4. SSH 로 atomic swap (`appleboy/ssh-action`)
   ```bash
   REL="releases/$(date +%Y%m%d-%H%M%S)-${GITHUB_SHA::7}"
   tar -xzf admin-dist.tar.gz -C "$REL"
   ln -sfn "$REL" current.new
   mv -Tf current.new current      # 진짜 원자적 스왑
   ls -1dt releases/*/ | tail -n +6 | xargs -r rm -rf  # 5개 보관, 나머지 정리
   ```
5. `curl -fsI https://admin.dddstudy.kr/` 헬스체크 6회 폴링

### 5.2 핵심 포인트

- `mv -Tf` 패턴이 진짜 원자적 (단순 `ln -sf` 는 중간 상태 발생)
- 릴리스 5개만 보관, 나머지 자동 정리
- Caddy 재시작 불필요 (정적 파일이라 즉시 반영)
- `concurrency: deploy-admin` 으로 동시 실행 방지, `cancel-in-progress: false` 로 롤백 안전성 확보

---

## 6. GitHub Secrets

프론트 레포 Settings → Secrets and variables → Actions:

- `GCP_VM_HOST` — VM IP/호스트
- `GCP_VM_USER` — BE 와 동일 user
- `GCP_VM_SSH_KEY` — BE 와 동일 private key

BE 레포의 동일 값을 그대로 복사. 추후 보안 강화가 필요하면 frontend-deploy 전용 user 로 분리하는 방안 재검토.

---

## 7. 첫 배포 순서 (1회성)

1. **BE 가 먼저** — Caddyfile / compose / 부트스트랩 스크립트 변경 + placeholder 세팅 배포
   - 이 단계까지는 Caddy 가 placeholder `index.html` 을 서빙
2. **GitHub Secrets 등록** (§6) — 머지 전 필수
3. **FE 가 다음** — main 머지 또는 Actions 탭 `workflow_dispatch` 실행
   - `current` 가 실제 빌드로 교체됨
4. **(선택) OAuth 콘솔 점검** — 이미 `admin.dddstudy.kr` 면 변경 없음
5. **검증** — §8 시나리오 통과 확인

---

## 8. 배포 후 검증 시나리오

브라우저 DevTools(Network + Application 탭) 열고 순서대로 통과 확인.

1. `https://admin.dddstudy.kr/` 진입 → 로그인 페이지 노출 (`paths.login = "/"`)
2. "Google로 로그인" 클릭 → `https://admin.dddstudy.kr/api/v1/auth/google` 로 **top-level navigation**
3. Google 동의 → 백엔드 콜백 → `https://admin.dddstudy.kr/applications` 로 복귀
4. Application → Cookies → `admin.dddstudy.kr` 에 `access_token`, `refresh_token` 둘 다:
   - HttpOnly ✅ / Secure ✅ / SameSite=Lax ✅
5. 보호 API 호출 (예: 코호트 목록) → 200 + Request Headers 의 Cookie 자동 첨부 ✅
6. (선택) access_token 만료 강제 — 쿠키 직접 삭제 후 보호 API 호출 →
   401 → `POST /api/v1/auth/refresh` 자동 호출 → 원 요청 재시도 → 200 ✅
7. 로그아웃 버튼 (`useLogoutFlow`) → 쿠키 삭제 + 쿼리 캐시 클리어 + `/` 로 리다이렉트 ✅
8. `/applications` 직접 URL 입력 + 새로고침 → 404 안 뜨고 SPA 라우트 유지 (Caddy `try_files` 동작 확인)

---

## 9. 롤백 방법

VM 에서:
```bash
cd /opt/ddd-be/frontend
ls releases/                    # 보관된 릴리스 확인
ln -sfn releases/<previous-sha> current.new && mv -Tf current.new current
```

Caddy 재시작 불필요. 즉시 반영.

---

## 10. 로컬 개발

`apps/admin/vite.config.ts` 의 `server.proxy['/api']` 가 `http://localhost:3000` 으로 프록시한다. 코드 입장에서 prod 와 같은 same-origin 동작.

```bash
# BE 가 localhost:3000 에서 실행 중이라고 가정
pnpm dev:admin
# → http://localhost:5173 진입
# → /api/* 호출은 vite proxy 가 localhost:3000 으로 전달, 쿠키 자동 동행
```

- `cookieDomainRewrite: ""` 설정으로 BE 가 내려준 쿠키의 domain 속성을 제거 → localhost 에서도 정상 저장
- `VITE_API_URL=` 빈 값 그대로 두면 `window.location.origin` 사용 (즉, `http://localhost:5173`) → proxy 가 `/api/*` 를 가로채므로 same-origin 흉내가 완성됨

---

## 11. 자주 묻는 질문

**Q. 같은 도메인인데 `credentials: "include"` 진짜 필요한가요?**
A. same-origin 이라도 fetch 기본값은 쿠키를 안 실어보낸다. **명시적으로 켜야** httpOnly 쿠키가 동행. `client.ts` 가 기본값으로 처리하므로 신경 쓸 필요 없음.

**Q. 새로고침 시 `/applications` 가 404 떠요.**
A. Caddy 의 `try_files {path} /index.html` 가 빠진 경우. BE 측에 확인 요청.

**Q. CDN 앞단에 둘 계획이 있나요?**
A. 현재 없음. 추후 Cloudflare 등 도입 시 캐시 정책 (`index.html` no-cache, hashed assets immutable) 을 거기서도 맞춰야 함.

**Q. preview 배포가 필요한가요?**
A. 현재 워크플로는 main 푸시만 트리거. preview 가 필요해지면 Vercel 같은 별도 호스팅을 다시 검토하거나, 같은 패턴으로 staging VM 추가.

---

## 12. 체크리스트 (PR 머지 전)

### BE 측 (담당자 회신 필요)
- [ ] Caddyfile 에 `/api/*` 분기 + `try_files` SPA fallback 추가
- [ ] `docker-compose.yml` 의 caddy 서비스에 frontend 볼륨 마운트
- [ ] `/opt/ddd-be/frontend/current/` 부트스트랩 + placeholder `index.html`
- [ ] `CLIENT_REDIRECT_URL=https://admin.dddstudy.kr/applications` 갱신
- [ ] prod 쿠키 플래그 (`httpOnly`, `secure`, `sameSite=lax`) 점검

### FE 측 (이 레포)
- [x] `packages/api/src/client.ts` buildUrl 보강 (origin 자동)
- [x] `apps/admin/src/main.tsx` VITE_API_URL 빈 값 허용 + paths.login 통일
- [x] `apps/admin/src/pages/login/LoginPage.tsx` OAuth 진입 상대 경로
- [x] `apps/admin/vite.config.ts` dev proxy 추가
- [x] `apps/admin/.env.local`, `.env.production` 빈 값
- [x] `.github/workflows/deploy-admin.yml` 추가
- [x] `apps/admin/index.html` `<meta robots>` (선재 존재)
- [x] `apps/admin/public/robots.txt` `Disallow: /` (선재 존재)
- [ ] GitHub Secrets 등록 (`GCP_VM_HOST`, `GCP_VM_USER`, `GCP_VM_SSH_KEY`)

### 배포 후 (브라우저)
- [ ] §8 검증 시나리오 1~8 전 통과
- [ ] DevTools Network 탭에서 보호 API 호출에 Cookie 자동 첨부 확인
- [ ] 새로고침 시 SPA 라우트가 404 없이 살아남는지

---

## 13. 핵심 파일 매핑

| 책임 | 파일 |
| --- | --- |
| Vite 빌드 + dev proxy | `apps/admin/vite.config.ts` |
| 환경변수 진입점 | `apps/admin/src/main.tsx` |
| API 클라이언트 + 401/refresh 인터셉터 + origin 자동 결합 | `packages/api/src/client.ts` |
| 로그인 진입점 (OAuth top-level navigation) | `apps/admin/src/pages/login/LoginPage.tsx` |
| 로그아웃 흐름 | `apps/admin/src/entities/auth/model/useLogoutFlow.ts` |
| 라우트 경로 상수 | `apps/admin/src/shared/lib/paths.ts` |
| CI/CD 워크플로 | `.github/workflows/deploy-admin.yml` |
| 크롤러 차단 | `apps/admin/public/robots.txt`, `apps/admin/index.html` |

---

**마지막 수정**: 2026-05-11
