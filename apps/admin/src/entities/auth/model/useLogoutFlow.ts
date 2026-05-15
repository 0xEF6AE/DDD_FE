import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@heroui/react"
import { authMutations } from "@ddd/api"
import { paths } from "@/shared/lib/paths"

export const useLogoutFlow = () => {
  const { mutate: logout, isPending } = useMutation(authMutations.logout())
  const queryClient = useQueryClient()

  const logoutAndRedirect = () =>
    logout(undefined, {
      onSuccess: () => {
        queryClient.clear()
        window.location.replace(paths.login)
      },
      onError: (error) => {
        toast.danger("로그아웃에 실패했습니다", {
          description: error.message || "잠시 후 다시 시도해 주세요.",
        })
      },
    })

  return { logoutAndRedirect, isPending }
}
