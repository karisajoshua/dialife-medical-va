-- Assigned staff may update shared records without taking ownership of them.
drop policy session_trainer on public.training_sessions;
create policy session_trainer_create on public.training_sessions for insert to authenticated with check(private.teaches_cohort(cohort_id) and created_by=auth.uid());
create policy session_trainer_update on public.training_sessions for update to authenticated using(private.teaches_cohort(cohort_id)) with check(private.teaches_cohort(cohort_id));
drop policy attendance_trainer on public.attendance_records;
create policy attendance_trainer_create on public.attendance_records for insert to authenticated with check(recorded_by=auth.uid() and exists(select 1 from public.training_sessions s where s.id=session_id and private.teaches_cohort(s.cohort_id) and private.valid_enrollment(s.cohort_id,trainee_id)));
create policy attendance_trainer_update on public.attendance_records for update to authenticated using(exists(select 1 from public.training_sessions s where s.id=session_id and private.teaches_cohort(s.cohort_id))) with check(exists(select 1 from public.training_sessions s where s.id=session_id and private.teaches_cohort(s.cohort_id) and private.valid_enrollment(s.cohort_id,trainee_id)));
drop policy request_employer on public.staffing_requests;
create policy request_employer_create on public.staffing_requests for insert to authenticated with check(private.in_org(organization_id) and created_by=auth.uid());
create policy request_employer_update on public.staffing_requests for update to authenticated using(private.in_org(organization_id)) with check(private.in_org(organization_id));
drop policy interview_employer on public.interviews;
create policy interview_employer_create on public.interviews for insert to authenticated with check(created_by=auth.uid() and exists(select 1 from public.candidate_matches m where m.id=match_id and private.manages_request(m.request_id)));
create policy interview_employer_update on public.interviews for update to authenticated using(exists(select 1 from public.candidate_matches m where m.id=match_id and private.manages_request(m.request_id))) with check(exists(select 1 from public.candidate_matches m where m.id=match_id and private.manages_request(m.request_id)));
