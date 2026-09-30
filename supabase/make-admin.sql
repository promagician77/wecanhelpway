-- ---------------------------------------------------------------------------
-- Promote yourself to the WeCanHelpWay team.
--
-- Sign up through the app first (so auth.users and profiles both exist), then
-- run this with your own email address. /admin unlocks immediately.
-- ---------------------------------------------------------------------------

update public.profiles
   set role = 'admin',
       account_status = 'active'
 where email = 'you@example.com';

-- Confirm it worked:
select id, email, full_name, role, account_status
  from public.profiles
 where role = 'admin';
