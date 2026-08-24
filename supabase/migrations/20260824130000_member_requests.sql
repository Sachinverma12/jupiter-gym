CREATE TABLE public.member_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile text NOT NULL,
  age integer,
  gender text,
  plan text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE ON public.member_requests TO authenticated;
GRANT ALL ON public.member_requests TO service_role;
ALTER TABLE public.member_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff manage member requests" ON public.member_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE INDEX idx_member_requests_status ON public.member_requests(status);
CREATE INDEX idx_member_requests_mobile ON public.member_requests(mobile);
