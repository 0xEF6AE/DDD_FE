---
name: admin-heroui
description: |
  apps/admin에서 UI 컴포넌트를 생성/수정/삭제/교체할 때 자동 호출되는 스킬.
  HeroUI v3 단일 통로 원칙을 강제하고, docs/hero-ui.txt 를 단일 출처로 확인한 뒤
  작업하도록 안내한다. shared/ui 배치 기준과 금지 패턴을 포함한다.

  사용 시점:
  - apps/admin 에서 UI 컴포넌트를 새로 만들거나 수정할 때
  - `@heroui/react` 컴포넌트를 선택하거나 사용법을 확인할 때
  - `shared/ui/` 에 새 컴포넌트를 추가하거나 기존 것을 교체할 때
  - 외부 UI 라이브러리(shadcn/ui, MUI, Chakra 등) 도입을 검토할 때 → 차단
  - 커스텀 버튼/입력/모달을 직접 만들려 할 때 → HeroUI 대안 안내
  - `@heroui/react` 가 아닌 경로(`@/shared/ui/button` 등)에서 일반 컴포넌트를 import할 때 → 수정 안내

  예: "버튼 컴포넌트 만들어줘", "테이블 헤더 수정", "새 Drawer 추가",
      "shadcn/ui 써도 돼?" (이 경우 본 스킬이 거부 사유와 표준 대안을 안내)
---

## 단일 출처

컴포넌트 props·slots·compound 구조 등 **세부 API**는 반드시
**[`docs/hero-ui.txt`](../../../docs/hero-ui.txt)** 를 단일 출처로 확인한다.
본 스킬은 작업 전 환기시킬 핵심 규약 요약본이다.

---

## 작업 순서

1. `docs/hero-ui.txt` 에서 필요한 HeroUI v3 컴포넌트 존재 여부 검색
2. 해당 컴포넌트의 props·slots·compound 구조 확인
3. `@heroui/react` 에서 직접 import해 구현
4. Tailwind CSS 4 + `cn()` 유틸로 커스터마이징

---

## 핵심 규약

### 1. Import 단일 형태

```tsx
// ❌ 금지 — shared/ui 랩퍼
import { Button } from "@/shared/ui/button"

// ✅ 올바름 — HeroUI 직접 import
import { Button, Input, Drawer, Table, Tabs } from "@heroui/react"
```

### 2. shared/ui 배치 기준

`shared/ui/` 에는 **HeroUI에 없는 커스텀 프리미티브만** 배치한다.

| 경로 | 용도 |
| --- | --- |
| `shared/ui/FlexBox.tsx` | flex 레이아웃 유틸 (Tailwind 직접 사용으로 대체 가능) |
| `shared/ui/GridBox.tsx` | grid 레이아웃 유틸 (Tailwind 직접 사용으로 대체 가능) |
| `shared/ui/StatCard.tsx` | 통계 카드 (어드민 전용) |
| `shared/ui/DDDLogo.tsx` | DDD 정적 로고 |
| `shared/ui/DDDAnimated.tsx` | DDD 브랜드 로고 애니메이션 |
| `shared/ui/GoogleButton.tsx` | Google 로그인 버튼 |

Button · Input · Card · Drawer · Table · Modal 등 **HeroUI에 있는 컴포넌트는 shared/ui에 새로 만들지 않는다.**

### 3. 자주 쓰는 컴포넌트 목록

| 카테고리 | 컴포넌트 |
| --- | --- |
| 기본 | Button, Input, Textarea, Checkbox, Radio, Switch |
| 선택 | Select, Autocomplete |
| 폼 | Form, TextField, Label |
| 레이아웃 | Card, Drawer |
| 테이블 | Table, TableHeader, TableBody, TableColumn, TableRow, TableCell |
| 탭 | Tabs, Tab |
| 모달 | Modal, AlertDialog |
| 기타 | Tooltip, Badge, Spinner, Skeleton, Pagination |

---

## 주요 패턴

### Compound Components

HeroUI v3는 compound component 패턴을 사용한다. `docs/hero-ui.txt` 에서 정확한 slot 이름을 반드시 확인할 것.

```tsx
// Card
<Card>
  <Card.Header>제목</Card.Header>
  <Card.Body>본문</Card.Body>
  <Card.Footer>푸터</Card.Footer>
</Card>

// Table
<Table>
  <Table.Header>
    <Table.Column>컬럼명</Table.Column>
  </Table.Header>
  <Table.Body>
    <Table.Row key={item.id}>
      <Table.Cell>{item.value}</Table.Cell>
    </Table.Row>
  </Table.Body>
</Table>

// Tabs
<Tabs>
  <Tab key="a" title="탭A">내용A</Tab>
  <Tab key="b" title="탭B">내용B</Tab>
</Tabs>
```

### Drawer

RAC collection 트리(Table, Tabs 등) **안에서** Drawer를 렌더하면 안 된다.
Drawer는 반드시 collection 트리 **밖(상위 section)**에서 렌더한다.
(참고: `docs/` 내 RAC 오버레이 관련 설명)

### AlertDialog (삭제 확인)

```tsx
<AlertDialog>
  <AlertDialog.Trigger asChild>
    <Button variant="destructive">삭제</Button>
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>정말 삭제하시겠습니까?</AlertDialog.Title>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>취소</AlertDialog.Cancel>
      <AlertDialog.Action onPress={handleDelete}>삭제</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog>
```

---

## 금지 사항 (Anti-pattern)

- ❌ `shadcn/ui`, MUI, Chakra 등 외부 UI 라이브러리 추가 설치
- ❌ HeroUI 컴포넌트를 `shared/ui/`에서 재래핑 (Button, Input 등)
- ❌ collection 트리 내부에서 Drawer/Modal 렌더 (RAC 충돌)
- ❌ `docs/hero-ui.txt` 확인 없이 props 추측으로 구현 (slot 이름이 문서와 다를 수 있음)

---

**마지막 수정**: 2026-05-08
