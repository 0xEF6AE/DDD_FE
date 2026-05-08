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
