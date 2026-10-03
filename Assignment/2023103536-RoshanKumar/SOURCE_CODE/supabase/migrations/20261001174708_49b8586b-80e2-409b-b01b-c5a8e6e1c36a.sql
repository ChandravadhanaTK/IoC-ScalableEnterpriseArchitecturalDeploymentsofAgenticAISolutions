create or replace function public.reset_demo() returns void language plpgsql security definer set search_path=public as $$
begin
  update agent_actions set execution_status='SKIPPED', approval_status = case when approval_status='PENDING' then 'REJECTED' else approval_status end where execution_status='PENDING';
  update agent_runs set status='FAILED', completed_at=now(), summary=coalesce(summary,'{}'::jsonb)||'{"note":"Superseded by demo reset"}' where status in ('RUNNING','WAITING_APPROVAL');
  update purchase_orders set supplier_id=original_supplier_id, current_route_id=original_route_id, unit_cost=original_unit_cost,
    status=base_status, disruption_status='NONE', required_date=current_date+required_offset_days, expected_arrival=current_date+eta_offset_days, updated_at=now() where true;
  update ports set status='ACTIVE' where true; update routes set active=true where true; update suppliers set status='ACTIVE' where true;
  update disruptions set status='CREATED', resolved_at=null where true;
end $$;