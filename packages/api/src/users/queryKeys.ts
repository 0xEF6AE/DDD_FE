export const usersKeys = {
  /** 사용자 base key */
  all: ["users"] as const,

  /** 내 정보 key */
  me: () => [...usersKeys.all, "me"] as const,
};
