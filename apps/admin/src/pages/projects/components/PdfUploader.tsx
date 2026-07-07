import { Button, toast } from "@heroui/react"
import { useFormContext, useWatch } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"

import { storageMutations } from "@ddd/api"

import type { ProjectFormValues } from "@/pages/projects/lib/projectForm"
import { cn } from "@/shared/lib/cn"

const MAX_PDF_BYTES = 20 * 1024 * 1024 // BE 규칙과 동일 (project-pdf: .pdf 20MB)

/** URL 마지막 세그먼트를 파일명으로 표시 (없으면 전체 URL) */
const fileNameFromUrl = (url: string): string => {
  try {
    const path = new URL(url).pathname
    return decodeURIComponent(path.slice(path.lastIndexOf("/") + 1)) || url
  } catch {
    return url
  }
}

export const PdfUploader = () => {
  const { control, setValue } = useFormContext<ProjectFormValues>()
  const url = useWatch({ control, name: "pdfUrl" })
  const uploadFile = useMutation(storageMutations.uploadFile())

  const handleSelect = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.danger("PDF 파일만 업로드할 수 있습니다")
      return
    }
    if (file.size > MAX_PDF_BYTES) {
      toast.danger("PDF 용량은 최대 20MB 입니다")
      return
    }
    try {
      const formData = new FormData()
      formData.append("file", file)
      const result = await uploadFile.mutateAsync({
        params: { category: "project-pdf" },
        payload: formData,
      })
      setValue("pdfUrl", result.url, { shouldValidate: true })
    } catch (error) {
      toast.danger("PDF 업로드에 실패했습니다", {
        description: (error as Error).message,
      })
    }
  }

  const handleClear = () => setValue("pdfUrl", "", { shouldValidate: true })

  const isUploading = uploadFile.isPending

  return (
    <div className="space-y-2">
      {url ? (
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="truncate text-sm text-blue-600 underline"
          >
            {fileNameFromUrl(url)}
          </a>
          <Button size="sm" variant="outline" onPress={handleClear}>
            제거
          </Button>
        </div>
      ) : (
        <label
          className={cn(
            "flex cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 px-6 py-8 text-center transition hover:border-blue-400",
            isUploading && "pointer-events-none opacity-60",
          )}
        >
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleSelect(file)
              e.target.value = "" // 같은 파일 재선택 허용
            }}
          />
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              {isUploading ? "업로드 중..." : "PDF를 클릭해서 업로드"}
            </p>
            <p className="text-xs text-gray-400">PDF (최대 20MB)</p>
          </div>
        </label>
      )}
    </div>
  )
}
