# DDD 모노레포 구조 규약 (Structure Rules)

- 본 문서는 **이 모노레포에 고유한** 구조·의존성·훅 배치 규칙만 담는다.
- **범용 React/TypeScript 코드 컨벤션**(함수 선언 스타일·네이밍·조건문·타입·스타일링·테스트 등)은 `seokit-frontend:seokit-rules` 스킬이 단일 출처다. `.tsx`/`.ts` 작성·수정 시 자동 로드된다.
  - 참고: 선언 스타일은 seokit 규약(**named `function` 지향**)을 따른다. 과거 이 문서의 "화살표 함수 지향" 규칙은 폐기.
- 구현·리뷰·리팩터링 판단: 구조는 본 문서, 컨벤션은 seokit-rules 를 기준으로 한다.

---

## 1. 프로젝트 구조 `MUST`

1. **패키지 의존성**: 의존 방향은 앱에서 패키지로만 허용한다. (`apps/*` → `packages/*`)
2. **공통 컴포넌트**: 여러 앱에서 사용하는 컴포넌트는 `@ddd/ui`에 작성한다.
3. **앱 전용 컴포넌트**: 특정 앱에서만 사용하는 컴포넌트는 해당 앱의 `components/`에 작성한다.
4. **FSD 레이어 의존성**: FSD 구조를 채택한 앱(`apps/admin`)은 다음 단방향 의존성을 강제한다.

   ```
   app → pages → widgets → entities → shared
                                   ↘
                                packages/api
   ```

   - `entities`는 **도메인 비즈니스 로직**(흐름 훅, 도메인 상수/타입)을 담당하며, `packages/api`와 `shared`만 import 한다.
   - `entities`끼리는 서로 import 하지 않는다(도메인 결합 차단). 두 도메인을 묶는 흐름은 `widgets` 또는 `pages`의 책임이다.
   - `entities` 하위 도메인 분류는 `packages/api/src/{domain}` 과 **1:1로 맞춘다** (예: `entities/auth/`, `entities/application/`).
   - 도메인명은 **백엔드 표준 도메인명을 그대로 따른다** (대부분 단수: `cohort`, `application`, `interview`, `user`, `auth`, `google`, `discord`, `notification`, `blog`, `project`, `storage`, `audit`, `health`). `entities/{domain}` 과 `packages/api/src/{domain}` 둘 다 동일 명명을 사용해 백엔드 ↔ 프런트 도메인 매핑을 1:1로 유지한다.
   - 페이지 slice 이름(`pages/{feature}/`)은 도메인명과 단/복수 표기가 달라도 무방하다 (예: `pages/applications/` ↔ `entities/application/`). 페이지는 화면 단위라 복수형이 자연스러운 경우가 있고, 도메인은 단일 모델 단위라 단수가 자연스럽다.
   - `entities/{domain}` 내부는 FSD 표준에 따라 `model/`(훅·상수·타입), `ui/`(도메인 전용 UI), `lib/`(도메인 유틸) 등 하위 폴더로 분류한다. 처음에는 `model/`만 두고 필요할 때 점진 확장한다.

---

## 2. 커스텀 훅 위치 & 데이터 접근 `MUST`

훅 기본 규약(네이밍 `use*`, 단일 책임, 객체 반환)은 seokit-rules 를 따른다. 여기서는 **위치 분류**와 **서버 상태 접근 패턴**만 규정한다.

### 2.1 훅 위치 분류

| 분류                                                                      | 위치                                                              | 예시                                                              |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| **쿼리/뮤테이션 팩토리** (`queryOptions` / `mutationOptions`)             | `packages/api/src/{domain}/queries.ts`                            | `applicationQueries.getAdminApplications`, `authMutations.logout` |
| **쿼리키 팩토리**                                                         | `packages/api/src/{domain}/queryKeys.ts`                          | `applicationKeys.adminList`, `cohortKeys.detail`                  |
| **비즈니스 흐름 훅** (API 호출 + 부수효과: toast, 라우팅, 캐시 정리 등)   | `apps/{app}/src/entities/{domain}/model/`                         | `useLogoutFlow`, `useApplicationsBoard`                           |
| **UI/플랫폼 훅** (도메인 무관)                                            | `apps/{app}/src/shared/hooks/`                                    | `useIsMobile`, `useTheme`                                         |

- `packages/api`는 앱-agnostic을 유지한다. UI 라이브러리(`@heroui/react`), 라우터(`react-router`), 앱 전용 상수(`paths`)에 의존하는 훅은 packages에 둘 수 없다.

### 2.2 컴포넌트의 데이터 접근 패턴 (3단계)

