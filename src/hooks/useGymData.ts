import { useQuery } from "@tanstack/react-query";

import {
  fetchAttendanceServer,
  fetchMembersServer,
  fetchMemberRequestsServer,
  fetchPaymentsServer,
} from "@/lib/dashboard.functions";

export const useMembers = () =>
  useQuery({
    queryKey: ["members"],
    queryFn: () => fetchMembersServer(),
    staleTime: 15_000,
    refetchInterval: 10_000,
  });

export const useAttendance = () =>
  useQuery({
    queryKey: ["attendance"],
    queryFn: () => fetchAttendanceServer(),
    staleTime: 15_000,
    refetchInterval: 10_000,
  });

export const usePayments = () =>
  useQuery({
    queryKey: ["payments"],
    queryFn: () => fetchPaymentsServer(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

export const useMemberRequests = () =>
  useQuery({
    queryKey: ["member_requests"],
    queryFn: () => fetchMemberRequestsServer(),
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
