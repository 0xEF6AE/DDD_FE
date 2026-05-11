import type {
  CreateInterviewSlotRequestDto,
  UpdateInterviewSlotRequestDto,
  CreateInterviewReservationRequestDto,
  InterviewListSlotsParams,
  InterviewSlotResponseDto,
  InterviewReservationResponseDto,
  InterviewListSlots200,
  InterviewGetSlot200,
  InterviewCreateSlot201,
  InterviewCreateReservation201,
} from "../generated/dddApi.schemas";

// GET /api/v1/admin/interview-slots - 면접 슬롯 목록 조회
export type GetInterviewSlotsParams = InterviewListSlotsParams;
export type GetInterviewSlotsResponse = InterviewListSlots200;

// GET /api/v1/admin/interview-slots/{id} - 면접 슬롯 단일 조회
export type GetInterviewSlotParams = { id: number };
export type GetInterviewSlotResponse = InterviewGetSlot200;

// POST /api/v1/admin/interview-slots - 면접 슬롯 생성
export type PostCreateInterviewSlotRequest = CreateInterviewSlotRequestDto;
export type PostCreateInterviewSlotResponse = InterviewCreateSlot201;

// PATCH /api/v1/admin/interview-slots/{id} - 면접 슬롯 수정
export type PatchUpdateInterviewSlotParams = { id: number };
export type PatchUpdateInterviewSlotRequest = UpdateInterviewSlotRequestDto;
export type PatchUpdateInterviewSlotResponse = void;

// DELETE /api/v1/admin/interview-slots/{id} - 면접 슬롯 삭제
export type DeleteInterviewSlotParams = { id: number };
export type DeleteInterviewSlotResponse = void;

// POST /api/v1/admin/interview-slots/{slotId}/reservations - 면접 예약
export type PostCreateInterviewReservationParams = { slotId: number };
export type PostCreateInterviewReservationRequest =
  CreateInterviewReservationRequestDto;
export type PostCreateInterviewReservationResponse = InterviewCreateReservation201;

// DELETE /api/v1/admin/interview-slots/reservations/{reservationId} - 면접 예약 취소
export type DeleteInterviewReservationParams = { reservationId: number };
export type DeleteInterviewReservationResponse = void;

// 도메인 엔티티 타입
export type InterviewSlot = InterviewSlotResponseDto;
export type InterviewReservation = InterviewReservationResponseDto;