| 단계                                                                                                      | 패턴                                                                                                                                                | 위치                                       |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **(a) 옵션 팩토리만으로 충분**                                                                            | `useQuery(xxxQueries.method({ params }))` / `useMutation(xxxMutations.method())` / `useSuspenseQuery(...)` 결과를 그대로 구조 분해해 사용             | 컴포넌트 인라인                            |
| **(b) 추가 비즈니스 로직** (toast / 라우팅 / 캐시 무효화 / 다중 쿼리 조합 / 응답 가공 / 클라이언트 필터·집계) | 흐름 훅으로 추출 (`useXxxFlow`, `useXxxBoard`, `useXxxForm` 등). 흐름 훅 내부에서도 옵션 팩토리만 사용한다.                                          | `apps/{app}/src/entities/{domain}/model/`  |
| **(c) 단일 페이지 1회용 + 도메인성 약함**                                                                  | 페이지 slice 내부의 임시 훅. 두 곳 이상에서 반복 등장하면 (b) `entities` 흐름 훅으로 승격한다 (YAGNI).                                                | `apps/{app}/src/pages/{feature}/hooks/`    |

**금지 패턴**:
- `packages/api` 의 wrapper hook (`useAdminApplications`, `useDeleteCohort` 등) 을 컴포넌트·흐름 훅에서 직접 import 하는 것. 옵션 팩토리(`xxxQueries` / `xxxMutations`)를 `useQuery` / `useMutation` 에 전달한다.

  ```tsx
  // ❌ wrapper hook
  const { data } = useAdminApplications({ params: { cohortId: 1 } })

  // ✅ 옵션 팩토리 + 표준 훅
  const { data } = useQuery(
    applicationQueries.getAdminApplications({ params: { cohortId: 1 } })
  )
  ```

- 동일 컴포넌트가 같은 옵션 팩토리를 의미가 다른 params 로 N번 호출하고 그 결과를 컴포넌트 내부에서 추가 가공하는 경우 — 두 호출을 하나의 의미 단위로 묶어 (b) 흐름 훅으로 추출한다.

  ```tsx
  // ❌ 페이지가 두 쿼리 + 가공까지 끌어안음
  const { data: cardApplications } = useAdminApplications({ params: { cohortId } })
  const { data: tableApplications } = useAdminApplications({ params: { cohortId, status } })
  const counts = useMemo(...)
  const filteredApplications = useMemo(...)

  // ✅ 흐름 훅 한 번으로 데이터 조립
  const { cards, tableRows, counts, contextLabel } = useApplicationsBoard({
    cohortId,
    cohortPartId,
    status,
    searchText,
  })
  ```

**흐름 훅 작성 규약**:
- 흐름 훅도 wrapper hook 을 사용하지 않는다. `useQuery(xxxQueries.method)` / `useMutation(xxxMutations.method)` 만 사용한다.
- 반환은 객체 구조 분해가 가능하도록 객체로 반환한다.
- 쿼리키는 `{domain}Keys` 팩토리를 그대로 사용한다 (캐시 무효화 · prefetch 등).
- `entities` 끼리 import 금지 (§1 #4 재확인). 두 도메인을 묶는 흐름은 `widgets` 또는 `pages` 책임이다.

---

## 3. PR 체크리스트

> 범용 컨벤션(선언 스타일·`any` 금지·주석·타입·스타일 토큰 등)은 seokit-rules + lint 가 강제한다. 아래는 **구조 규약** 확인 항목.

- [ ] 컴포넌트가 단일 책임 원칙을 따르는가? (관심사 분리)
- [ ] 공통으로 사용될 컴포넌트가 `@ddd/ui`에 있는가?
- [ ] 앱/패키지 의존 방향이 `apps/* → packages/*` 단방향인가?
- [ ] FSD 레이어 의존성(`app → pages → widgets → entities → shared`, `entities → packages/api`)을 지켰는가?
- [ ] `entities` 끼리 서로 import 하지 않는가? (도메인 결합 차단)
- [ ] 컴포넌트·흐름 훅이 `@ddd/api` 의 wrapper hook (`useXxx`) 을 직접 import 하지 않고, `xxxQueries` / `xxxMutations` 옵션 팩토리를 `useQuery` / `useMutation` 에 전달하는가? (§2.2)
- [ ] 비즈니스 로직(toast / 라우팅 / 캐시 정리 / 다중 쿼리 조합 / 응답 가공 / 클라이언트 필터·집계) 이 컴포넌트가 아니라 `entities/{domain}/model/` 흐름 훅으로 분리되어 있는가? (§2.2)
- [ ] `entities/{domain}` 명명이 백엔드 표준 도메인명과 1:1로 일치하는가? (§1 #4)
