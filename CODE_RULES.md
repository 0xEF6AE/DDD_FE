# DDD 모노레포 구조 규약 (Structure Rules)

- 본 문서는 **이 모노레포에 고유한** 구조·의존성·훅 배치 규칙만 담는다.
- **범용 React/TypeScript 코드 컨벤션**(함수 선언 스타일·네이밍·조건문·타입·스타일링·테스트 등)은 `seokit-frontend:seokit-rules` 스킬이 단일 출처다. `.tsx`/`.ts` 작성·수정 시 자동 로드된다.
  - 참고: 선언 스타일은 seokit 규약(**named `function` 지향**)을 따른다. 과거 이 문서의 "화살표 함수 지향" 규칙은 폐기.
- 구현·리뷰·리팩터링 판단: 구조는 본 문서, 컨벤션은 seokit-rules 를 기준으로 한다.

---

## 1. 프로젝트 구조 `MUST`

1. **패키지 의존성**: 의존 방향은 앱에서 패키지로만 허용한다. (`apps/*` → `packages/*`)
2. **공통 컴포넌트**: 여러 앱에서 사용하는 컴포넌트는 `@ddd/ui`에 작성한다.
3. **앱 전용 컴포넌트**: 특정 앱에서만 사용하는 컴포넌트는 해당 앱 안에 작성한다.
4. **apps/admin 2단 구조**: FSD를 폐기하고 `pages`와 `shared` 두 계층만 둔다.

   ```
   pages → shared
       ↘
    packages/api
   ```

   - **`pages/{page}/`** — 라우트 1:1 페이지 폴더. 그 페이지에서만 쓰는 모든 것(컴포넌트·훅·유틸·상수·타입·폼 스키마)을 **콜로케이션**한다.
   - **`shared/`** — 2개 이상 페이지가 쓰는 것만 둔다. `ui/`(컴포넌트·레이아웃), `hooks/`, `lib/`(유틸·상수·Provider).
   - **페이지끼리 import 금지.** `pages/{a}` 가 `pages/{b}` 의 파일을 쓰게 되는 순간 그 파일을 `shared/` 로 승격한다.
   - **배치 원칙 한 줄**: *쓰는 곳 옆에 둔다. 두 번째 소비자가 생기면 shared 로 올린다.*

5. **페이지 폴더 내부 구조** (완전 평탄화):

   ```
   pages/{page}/
   ├── {Page}Page.tsx        # 최상위 페이지 컴포넌트
   ├── components/           # 페이지 전용 컴포넌트 — 서브폴더·중첩 금지, 한 단계 평탄
   ├── hooks/                # 페이지 전용 훅 (비즈니스 흐름 훅 포함)
   ├── lib/                  # 페이지 전용 유틸·직렬화·검증·폼 스키마
   ├── constants.ts          # 페이지 전용 상수
   └── types.ts | types.d.ts # 페이지 전용 타입
   ```

   - 파일이 없는 분류의 폴더는 만들지 않는다. 단순 페이지(`login`, `error`)는 `{Page}Page.tsx` 하나로 충분하다.
   - **barrel(`index.ts`) 금지.** 모든 import 는 파일 직접 경로로 한다.
   - **`components/` 하위 서브폴더 금지.** Drawer/Modal 같은 복합 컴포넌트도 형제 파일로 평탄하게 둔다.

---

## 2. 커스텀 훅 위치 & 데이터 접근 `MUST`

훅 기본 규약(네이밍 `use*`, 단일 책임, 객체 반환)은 seokit-rules 를 따른다. 여기서는 **위치 분류**와 **서버 상태 접근 패턴**만 규정한다.

### 2.1 훅 위치 분류

| 분류                                                                    | 위치                                     | 예시                                                              |
| ----------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| **쿼리/뮤테이션 팩토리** (`queryOptions` / `mutationOptions`)           | `packages/api/src/{domain}/queries.ts`   | `applicationQueries.getAdminApplications`, `authMutations.logout` |
| **쿼리키 팩토리**                                                       | `packages/api/src/{domain}/queryKeys.ts` | `applicationKeys.adminList`, `cohortKeys.detail`                  |
| **페이지 전용 훅** (비즈니스 흐름 훅 포함: API 호출 + toast·라우팅·캐시) | `apps/{app}/src/pages/{page}/hooks/`     | `useApplicationsBoard`, `useCreateOrUpdateCohortFlow`             |
| **크로스 페이지 훅** (2개 이상 페이지·레이아웃에서 사용)                 | `apps/{app}/src/shared/hooks/`           | `useRequireAuth`, `useLogoutFlow`, `useIsMobile`                  |

- `packages/api`는 앱-agnostic을 유지한다. UI 라이브러리(`@heroui/react`), 라우터(`react-router`), 앱 전용 상수(`paths`)에 의존하는 훅은 packages에 둘 수 없다.

### 2.2 컴포넌트의 데이터 접근 패턴

| 단계                                                                                                        | 패턴                                                                                                                                      | 위치                                    |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| **(a) 옵션 팩토리만으로 충분**                                                                               | `useQuery(xxxQueries.method({ params }))` / `useMutation(xxxMutations.method())` / `useSuspenseQuery(...)` 결과를 그대로 구조 분해해 사용   | 컴포넌트 인라인                          |
| **(b) 추가 비즈니스 로직** (toast / 라우팅 / 캐시 무효화 / 다중 쿼리 조합 / 응답 가공 / 클라이언트 필터·집계)   | 흐름 훅으로 추출 (`useXxxFlow`, `useXxxBoard`, `useXxxForm` 등). 흐름 훅 내부에서도 옵션 팩토리만 사용한다.                                  | `apps/{app}/src/pages/{page}/hooks/`    |

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

---

## 3. PR 체크리스트

> 범용 컨벤션(선언 스타일·`any` 금지·주석·타입·스타일 토큰 등)은 seokit-rules + lint 가 강제한다. 아래는 **구조 규약** 확인 항목.

- [ ] 컴포넌트가 단일 책임 원칙을 따르는가? (관심사 분리)
- [ ] 공통으로 사용될 컴포넌트가 `@ddd/ui`에 있는가?
- [ ] 앱/패키지 의존 방향이 `apps/* → packages/*` 단방향인가?
- [ ] 페이지 전용 코드가 `pages/{page}/` 안에 콜로케이션되어 있는가? 페이지끼리 import 하지 않는가? (§1 #4)
- [ ] 2개 이상 페이지가 쓰는 코드만 `shared/` 에 있는가?
- [ ] barrel(`index.ts`) 이나 `components/` 하위 서브폴더를 새로 만들지 않았는가? (§1 #5)
- [ ] 컴포넌트·흐름 훅이 `@ddd/api` 의 wrapper hook (`useXxx`) 을 직접 import 하지 않고, `xxxQueries` / `xxxMutations` 옵션 팩토리를 `useQuery` / `useMutation` 에 전달하는가? (§2.2)
- [ ] 비즈니스 로직(toast / 라우팅 / 캐시 정리 / 다중 쿼리 조합 / 응답 가공 / 클라이언트 필터·집계) 이 컴포넌트가 아니라 `pages/{page}/hooks/` 흐름 훅으로 분리되어 있는가? (§2.2)
