import { Button, toast } from "@heroui/react"
import { useMutation } from "@tanstack/react-query"

import { ApiError, storageMutations } from "@ddd/api"
import type { ApplicationAttachmentDto } from "@ddd/api"

type Props = {
  attachment: ApplicationAttachmentDto
}

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) return "-"
  if (bytes < 1024) return `${bytes} B`
  const units = ["KB", "MB", "GB"]
  let value = bytes / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`
}

/**
 * 지원서 답변에 첨부된 PDF 카드.
 *
 * 첨부는 개인정보라 BE 가 공개 URL 을 저장하지 않는다 — 열람 시점마다 서명 URL 을
 * 발급받아 새 탭으로 연다(발급된 URL 은 만료가 있어 상태에 담지 않는다).
 *
 * 지원자용 `GET /applications/attachments/signed-url` 은 업로더 본인에게만 발급되어
 * 운영진이 쓰면 403 이 난다. 그래서 어드민 스토리지 발급창구를 쓴다.
 *
 * TODO(BE 확인): `POST /admin/files/signed-url` 의 path 는 "카테고리 prefix 로 시작"
 * 해야 하고 현재 카테고리는 project-thumbnail / project-pdf / blog-thumbnail 뿐이다.
 * 첨부 경로(`applications/attachments/...`)가 허용 목록에 없으면 400 이 나므로,
 * BE 에 prefix 허용을 요청해둔 상태다.
 */
export const AttachmentAnswer = ({ attachment }: Props) => {
  const signedUrl = useMutation(storageMutations.createSignedUrl())

  const handleOpen = async () => {
    // 팝업 차단을 피하려면 사용자 제스처 안에서 창을 먼저 열고 URL 을 나중에 채운다.
    const popup = window.open("", "_blank")
    try {
      const { url } = await signedUrl.mutateAsync({
        payload: { path: attachment.path, action: "read" },
      })
      if (popup) {
        popup.location.href = url
        return
      }
      window.location.href = url
    } catch (error) {
      popup?.close()
      const isBlocked =
        error instanceof ApiError &&
        (error.is("ATTACHMENT_NOT_OWNED") ||
          error.is("INVALID_FILE_PATH") ||
          error.is("FORBIDDEN"))
      toast.danger(
        isBlocked
          ? "이 첨부를 열 권한이 없습니다. 백엔드에 첨부 경로 허용을 요청해주세요"
          : "첨부를 여는 데 실패했습니다",
        { description: (error as Error).message }
      )
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-default-100 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground">
          {attachment.originalName}
        </p>
        <p className="text-foreground-secondary text-xs">
          PDF · {formatBytes(attachment.size)}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onPress={() => void handleOpen()}
        isDisabled={signedUrl.isPending}
      >
        {signedUrl.isPending ? "여는 중..." : "열기"}
      </Button>
    </div>
  )
}
