-- 008_fix_t38_title.sql
-- The onboarding template task t38 said "all 20 HR policies" but Pulse ships 24
-- HR policies (003/005 seeds). Fix the template title; existing workflow task-
-- status rows reference the task by id, so every live instance picks this up.
-- (Source template frontend/lib/mock/onboarding.ts fixed in the same change.)
begin;
update onboarding_tasks
   set title = 'Read & acknowledge all 24 HR policies'
 where id = 't38'
   and title = 'Read & acknowledge all 20 HR policies';
commit;
