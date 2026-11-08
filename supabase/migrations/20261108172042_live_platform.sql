-- Dialife live platform. Additive schema; no applicant or customer data is seeded.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table private.bootstrap_admin_emails(email text primary key check(email=lower(email)));
revoke all on private.bootstrap_admin_emails from public,anon,authenticated;
insert into private.bootstrap_admin_emails(email) values ('admin@dialifeva.com');

alter table public.platform_profiles add column if not exists avatar_url text;
alter table public.candidate_applications add column if not exists user_id uuid references auth.users(id);
alter table public.candidate_applications add column if not exists reviewed_at timestamptz;
alter table public.candidate_applications add column if not exists review_notes text not null default '';
alter table public.candidate_applications drop constraint candidate_applications_status_check;
alter table public.candidate_applications add constraint candidate_applications_status_check check(status in ('new','reviewing','shortlisted','declined','admitted','enrolled','completed','certified','placed'));

create table public.training_programs (
 id uuid primary key default gen_random_uuid(), title text not null check(length(trim(title)) between 2 and 160), description text not null default '', duration_weeks int not null default 4 check(duration_weeks between 1 and 104), status text not null default 'draft' check(status in ('draft','published','archived')), created_by uuid references auth.users(id) default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.program_modules (
 id uuid primary key default gen_random_uuid(), program_id uuid not null references public.training_programs(id) on delete cascade, title text not null check(length(trim(title)) between 2 and 160), description text not null default '', position int not null check(position>0), created_at timestamptz not null default now(), unique(program_id,position)
);
create table public.training_lessons (
 id uuid primary key default gen_random_uuid(), module_id uuid not null references public.program_modules(id) on delete cascade, title text not null check(length(trim(title)) between 2 and 160), content text not null default '', resource_url text, position int not null check(position>0), duration_minutes int not null default 30 check(duration_minutes between 1 and 600), status text not null default 'draft' check(status in ('draft','published','archived')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(module_id,position)
);
alter table public.training_cohorts add column if not exists program_id uuid references public.training_programs(id);
alter table public.training_cohorts add column if not exists capacity int not null default 30 check(capacity between 1 and 1000);
alter table public.training_cohorts add column if not exists updated_at timestamptz not null default now();
alter table public.training_cohorts add constraint cohort_dates_valid check(end_date is null or start_date is null or end_date>=start_date);
alter table public.cohort_enrollments add column if not exists created_at timestamptz not null default now();
alter table public.cohort_enrollments add constraint enrollment_status_valid check(status in ('enrolled','active','completed','withdrawn'));
alter table public.cohort_enrollments add constraint enrollment_identity unique(id,trainee_id);
create table public.cohort_trainers (
 id uuid primary key default gen_random_uuid(), cohort_id uuid not null references public.training_cohorts(id) on delete cascade, trainer_id uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(cohort_id,trainer_id)
);
create table public.lesson_progress (
 id uuid primary key default gen_random_uuid(), lesson_id uuid not null references public.training_lessons(id) on delete cascade, user_id uuid not null references auth.users(id) default auth.uid(), completed boolean not null default false, completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(lesson_id,user_id)
);
create table public.training_sessions (
 id uuid primary key default gen_random_uuid(), cohort_id uuid not null references public.training_cohorts(id), title text not null check(length(trim(title)) between 2 and 160), starts_at timestamptz not null, ends_at timestamptz not null, meeting_url text, status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')), created_by uuid not null references auth.users(id) default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at>starts_at)
);
create table public.attendance_records (
 id uuid primary key default gen_random_uuid(), session_id uuid not null references public.training_sessions(id) on delete cascade, trainee_id uuid not null references auth.users(id), status text not null default 'present' check(status in ('present','absent','late','excused')), notes text not null default '', recorded_by uuid not null references auth.users(id) default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(session_id,trainee_id)
);
alter table public.training_assignments add column if not exists assessment_type text not null default 'assignment' check(assessment_type in ('assignment','quiz','simulation','practical'));
alter table public.training_assignments add column if not exists updated_at timestamptz not null default now();
alter table public.assignment_submissions add constraint submission_score_valid check(score is null or score between 0 and 100);
alter table public.assignment_submissions add constraint submission_once unique(assignment_id,trainee_id);
create table public.certificates (
 id uuid primary key default gen_random_uuid(), enrollment_id uuid not null unique, user_id uuid not null references auth.users(id), certificate_number text not null unique default ('DVA-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))), issued_at timestamptz not null default now(), status text not null default 'issued' check(status in ('issued','revoked')), notes text not null default '', created_at timestamptz not null default now(), foreign key(enrollment_id,user_id) references public.cohort_enrollments(id,trainee_id)
);
create table public.employer_organizations (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 2 and 160), country text not null, time_zone text not null default 'UTC', contact_email text, status text not null default 'onboarding' check(status in ('onboarding','active','inactive')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.organization_memberships (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.employer_organizations(id) on delete cascade, user_id uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(organization_id,user_id)
);
create table public.candidate_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(), display_name text not null, bio text not null default '', skills text not null default '', time_zone text not null default 'Africa/Nairobi', availability text not null default 'Not specified', published boolean not null default false, readiness text not null default 'training' check(readiness in ('training','ready','placed')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.staffing_requests (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.employer_organizations(id), title text not null check(length(trim(title)) between 2 and 160), requirements text not null, headcount int not null default 1 check(headcount between 1 and 1000), time_zone text not null default 'UTC', status text not null default 'open' check(status in ('draft','open','matching','interviewing','filled','closed')), created_by uuid not null references auth.users(id) default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.candidate_matches (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.staffing_requests(id) on delete cascade, candidate_id uuid not null references auth.users(id), status text not null default 'shortlisted' check(status in ('shortlisted','interviewing','offered','placed','declined')), notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(request_id,candidate_id)
);
create table public.interviews (
 id uuid primary key default gen_random_uuid(), match_id uuid not null references public.candidate_matches(id), starts_at timestamptz not null, duration_minutes int not null default 30 check(duration_minutes between 10 and 240), meeting_url text, status text not null default 'scheduled' check(status in ('scheduled','completed','cancelled')), feedback text not null default '', created_by uuid not null references auth.users(id) default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.placements (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.staffing_requests(id), medical_va_id uuid not null references auth.users(id), title text not null check(length(trim(title)) between 2 and 160), start_date date not null, end_date date, status text not null default 'onboarding' check(status in ('onboarding','active','completed','ended')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(end_date is null or end_date>=start_date), unique(id,medical_va_id)
);
create table public.va_tasks (
 id uuid primary key default gen_random_uuid(), placement_id uuid not null references public.placements(id), title text not null check(length(trim(title)) between 2 and 160), description text not null default '', due_at timestamptz, priority text not null default 'normal' check(priority in ('low','normal','high')), status text not null default 'todo' check(status in ('todo','in_progress','done')), notes text not null default '', created_by uuid not null references auth.users(id) default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.work_schedules (
 id uuid primary key default gen_random_uuid(), placement_id uuid not null references public.placements(id), title text not null, starts_at timestamptz not null, ends_at timestamptz not null, time_zone text not null default 'UTC', notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at>starts_at)
);
create table public.timesheets (
 id uuid primary key default gen_random_uuid(), placement_id uuid not null, user_id uuid not null references auth.users(id) default auth.uid(), work_date date not null, minutes_worked int not null check(minutes_worked between 1 and 1440), description text not null, status text not null default 'draft' check(status in ('draft','submitted','approved','rejected')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), foreign key(placement_id,user_id) references public.placements(id,medical_va_id), unique(placement_id,work_date)
);
create table public.support_tickets (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) default auth.uid(), assigned_to uuid references auth.users(id), title text not null check(length(trim(title)) between 2 and 160), description text not null, priority text not null default 'normal' check(priority in ('low','normal','high')), status text not null default 'open' check(status in ('open','in_progress','resolved','closed')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.ticket_messages (
 id uuid primary key default gen_random_uuid(), ticket_id uuid not null references public.support_tickets(id) on delete cascade, author_id uuid not null references auth.users(id) default auth.uid(), body text not null check(length(trim(body)) between 1 and 10000), created_at timestamptz not null default now()
);
create table public.calendar_events (
 id uuid primary key default gen_random_uuid(), title text not null check(length(trim(title)) between 2 and 160), description text not null default '', starts_at timestamptz not null, ends_at timestamptz not null, audience text not null default 'all' check(audience in ('all','cohort','organization','individual')), cohort_id uuid references public.training_cohorts(id), organization_id uuid references public.employer_organizations(id), user_id uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(ends_at>starts_at), check((audience='all' and cohort_id is null and organization_id is null and user_id is null) or (audience='cohort' and cohort_id is not null and organization_id is null and user_id is null) or (audience='organization' and organization_id is not null and cohort_id is null and user_id is null) or (audience='individual' and user_id is not null and cohort_id is null and organization_id is null))
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id), title text not null, body text not null default '', read_at timestamptz, created_at timestamptz not null default now()
);
create table public.activity_events (
 id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id), entity_type text not null, entity_id text not null, action text not null, summary text not null, created_at timestamptz not null default now()
);
create table public.documents (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) default auth.uid(), original_name text not null, object_path text not null unique, mime_type text not null, size_bytes bigint not null check(size_bytes between 1 and 10485760), category text not null default 'general' check(category in ('general','application','learning','contract','simulation')), created_at timestamptz not null default now(), check(object_path like owner_id::text||'/%')
);
create table public.simulation_scenarios (
 id uuid primary key default gen_random_uuid(), program_id uuid references public.training_programs(id), title text not null, instructions text not null, difficulty text not null default 'foundation' check(difficulty in ('foundation','intermediate','advanced')), status text not null default 'draft' check(status in ('draft','published','archived')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.simulation_sessions (
 id uuid primary key default gen_random_uuid(), scenario_id uuid not null references public.simulation_scenarios(id), trainee_id uuid not null references auth.users(id) default auth.uid(), cohort_id uuid references public.training_cohorts(id), transcript text not null default '', audio_document_id uuid references public.documents(id), status text not null default 'practice' check(status in ('practice','completed','reviewed')), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.simulation_evaluations (
 id uuid primary key default gen_random_uuid(), session_id uuid not null unique references public.simulation_sessions(id), reviewer_id uuid not null references auth.users(id) default auth.uid(), score numeric not null check(score between 0 and 100), feedback text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- Authorization helpers return booleans only; privileged lookups stay in an unexposed schema.
create function private.signed_in() returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null and is_anonymous is not true)
$$;
create function private.has_role(wanted text[]) returns boolean language sql stable security definer set search_path='' as $$
 select private.signed_in() and exists(select 1 from public.platform_profiles where user_id=auth.uid() and role=any(wanted))
$$;
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$ select private.has_role(array['admin']) $$;
create function private.teaches_cohort(cid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.has_role(array['trainer']) and exists(select 1 from public.cohort_trainers where cohort_id=cid and trainer_id=auth.uid())
$$;
create function private.enrolled_in(cid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.signed_in() and exists(select 1 from public.cohort_enrollments where cohort_id=cid and trainee_id=auth.uid() and status<>'withdrawn')
$$;
create function private.can_cohort(cid uuid) returns boolean language sql stable security definer set search_path='' as $$ select private.is_admin() or private.teaches_cohort(cid) or private.enrolled_in(cid) $$;
create function private.valid_enrollment(cid uuid,uid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.signed_in() and (private.is_admin() or private.teaches_cohort(cid) or uid=auth.uid()) and exists(select 1 from public.cohort_enrollments where cohort_id=cid and trainee_id=uid and status<>'withdrawn')
$$;
create function private.in_org(oid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.has_role(array['employer']) and exists(select 1 from public.organization_memberships where organization_id=oid and user_id=auth.uid())
$$;
create function private.manages_request(rid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_admin() or exists(select 1 from public.staffing_requests where id=rid and private.in_org(organization_id))
$$;
create function private.can_request(rid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.manages_request(rid) or (private.signed_in() and exists(select 1 from public.candidate_matches where request_id=rid and candidate_id=auth.uid()))
$$;
create function private.owns_placement(pid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.signed_in() and exists(select 1 from public.placements where id=pid and medical_va_id=auth.uid())
$$;
create function private.manages_placement(pid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_admin() or exists(select 1 from public.placements where id=pid and private.manages_request(request_id))
$$;
create function private.can_placement(pid uuid) returns boolean language sql stable security definer set search_path='' as $$ select private.manages_placement(pid) or private.owns_placement(pid) $$;
create function private.can_org(oid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_admin() or private.in_org(oid) or (private.signed_in() and exists(select 1 from public.placements p join public.staffing_requests r on r.id=p.request_id where r.organization_id=oid and p.medical_va_id=auth.uid()))
$$;
create function private.can_trainee(uid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_admin() or (private.signed_in() and (uid=auth.uid() or exists(select 1 from public.cohort_enrollments e where e.trainee_id=uid and private.teaches_cohort(e.cohort_id)) or exists(select 1 from public.candidate_matches m join public.candidate_profiles cp on cp.user_id=m.candidate_id where m.candidate_id=uid and cp.published and m.status<>'declined' and private.manages_request(m.request_id))))
$$;
create function private.can_program(pid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_admin() or (private.signed_in() and (exists(select 1 from public.training_programs where id=pid and status='published') or exists(select 1 from public.training_cohorts where program_id=pid and (private.teaches_cohort(id) or private.enrolled_in(id)))))
$$;
create function private.can_lesson(lid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_admin() or (private.signed_in() and exists(select 1 from public.training_lessons l join public.program_modules m on m.id=l.module_id where l.id=lid and private.can_program(m.program_id) and (l.status='published' or exists(select 1 from public.training_cohorts c where c.program_id=m.program_id and private.teaches_cohort(c.id)))))
$$;
create function private.can_ticket(tid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_admin() or (private.signed_in() and exists(select 1 from public.support_tickets where id=tid and (owner_id=auth.uid() or assigned_to=auth.uid())))
$$;
create function private.can_scenario(sid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.is_admin() or (private.signed_in() and exists(select 1 from public.simulation_scenarios where id=sid and status='published' and (program_id is null or private.can_program(program_id))))
$$;

-- Profile creation never trusts a user-editable role claim. The approved owner address must be verified.
create function private.sync_auth_profile() returns trigger language plpgsql security definer set search_path='' as $$
 declare chosen_role text:='applicant';
 begin
  if new.email_confirmed_at is not null and new.is_anonymous is not true and exists(select 1 from private.bootstrap_admin_emails where email=lower(new.email)) then chosen_role:='admin'; end if;
  insert into public.platform_profiles(user_id,display_name,role) values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''),split_part(new.email,'@',1),'Learner'),120),chosen_role)
  on conflict(user_id) do update set role=case when chosen_role='admin' then 'admin' else public.platform_profiles.role end;
  if new.email_confirmed_at is not null then update public.candidate_applications set user_id=new.id where user_id is null and lower(email)=lower(new.email); end if;
  return new;
 end
$$;
create trigger dialife_auth_profile after insert or update of email_confirmed_at on auth.users for each row execute function private.sync_auth_profile();

create function private.guard_record_update() returns trigger language plpgsql set search_path='' as $$
 declare allowed text[];
 begin
  if current_user in ('postgres','supabase_admin','service_role') or private.is_admin() then return new; end if;
  case tg_table_name
   when 'platform_profiles' then allowed:=array['display_name','avatar_url'];
   when 'candidate_profiles' then allowed:=array['display_name','bio','skills','time_zone','availability','published','updated_at'];
   when 'training_sessions' then allowed:=array['title','starts_at','ends_at','meeting_url','status','updated_at'];
   when 'training_assignments' then allowed:=array['title','instructions','due_at','assessment_type','updated_at'];
   when 'cohort_enrollments' then allowed:=array['status'];
   when 'attendance_records' then allowed:=array['status','notes','updated_at'];
   when 'lesson_progress' then allowed:=array['completed','completed_at','updated_at'];
   when 'assignment_submissions' then
    if private.has_role(array['trainer']) then allowed:=array['score','feedback']; else allowed:=array['response']; end if;
   when 'staffing_requests' then allowed:=array['title','requirements','headcount','time_zone','status','updated_at'];
   when 'candidate_matches' then allowed:=array['status','notes','updated_at'];
   when 'interviews' then allowed:=array['starts_at','duration_minutes','meeting_url','status','feedback','updated_at'];
   when 'va_tasks' then
    if private.has_role(array['employer']) then allowed:=array['title','description','due_at','priority','status','notes','updated_at']; else allowed:=array['status','notes','updated_at']; end if;
   when 'work_schedules' then allowed:=array['title','starts_at','ends_at','time_zone','notes','updated_at'];
   when 'timesheets' then
    if private.owns_placement(old.placement_id) then
     if old.status not in ('draft','rejected') or new.status not in ('draft','submitted') then raise exception 'Only draft or rejected time entries can be edited and submitted'; end if;
     allowed:=array['work_date','minutes_worked','description','status','updated_at'];
    else allowed:=array['status','updated_at']; if new.status not in ('approved','rejected') or old.status<>'submitted' then raise exception 'Only submitted timesheets can be reviewed'; end if;
    end if;
   when 'support_tickets' then allowed:=array['title','description','priority','status','updated_at'];
   when 'notifications' then allowed:=array['read_at'];
   when 'simulation_sessions' then
    if new.status='reviewed' then raise exception 'Only a reviewer can record an evaluation'; end if;
    allowed:=array['transcript','audio_document_id','status','updated_at'];
   when 'simulation_evaluations' then allowed:=array['score','feedback','updated_at'];
   else raise exception 'This record cannot be changed by your role';
  end case;
  if (to_jsonb(old)-allowed) is distinct from (to_jsonb(new)-allowed) then raise exception 'Protected record fields cannot be changed'; end if;
  return new;
 end
$$;
create function private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at:=now(); return new; end $$;
create function private.record_activity() returns trigger language plpgsql security definer set search_path='' as $$
 declare data jsonb;
 begin
  if auth.uid() is null then return coalesce(new,old); end if;
  data:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
  insert into public.activity_events(actor_id,entity_type,entity_id,action,summary) values(auth.uid(),tg_table_name,coalesce(data->>'id',data->>'user_id'),lower(tg_op),initcap(lower(tg_op))||' · '||replace(tg_table_name,'_',' '));
  return coalesce(new,old);
 end
$$;
create function private.validate_certificate() returns trigger language plpgsql set search_path='' as $$
 begin
  if new.status='issued' and not exists(select 1 from public.cohort_enrollments where id=new.enrollment_id and trainee_id=new.user_id and status='completed') then raise exception 'Complete the enrollment before issuing a certificate'; end if;
  return new;
 end
$$;
create trigger certificate_completion before insert or update on public.certificates for each row execute function private.validate_certificate();

-- Replace the early preview policies with explicit authenticated ownership policies.
do $$ declare p record; t record; begin
 for p in select policyname,tablename from pg_policies where schemaname='public' loop execute format('drop policy %I on public.%I',p.policyname,p.tablename); end loop;
 for t in select tablename from pg_tables where schemaname='public' loop
  execute format('alter table public.%I enable row level security',t.tablename);
  execute format('revoke all on public.%I from anon,authenticated',t.tablename);
  execute format('grant select,insert,update,delete on public.%I to authenticated',t.tablename);
  execute format('create policy admin_access on public.%I for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))',t.tablename);
  if t.tablename not in ('activity_events','notifications','documents','ticket_messages') then
   execute format('create trigger protect_fields before update on public.%I for each row execute function private.guard_record_update()',t.tablename);
   execute format('create trigger audit_changes after insert or update or delete on public.%I for each row execute function private.record_activity()',t.tablename);
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name=t.tablename and column_name='updated_at') then execute format('create trigger touch_timestamp before update on public.%I for each row execute function private.touch_updated_at()',t.tablename); end if;
 end loop;
end $$;
-- Notifications are read-only except acknowledgement; activity cannot be client-forged.
revoke insert,update,delete on public.activity_events from authenticated;
create trigger protect_notification_fields before update on public.notifications for each row execute function private.guard_record_update();

create policy intake_candidate on public.candidate_applications for insert to anon with check(status='new' and user_id is null);
create policy intake_employer on public.employer_enquiries for insert to anon with check(status='new');
grant insert(full_name,email,phone,country,medical_background,experience_years,motivation) on public.candidate_applications to anon;
grant insert(organization,contact_name,email,country,role_requirements,expected_headcount) on public.employer_enquiries to anon;
create policy applicant_own_read on public.candidate_applications for select to authenticated using(private.signed_in() and user_id=auth.uid());
create function private.own_email(address text) returns boolean language sql stable security definer set search_path='' as $$ select private.signed_in() and exists(select 1 from auth.users where id=auth.uid() and lower(email)=lower(address)) $$;
create policy applicant_submit on public.candidate_applications for insert to authenticated with check(private.own_email(email) and user_id=auth.uid() and status='new');
create policy employer_submit on public.employer_enquiries for insert to authenticated with check(private.own_email(email) and status='new');

create policy profile_read on public.platform_profiles for select to authenticated using(private.can_trainee(user_id));
create policy profile_edit on public.platform_profiles for update to authenticated using(private.signed_in() and user_id=auth.uid()) with check(private.signed_in() and user_id=auth.uid());
create policy program_read on public.training_programs for select to authenticated using(private.can_program(id));
create policy module_read on public.program_modules for select to authenticated using(private.can_program(program_id));
create policy lesson_read on public.training_lessons for select to authenticated using(private.can_lesson(id));
create policy cohort_read on public.training_cohorts for select to authenticated using(private.can_cohort(id));
create policy trainer_assignment_read on public.cohort_trainers for select to authenticated using(private.can_cohort(cohort_id));
create policy enrollment_read on public.cohort_enrollments for select to authenticated using(private.signed_in() and (trainee_id=auth.uid() or private.teaches_cohort(cohort_id)));
create policy enrollment_trainer_update on public.cohort_enrollments for update to authenticated using(private.teaches_cohort(cohort_id)) with check(private.teaches_cohort(cohort_id));
create policy progress_own on public.lesson_progress for all to authenticated using(private.signed_in() and user_id=auth.uid()) with check(private.signed_in() and user_id=auth.uid() and private.can_lesson(lesson_id));
create policy progress_trainer_read on public.lesson_progress for select to authenticated using(private.can_trainee(user_id) and private.has_role(array['trainer']));
create policy session_read on public.training_sessions for select to authenticated using(private.can_cohort(cohort_id));
create policy session_trainer on public.training_sessions for all to authenticated using(private.teaches_cohort(cohort_id)) with check(private.teaches_cohort(cohort_id) and created_by=auth.uid());
create policy attendance_read on public.attendance_records for select to authenticated using(private.signed_in() and (trainee_id=auth.uid() or exists(select 1 from public.training_sessions s where s.id=session_id and private.teaches_cohort(s.cohort_id))));
create policy attendance_trainer on public.attendance_records for all to authenticated using(exists(select 1 from public.training_sessions s where s.id=session_id and private.teaches_cohort(s.cohort_id))) with check(recorded_by=auth.uid() and exists(select 1 from public.training_sessions s where s.id=session_id and private.teaches_cohort(s.cohort_id) and private.valid_enrollment(s.cohort_id,trainee_id)));
create policy assignment_read on public.training_assignments for select to authenticated using(private.can_cohort(cohort_id));
create policy assignment_trainer on public.training_assignments for all to authenticated using(private.teaches_cohort(cohort_id)) with check(private.teaches_cohort(cohort_id));
create policy submission_read on public.assignment_submissions for select to authenticated using(private.signed_in() and (trainee_id=auth.uid() or exists(select 1 from public.training_assignments a where a.id=assignment_id and private.teaches_cohort(a.cohort_id))));
create policy submission_create on public.assignment_submissions for insert to authenticated with check(private.signed_in() and trainee_id=auth.uid() and score is null and feedback is null and exists(select 1 from public.training_assignments a where a.id=assignment_id and private.enrolled_in(a.cohort_id)));
create policy submission_own_update on public.assignment_submissions for update to authenticated using(private.signed_in() and trainee_id=auth.uid() and score is null) with check(trainee_id=auth.uid() and score is null and feedback is null and exists(select 1 from public.training_assignments a where a.id=assignment_id and private.enrolled_in(a.cohort_id)));
create policy submission_trainer_update on public.assignment_submissions for update to authenticated using(exists(select 1 from public.training_assignments a where a.id=assignment_id and private.teaches_cohort(a.cohort_id))) with check(exists(select 1 from public.training_assignments a where a.id=assignment_id and private.teaches_cohort(a.cohort_id)));
create policy certificate_read on public.certificates for select to authenticated using(private.signed_in() and user_id=auth.uid());
create policy organization_read on public.employer_organizations for select to authenticated using(private.can_org(id));
create policy membership_read on public.organization_memberships for select to authenticated using(private.in_org(organization_id));
create policy candidate_read on public.candidate_profiles for select to authenticated using(private.can_trainee(user_id));
create policy candidate_create on public.candidate_profiles for insert to authenticated with check(private.signed_in() and user_id=auth.uid() and readiness='training');
create policy candidate_update on public.candidate_profiles for update to authenticated using(private.signed_in() and user_id=auth.uid()) with check(private.signed_in() and user_id=auth.uid());
create policy request_read on public.staffing_requests for select to authenticated using(private.can_request(id));
create policy request_employer on public.staffing_requests for all to authenticated using(private.in_org(organization_id)) with check(private.in_org(organization_id) and created_by=auth.uid());
create policy match_read on public.candidate_matches for select to authenticated using(private.signed_in() and (candidate_id=auth.uid() or private.manages_request(request_id)));
create policy match_employer_update on public.candidate_matches for update to authenticated using(private.manages_request(request_id)) with check(private.manages_request(request_id));
create policy interview_read on public.interviews for select to authenticated using(exists(select 1 from public.candidate_matches m where m.id=match_id and (m.candidate_id=auth.uid() or private.manages_request(m.request_id))));
create policy interview_employer on public.interviews for all to authenticated using(exists(select 1 from public.candidate_matches m where m.id=match_id and private.manages_request(m.request_id))) with check(created_by=auth.uid() and exists(select 1 from public.candidate_matches m where m.id=match_id and private.manages_request(m.request_id)));
create policy placement_read on public.placements for select to authenticated using(private.can_placement(id));
create policy task_read on public.va_tasks for select to authenticated using(private.can_placement(placement_id));
create policy task_create on public.va_tasks for insert to authenticated with check(private.manages_placement(placement_id) and created_by=auth.uid());
create policy task_update on public.va_tasks for update to authenticated using(private.can_placement(placement_id)) with check(private.can_placement(placement_id));
create policy schedule_read on public.work_schedules for select to authenticated using(private.can_placement(placement_id));
create policy schedule_employer on public.work_schedules for all to authenticated using(private.manages_placement(placement_id)) with check(private.manages_placement(placement_id));
create policy timesheet_read on public.timesheets for select to authenticated using(private.can_placement(placement_id));
create policy timesheet_create on public.timesheets for insert to authenticated with check(private.signed_in() and user_id=auth.uid() and private.owns_placement(placement_id) and status in ('draft','submitted'));
create policy timesheet_update on public.timesheets for update to authenticated using(private.can_placement(placement_id)) with check(private.can_placement(placement_id));
create policy ticket_read on public.support_tickets for select to authenticated using(private.can_ticket(id));
create policy ticket_create on public.support_tickets for insert to authenticated with check(private.signed_in() and owner_id=auth.uid() and assigned_to is null and status='open');
create policy ticket_update on public.support_tickets for update to authenticated using(private.can_ticket(id)) with check(private.can_ticket(id));
create policy message_read on public.ticket_messages for select to authenticated using(private.can_ticket(ticket_id));
create policy message_create on public.ticket_messages for insert to authenticated with check(private.can_ticket(ticket_id) and author_id=auth.uid());
create policy calendar_read on public.calendar_events for select to authenticated using(private.signed_in() and (audience='all' or (audience='cohort' and private.can_cohort(cohort_id)) or (audience='organization' and private.in_org(organization_id)) or (audience='individual' and user_id=auth.uid())));
create policy notification_read on public.notifications for select to authenticated using(private.signed_in() and user_id=auth.uid());
create policy notification_acknowledge on public.notifications for update to authenticated using(private.signed_in() and user_id=auth.uid()) with check(private.signed_in() and user_id=auth.uid());
create policy activity_own_read on public.activity_events for select to authenticated using(private.signed_in() and actor_id=auth.uid());
create policy document_own on public.documents for all to authenticated using(private.signed_in() and owner_id=auth.uid()) with check(private.signed_in() and owner_id=auth.uid());
create policy scenario_read on public.simulation_scenarios for select to authenticated using(private.can_scenario(id));
create policy simulation_read on public.simulation_sessions for select to authenticated using(private.signed_in() and (trainee_id=auth.uid() or private.teaches_cohort(cohort_id)));
create policy simulation_create on public.simulation_sessions for insert to authenticated with check(private.signed_in() and trainee_id=auth.uid() and status in ('practice','completed') and private.can_scenario(scenario_id) and (cohort_id is null or private.enrolled_in(cohort_id)) and (audio_document_id is null or exists(select 1 from public.documents where id=audio_document_id and owner_id=auth.uid())));
create policy simulation_update on public.simulation_sessions for update to authenticated using(private.signed_in() and trainee_id=auth.uid()) with check(trainee_id=auth.uid() and (audio_document_id is null or exists(select 1 from public.documents where id=audio_document_id and owner_id=auth.uid())));
create policy evaluation_read on public.simulation_evaluations for select to authenticated using(exists(select 1 from public.simulation_sessions s where s.id=session_id and (s.trainee_id=auth.uid() or private.teaches_cohort(s.cohort_id))));
create policy evaluation_trainer on public.simulation_evaluations for all to authenticated using(exists(select 1 from public.simulation_sessions s where s.id=session_id and private.teaches_cohort(s.cohort_id))) with check(reviewer_id=auth.uid() and exists(select 1 from public.simulation_sessions s where s.id=session_id and private.teaches_cohort(s.cohort_id)));

-- Private file storage; the API uses short-lived signed URLs after authorization.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('dialife-private','dialife-private',false,10485760,array['application/pdf','image/jpeg','image/png','text/plain','audio/mpeg','audio/wav','audio/webm','application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
create policy dialife_private_files_read on storage.objects for select to authenticated using(bucket_id='dialife-private' and private.signed_in() and (private.is_admin() or (storage.foldername(name))[1]=auth.uid()::text));
create policy dialife_private_files_insert on storage.objects for insert to authenticated with check(bucket_id='dialife-private' and private.signed_in() and (storage.foldername(name))[1]=auth.uid()::text);
create policy dialife_private_files_delete on storage.objects for delete to authenticated using(bucket_id='dialife-private' and private.signed_in() and (private.is_admin() or (storage.foldername(name))[1]=auth.uid()::text));

-- Index relation keys used by authorization and operational lists.
do $$ declare c record; begin
 for c in select a.attrelid::regclass as rel,a.attname from pg_attribute a join pg_class t on t.oid=a.attrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public' and t.relkind='r' and a.attnum>0 and not a.attisdropped and a.attname like '%\_id' escape '\' and not exists(select 1 from pg_index i where i.indrelid=a.attrelid and i.indkey[0]=a.attnum and i.indisvalid) loop
  execute format('create index if not exists %I on %s(%I)',replace(c.rel::text,'public.','')||'_'||c.attname||'_idx',c.rel,c.attname);
 end loop;
end $$;
create index activity_events_created_idx on public.activity_events(created_at desc);
create index notifications_user_unread_idx on public.notifications(user_id,read_at);
create index calendar_events_starts_idx on public.calendar_events(starts_at);

-- Limit function execution to authenticated requests; trigger functions have no public API.
revoke all on all functions in schema private from public,anon;
grant execute on function private.signed_in(),private.has_role(text[]),private.is_admin(),private.teaches_cohort(uuid),private.enrolled_in(uuid),private.can_cohort(uuid),private.valid_enrollment(uuid,uuid),private.in_org(uuid),private.manages_request(uuid),private.can_request(uuid),private.owns_placement(uuid),private.manages_placement(uuid),private.can_placement(uuid),private.can_org(uuid),private.can_trainee(uuid),private.can_program(uuid),private.can_lesson(uuid),private.can_ticket(uuid),private.can_scenario(uuid),private.own_email(text) to authenticated;

-- Enrollment capacity is enforced under a cohort row lock, including concurrent admissions.
create function private.validate_enrollment() returns trigger language plpgsql security definer set search_path='' as $$
declare max_capacity int; current_count int;
begin
 if not exists(select 1 from public.platform_profiles where user_id=new.trainee_id and role in ('applicant','medical_va')) then raise exception 'Choose an applicant or Medical VA for enrollment'; end if;
 select capacity into max_capacity from public.training_cohorts where id=new.cohort_id for update;
 if new.status<>'withdrawn' then
  select count(*) into current_count from public.cohort_enrollments where cohort_id=new.cohort_id and status<>'withdrawn' and id<>new.id;
  if current_count>=max_capacity then raise exception 'This cohort has reached its capacity'; end if;
 end if;
 return new;
end $$;
create trigger enrollment_capacity before insert or update on public.cohort_enrollments for each row execute function private.validate_enrollment();
create function private.validate_staff_assignment() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='cohort_trainers' then if not exists(select 1 from public.platform_profiles where user_id=new.trainer_id and role='trainer') then raise exception 'Choose a trainer account'; end if; end if;
 if tg_table_name='organization_memberships' then if not exists(select 1 from public.platform_profiles where user_id=new.user_id and role in ('employer','admin')) then raise exception 'Choose an employer account'; end if; end if;
 return new;
end $$;
create trigger trainer_role before insert or update on public.cohort_trainers for each row execute function private.validate_staff_assignment();
create trigger employer_role before insert or update on public.organization_memberships for each row execute function private.validate_staff_assignment();
revoke all on function private.validate_enrollment(),private.validate_staff_assignment() from public,anon,authenticated;
