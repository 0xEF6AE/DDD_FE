import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * `@ddd/api` 의 옛 wrapper hook 들 (CODE_RULES §3.3 #5).
 * deprecate-then-remove 가 완료되어 packages/api 에서 파일이 삭제됐다.
 * 만일 누군가 같은 이름의 훅을 다시 만들면 이 룰이 차단한다.
 * 옵션 팩토리(`xxxQueries` / `xxxMutations`)를 `useQuery` / `useMutation` 에 전달한다.
 */
const REMOVED_DDD_API_WRAPPER_HOOKS = [
  'useActiveCohort',
  'useAdminApplication',
  'useAdminApplications',
  'useAdminBlogPost',
  'useAdminEarlyNotifications',
  'useAdminEarlyNotificationsCsv',
  'useAdminInfiniteBlogPosts',
  'useAdminInfiniteProjects',
  'useAdminProject',
  'useAdminProjects',
  'useApplicationDraft',
  'useBlogPosts',
  'useCohort',
  'useCohorts',
  'useCreateBlogPost',
  'useCreateCohort',
  'useCreateInterviewReservation',
  'useCreateInterviewSlot',
  'useCreateProject',
  'useDeleteBlogPost',
  'useDeleteCohort',
  'useDeleteInterviewSlot',
  'useDeleteProject',
  'useDiscordAuthorizeUrl',
  'useDiscordLink',
  'useInfiniteBlogPosts',
  'useInfiniteProjects',
  'useInterviewSlot',
  'useInterviewSlots',
  'useLogout',
  'usePatchApplicationStatus',
  'useProject',
  'useProjects',
  'useRefreshToken',
  'useSaveApplicationDraft',
  'useSendBulkEarlyNotification',
  'useSubmitApplication',
  'useSubscribeEarlyNotification',
  'useUpdateBlogPost',
  'useUpdateCohort',
  'useUpdateCohortParts',
  'useUpdateInterviewSlot',
  'useUpdateProject',
  'useUpdateProjectMembers',
  'useUploadFile',
  'useWithdrawal',
]

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@ddd/api',
              importNames: REMOVED_DDD_API_WRAPPER_HOOKS,
              message:
                '@ddd/api 의 wrapper hook 은 제거됐다. xxxQueries / xxxMutations 옵션 팩토리를 useQuery / useMutation 에 직접 전달하라 (CODE_RULES §3.3 #5).',
            },
          ],
        },
      ],
    },
  },
])
