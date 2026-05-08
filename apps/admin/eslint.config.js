import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * `@ddd/api` 의 wrapper hook 들 (CODE_RULES §3.3 #5 — deprecate-then-remove 단계 1).
 * 이 목록의 훅을 import 하면 ESLint 가 차단한다.
 * 옵션 팩토리(`xxxQueries` / `xxxMutations`)를 `useQuery` / `useMutation` 에 전달해야 한다.
 */
const DEPRECATED_DDD_API_WRAPPER_HOOKS = [
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
        'warn',
        {
          paths: [
            {
              name: '@ddd/api',
              importNames: DEPRECATED_DDD_API_WRAPPER_HOOKS,
              message:
                '@ddd/api 의 wrapper hook 은 더 이상 사용하지 않는다. xxxQueries / xxxMutations 옵션 팩토리를 useQuery / useMutation 에 직접 전달하라 (CODE_RULES §3.3 #5). 잔여 사용처가 모두 마이그레이션되면 후속 PR 에서 error 로 승격한다.',
            },
          ],
        },
      ],
    },
  },
])
