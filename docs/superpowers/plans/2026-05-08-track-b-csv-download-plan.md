# 구현 플랜 — Track B: CSV 다운로드 옵션 팩토리 일원화

**브랜치**: `refactor/early-notification-csv-factory`  
**스펙**: [docs/superpowers/specs/2026-05-08-cohort-parts-and-csv-download-design.md](../specs/2026-05-08-cohort-parts-and-csv-download-design.md)  
**예상 소요**: ~1시간  
**PR 병합 우선순위**: Track A 보다 먼저 (독립, 가치 즉시 회수)

---

## 사전 확인

- [ ] `earlyNotificationQueries.getAdminEarlyNotificationsCsv` 가 `packages/api/src/early-notification/queries.ts` 에 존재함 (확인 완료)
- [ ] `EarlyNotificationToolbar` 의 `onExportCsv` / `isExporting` / `isExportDisabled` props 시그니처 변경 없음

---

## Step 1 — `lib/triggerCsvDownload.ts` 신설

**파일**: `apps/admin/src/pages/early-notification/lib/triggerCsvDownload.ts`

기존 `downloadEarlyNotificationsCsv.ts` 에서 API 호출 부분 **제외** 후 순수 함수만 추출.

```ts
const BOM = "﻿"

const formatYyyyMmDd = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}${m}${day}`
}

const sanitizeFilenameSegment = (s: string): string =>
  // eslint-disable-next-line no-control-regex
  s.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_")

export function triggerCsvDownload({
  csv,
  cohortName,
}: {
  csv: string
  cohortName: string
}): void {
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `사전알림_${sanitizeFilenameSegment(cohortName)}_${formatYyyyMmDd(new Date())}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

---

## Step 2 — `hooks/useDownloadEarlyNotificationsCsv.ts` 신설

**파일**: `apps/admin/src/pages/early-notification/hooks/useDownloadEarlyNotificationsCsv.ts`

```ts
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "@heroui/react"

import { earlyNotificationQueries } from "@ddd/api"

import { triggerCsvDownload } from "../lib/triggerCsvDownload"

export const useDownloadEarlyNotificationsCsv = () => {
  const queryClient = useQueryClient()
  const [isExporting, setIsExporting] = useState(false)

  const download = async ({
    cohortId,
    cohortName,
  }: {
    cohortId: number
    cohortName: string
  }) => {
    setIsExporting(true)
    try {
      const csv = await queryClient.fetchQuery({
        ...earlyNotificationQueries.getAdminEarlyNotificationsCsv({
          params: { cohortId },
        }),
        staleTime: 0,
        gcTime: 0,
      })
      triggerCsvDownload({ csv, cohortName })
    } catch (error) {
      toast.danger("CSV 내보내기에 실패했습니다", {
        description:
          error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요.",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return { download, isExporting }
}
```

---

## Step 3 — `EarlyNotificationContent.tsx` 교체

**파일**: `apps/admin/src/pages/early-notification/EarlyNotificationContent.tsx`

제거:
- `import { downloadEarlyNotificationsCsv } from "./lib/downloadEarlyNotificationsCsv"`
- `const [isExporting, setIsExporting] = useState(false)`
- `handleExport` async 함수 전체

추가:
- `import { useDownloadEarlyNotificationsCsv } from "./hooks/useDownloadEarlyNotificationsCsv"`
- `const { download: handleExport, isExporting } = useDownloadEarlyNotificationsCsv()`

Toolbar 호출부:
```tsx
onExportCsv={() =>
  handleExport({ cohortId: effectiveCohortId, cohortName: selectedCohort.name })
}
isExporting={isExporting}
isExportDisabled={isExporting}
```
— 시그니처 변경 없음.

---

## Step 4 — `lib/downloadEarlyNotificationsCsv.ts` 삭제

파일 삭제. 더 이상 import 없음을 Step 3 완료 후 확인.

---

## 체크리스트

- [ ] Step 1: `triggerCsvDownload.ts` 신설
- [ ] Step 2: `useDownloadEarlyNotificationsCsv.ts` 신설
- [ ] Step 3: `EarlyNotificationContent.tsx` 교체
- [ ] Step 4: `downloadEarlyNotificationsCsv.ts` 삭제
- [ ] TypeScript 컴파일 에러 없음 (`pnpm --filter @ddd/admin tsc --noEmit`)
- [ ] 린트 통과 (`pnpm --filter @ddd/admin lint`)
- [ ] CSV 버튼 클릭 → 다운로드 동작 확인 (dev server)
- [ ] 실패 케이스 (네트워크 차단) → toast.danger 표시 확인
