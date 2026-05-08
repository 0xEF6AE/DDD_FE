# apps/admin — 어드민 앱 개발 가이드

DDD 동아리 운영진용 어드민 페이지. Vite + React 19, Tailwind CSS 4, React Router(Data Mode), HeroUI v3 기반.

> 기능 명세 대비 구현 체크리스트는 루트의 **[progress.md](../../progress.md)** 를 참조한다.
>
> 토스트(`toast.success/error/info/warning`) 사용 패턴은 **[docs/admin-toast.md](../../docs/admin-toast.md)** 를 단일 출처로 삼는다. 새 컴포넌트에서 알림이 필요하면 이 문서의 표준 패턴을 따른다.

---

## 디렉터리 구조 (FSD 기반)

```
src/
├── app/                        # 앱 초기화 레이어
│   └── providers/
│       ├── QueryProvider.tsx   # TanStack Query Provider
│       └── ThemeProvider.tsx   # 전역 테마 Provider + useTheme 훅
│
├── pages/                      # 페이지 레이어 (라우트 1:1 대응, 주요 feature 단위)
│   ├── index.tsx               # 라우터 설정 (createBrowserRouter)
│   ├── login/
│   ├── applications/
│   ├── semesters/
│   ├── reminders/
│   ├── projects/
│   ├── blog-posts/
│   └── error/
│
├── widgets/                    # 복합 UI 블록 레이어 (페이지 간 공유)
│   ├── navigation/
│   │   ├── SideBar.tsx         # 데스크톱 사이드바
│   │   ├── MobileHeader.tsx    # 모바일 상단 헤더
│   │   ├── constants.ts        # 메뉴 아이템 정의
│   │   └── types.d.ts
│   ├── heading/
│   │   └── index.tsx           # 페이지 헤딩 블록
│   └── admin-layout/
│       └── AdminLayout.tsx     # 뷰포트에 따라 SideBar/MobileHeader + Outlet 구성
│
├── entities/                   # 도메인 모델 레이어 (비즈니스 흐름 훅, 도메인 상수/타입)
│   └── {domain}/               # packages/api/src/{domain} 과 1:1 매핑 (auth, application, blog, ...)
│       ├── model/              # 흐름 훅·상수·타입 (예: useLogoutFlow)
│       ├── ui/                 # 도메인 전용 UI (필요 시)
│       └── lib/                # 도메인 유틸 (필요 시)
│
├── mocks/                      # MSW 목업 환경
│   ├── browser.ts
│   └── handlers.ts
│
└── shared/                     # 순수 공유 자원 레이어
    ├── ui/                     # UI 컴포넌트 (HeroUI 외 커스텀 프리미티브)
    ├── hooks/                  # 범용 UI/플랫폼 훅 (useIsMobile 등) — 도메인 무관
    └── lib/                    # 유틸 함수 및 상수 (cn, paths, auth)
```

---

## 레이어 규칙

의존성 방향은 **단방향**으로 강제한다. (자세한 정의: 루트 [CODE_RULES.md §3.1](../../CODE_RULES.md))

```
app → pages → widgets → entities → shared
                              ↘
                          packages/api
```

- 각 레이어는 자신보다 **아래** 레이어만 import 가능.
- `entities`는 `packages/api` 와 `shared` 만 import 한다. `entities` 끼리는 **서로 import 금지** (도메인 결합 차단).
- 두 도메인을 묶는 흐름은 `widgets` 또는 `pages` 의 책임이다.
- `shared`는 어떤 레이어도 import하지 않는다.
- `widgets`는 `pages`를 import하지 않는다.

### 훅 위치 결정 가이드

새 훅을 추가할 때는 [CODE_RULES.md §3.3](../../CODE_RULES.md) 의 분류 표를 따른다.

- **API 호출 훅** (`useLogout`, `useApplications` 등): `packages/api/src/{domain}/hooks.ts`
- **비즈니스 흐름 훅** (`useLogoutFlow` 등 — API 호출 + toast/라우팅/캐시 정리): `entities/{domain}/model/`
- **UI/플랫폼 훅** (`useIsMobile`, `useTheme` 등 도메인 무관): `shared/hooks/`

---

## 새 페이지 추가 방법

1. `src/pages/{페이지명}/` 폴더 생성
2. 페이지 컴포넌트 작성 (`{페이지명}Page.tsx`)
3. `src/pages/index.tsx` 라우터에 경로 추가
4. `src/shared/lib/paths.ts`에 경로 상수 추가
5. `src/widgets/navigation/constants.ts`에 메뉴 아이템 추가 (사이드바/모바일 헤더에 노출 시)

### 페이지 slice 내부 구조

현재 어드민 페이지들은 **feature 단위 평탄 구조**를 사용한다. 한 페이지가 다음 파일들로 구성된다.

```
pages/applications/
├── ApplicationsPage.tsx        # 최상위 페이지 컴포넌트
├── index.tsx                   # 외부 노출 배럴
├── components/                 # 이 페이지 전용 하위 컴포넌트 (예: Sections.tsx)
├── constants.ts                # 컬럼/필터/상태 라벨 등 상수
└── types.d.ts                  # 임시 타입 (추후 `@ddd/api` 생성 타입으로 대체)
```

- 파일이 하나뿐인 단순 페이지(`login`, `error`)는 `{Feature}Page.tsx`만 두고 세부 폴더를 만들지 않는다.
- 페이지 전용 Drawer/Modal 등 큰 서브 컴포넌트는 페이지 루트(`SemesterRegisterDrawer.tsx`) 또는 `components/` 하위에 둔다.

---

## UI 컴포넌트 작업 규칙

**기본 원칙**: 새로운 컴포넌트는 **`@heroui/react`에서 직접 import**해 사용한다.

> UI 컴포넌트 작업 시 **`admin-heroui` 스킬**이 자동 호출된다.
> 컴포넌트 props·slots·패턴의 세부 API는 **[docs/hero-ui.txt](../../docs/hero-ui.txt)** 를 단일 출처로 삼는다.
> 스킬에는 shared/ui 배치 기준, 금지 패턴, Drawer/Table compound 패턴이 포함된다.

### shared/hooks와 shared/lib

| 경로                          | 용도                       |
| ----------------------------- | -------------------------- |
| `shared/hooks/useIsMobile.ts` | 모바일 뷰포트 감지 훅      |
| `shared/lib/cn.ts`            | clsx + tailwind-merge 유틸 |
| `shared/lib/paths.ts`         | 라우트 경로 상수           |

---

## 주요 기술 결정

- **라우터**: React Router Data Mode (`createBrowserRouter`) — loader로 페이지 진입 전 데이터 페칭
- **스타일링**: Tailwind CSS 4 + `cn()` 유틸
- **UI 라이브러리**: `@heroui/react` v3 (React Aria Components 기반)
- **아이콘**: `@hugeicons/react`
- **테마**: `ThemeProvider` — localStorage 유지, `d` 키로 토글, 다크/라이트/시스템 지원
- **API**: `@ddd/api` 패키지에서 import, `main.tsx`에서 `configureApi()` 초기화

## 기능 개발 현황

기수 관리 / 사전 알림 / 지원자 / 프로젝트 / 블로그 / SEO 등 영역별 구현 상태는 루트의 **[progress.md](../../progress.md)** 에서 관리한다. 본 문서에는 중복 기재하지 않는다.
