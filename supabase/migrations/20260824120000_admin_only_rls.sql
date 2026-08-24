-- Tighten RLS: only admin can manage members, attendance, payments.
-- Drop old policies that allowed staff too.
DROP POLICY IF EXISTS "staff manage members" ON public.members;
DROP POLICY IF EXISTS "staff manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "staff manage payments" ON public.payments;

-- Re-create policies restricted to admin only.
CREATE POLICY "admin manage members" ON public.members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin manage attendance" ON public.attendance FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin manage payments" ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
