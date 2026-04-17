-- Smoke check RLS posture for anon/authenticated/service roles.
-- This intentionally validates policy wiring and does not assert business-level row ownership.

begin;

set local role postgres;

-- anon role: should be unable to read profiles by default.
set local role anon;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000000';
do $$
begin
  perform 1 from public.profiles limit 1;
  raise notice 'anon query executed (expected to return 0 rows in typical setup)';
exception when others then
  raise exception 'anon smoke check failed: %', sqlerrm;
end;
$$;

-- authenticated role: query should parse and run under authenticated policy context.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
do $$
begin
  perform 1 from public.profiles limit 1;
exception when others then
  raise exception 'authenticated smoke check failed: %', sqlerrm;
end;
$$;

-- service role: full-access policy check on profiles.
set local role service_role;
do $$
begin
  perform 1 from public.profiles limit 1;
exception when others then
  raise exception 'service_role smoke check failed: %', sqlerrm;
end;
$$;

rollback;
