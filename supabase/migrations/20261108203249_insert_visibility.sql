-- Read newly inserted rows from their own authorization columns. A stable
-- helper which re-selects the same table cannot see that row in RETURNING.
drop policy request_read on public.staffing_requests;
create policy request_read on public.staffing_requests for select to authenticated using(
 private.in_org(organization_id) or (private.signed_in() and exists(
  select 1 from public.candidate_matches m where m.request_id=staffing_requests.id and m.candidate_id=auth.uid()
 ))
);
drop policy ticket_read on public.support_tickets;
create policy ticket_read on public.support_tickets for select to authenticated using(
 private.signed_in() and (owner_id=auth.uid() or assigned_to=auth.uid())
);
