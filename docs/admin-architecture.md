# apps/admin — 아키텍처 참조

## 디렉터리 구조 (pages / shared 2단)

FSD를 폐기하고 **페이지 콜로케이션** 구조를 사용한다. 원칙 한 줄: *쓰는 곳 옆에 둔다. 두 번째 소비자가 생기면 `shared/` 로 올린다.*

```
src/
├── main.tsx                    # 엔트리 — configureApi, QueryProvider, Router 마운트
│
├── pages/                      # 라우트 1:1 페이지 폴더 (페이지 전용 코드 전부 콜로케이션)
│   ├── index.tsx               # 라우터 설정 (createBrowserRouter)
│   ├── login/
│   ├── applications/
│   │   ├── ApplicationsPage.tsx
│   │   ├── components/         # 페이지 전용 컴포넌트 — 한 단계 평탄, 서브폴더 금지
│   │   ├── hooks/              # 페이지 전용 훅 (useApplicationsBoard 등)
│   │   └── constants.ts
│   ├── semesters/
│   │   ├── SemestersPage.tsx
│   │   ├── components/
│   │   ├── hooks/              # useSemestersTableData, useCreateOrUpdateCohortFlow 등
│   │   ├── lib/                # serialize, validateParts, statusFlow, completion
│   │   ├── constants.ts
│   │   └── types.d.ts
│   ├── interview-slots/
│   ├── early-notification/
│   ├── projects/
│   ├── blog-posts/
│   └── error/
│
├── mocks/                      # MSW 목업 환경
│   ├── browser.ts
│   └── handlers.ts
│
└── shared/                     # 2개 이상 페이지가 쓰는 것만
    ├── ui/                     # 공용 컴포넌트 (FlexBox, Heading, EmptyState, ...)
    │   └── AdminLayout/        # 레이아웃 셸 (AdminLayout, SideBar, MobileHeader, UserMenuDropdown)
    ├── hooks/                  # 크로스 페이지 훅 (useRequireAuth, useLogoutFlow, useIsMobile)
    └── lib/                    # 유틸·상수·Provider (cn, paths, QueryProvider)
```

---

## 구조 규칙

의존성 방향은 **단방향**으로 강제한다. (자세한 정의: 루트 [CODE_RULES.md §1](../CODE_RULES.md))

```
pages → shared
    ↘
 packages/api
```

- **페이지끼리 import 금지.** `pages/{a}` 가 `pages/{b}` 의 파일이 필요해지면 그 파일을 `shared/` 로 승격한다.
- `shared`는 `pages` 를 import 하지 않는다.
- **barrel(`index.ts`) 금지** — 모든 import 는 파일 직접 경로. (`pages/index.tsx` 라우터는 barrel 이 아니라 라우터 모듈)
- `components/` 하위 서브폴더 금지 — Drawer/Modal 복합 컴포넌트도 형제 파일로 평탄하게.

---

## 훅 위치 결정 가이드

새 훅을 추가할 때는 [CODE_RULES.md §2](../CODE_RULES.md) 의 분류 표를 따른다.

| 유형 | 예시 | 위치 |
| ---- | ---- | ---- |
| **쿼리/뮤테이션 팩토리** (`queryOptions`/`mutationOptions`) | `applicationQueries.getAdminApplications`, `authMutations.logout` | `packages/api/src/{domain}/queries.ts` |
| **페이지 전용 훅** (비즈니스 흐름 훅 포함) | `useApplicationsBoard`, `useCreateOrUpdateCohortFlow` | `pages/{page}/hooks/` |
| **크로스 페이지 훅** | `useRequireAuth`, `useLogoutFlow`, `useIsMobile` | `shared/hooks/` |

---

## 새 페이지 추가 방법

1. `src/pages/{페이지명}/` 폴더 생성
2. 페이지 컴포넌트 작성 (`{페이지명}Page.tsx`)
3. `src/pages/index.tsx` 라우터에 경로 추가
4. `src/shared/lib/paths.ts`에 경로 상수 추가
5. `src/shared/ui/AdminLayout/constants.ts`에 메뉴 아이템 추가 (사이드바/모바일 헤더에 노출 시)

- 파일이 하나뿐인 단순 페이지(`login`, `error`)는 `{Feature}Page.tsx`만 두고 세부 폴더를 만들지 않는다.
- `hooks/`·`lib/`·`constants.ts` 는 실제 파일이 생길 때 만든다.

---

## shared/hooks와 shared/lib

| 경로                            | 용도                                 |
| ------------------------------- | ------------------------------------ |
| `shared/hooks/useIsMobile.ts`   | 모바일 뷰포트 감지 훅                |
| `shared/hooks/useRequireAuth.ts`| 보호 라우트 인증 가드                |
| `shared/hooks/useLogoutFlow.ts` | 로그아웃 흐름 (캐시 정리 + 리다이렉트) |
| `shared/lib/cn.ts`              | clsx + tailwind-merge 유틸           |
| `shared/lib/paths.ts`           | 라우트 경로 상수                     |
| `shared/lib/QueryProvider.tsx`  | TanStack Query Provider              |
