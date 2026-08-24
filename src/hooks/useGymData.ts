import { useQuery } from "@tanstack/react-query";

import { fetchAttendance, fetchMembers, fetchPayments } from "@/services/gym";

export const useMembers = () =>
  useQuery({ queryKey: ["members"], queryFn: () => fetchMembers(), staleTime: 15_000 });

export const useAttendance = () =>
  useQuery({ queryKey: ["attendance"], queryFn: () => fetchAttendance(), staleTime: 15_000 });

export const usePayments = () =>
  useQuery({ queryKey: ["payments"], queryFn: () => fetchPayments(), staleTime: 15_000 });
