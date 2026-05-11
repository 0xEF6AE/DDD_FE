// GET /api/v1/users/me - 내 정보 조회
import type { MeResponseDto, UsersMe200 } from "../generated/dddApi.schemas";

/** 내 정보 조회 응답 래퍼 (code, message, data 포함) */
export type GetMeResponse = UsersMe200;

/** 내 정보 데이터 (data 필드 내부) */
export type MeUser = MeResponseDto;
