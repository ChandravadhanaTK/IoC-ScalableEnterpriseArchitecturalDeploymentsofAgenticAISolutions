
create table public.suppliers (id text primary key, name text not null, location text not null, region text not null, lead_days int not null default 2, status text not null default 'ACTIVE', reliability_score numeric not null default 0.9, created_at timestamptz not null default now());
create table public.ports (id text primary key, name text not null, location text not null, status text not null default 'ACTIVE', x int not null default 0, y int not null default 0, created_at timestamptz not null default now());
create table public.products (id text primary key, name text not null, category text not null, unit_cost numeric not null, created_at timestamptz not null default now());
create table public.supplier_products (supplier_id text references public.suppliers(id), product_id text references public.products(id), available_quantity int not null, unit_cost numeric not null, primary key (supplier_id, product_id));
create table public.routes (id text primary key, name text not null, origin text not null, destination text not null, transport_mode text not null, transit_days int not null, cost numeric not null, active boolean not null default true, associated_port_id text references public.ports(id), reliability numeric not null default 0.9, created_at timestamptz not null default now());
create table public.purchase_orders (
  id text primary key, supplier_id text references public.suppliers(id), product_id text references public.products(id),
  quantity int not null, unit_cost numeric not null, original_unit_cost numeric not null,
  required_date date, required_offset_days int not null, expected_arrival date, eta_offset_days int not null,
  current_route_id text references public.routes(id), original_supplier_id text references public.suppliers(id), original_route_id text references public.routes(id),
  status text not null, base_status text not null, disruption_status text not null default 'NONE',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.inventory (id text primary key, product_id text references public.products(id), location text not null, quantity int not null, daily_demand int not null, updated_at timestamptz not null default now());
create table public.disruptions (id text primary key, type text not null, title text not null, description text, target_type text not null, target_id text not null, duration_days int not null, severity text not null, status text not null default 'CREATED', created_at timestamptz not null default now(), resolved_at timestamptz);
create table public.agent_runs (id uuid primary key default gen_random_uuid(), disruption_id text references public.disruptions(id), status text not null default 'RUNNING', total_pos int not null default 0, processed_pos int not null default 0, queue jsonb not null default '[]', started_at timestamptz not null default now(), completed_at timestamptz, summary jsonb);
create table public.agent_actions (id uuid primary key default gen_random_uuid(), agent_run_id uuid references public.agent_runs(id) on delete cascade, po_id text references public.purchase_orders(id), action_type text not null, route_id text, supplier_id text, reason text, confidence numeric, estimated_cost numeric not null default 0, expected_arrival date, stockout_risk text, requires_approval boolean not null default false, approval_status text not null default 'NOT_REQUIRED', execution_status text not null default 'PENDING', candidates jsonb, verification jsonb, attempt int not null default 1, created_at timestamptz not null default now(), executed_at timestamptz);
create table public.audit_logs (id uuid primary key default gen_random_uuid(), agent_run_id uuid references public.agent_runs(id) on delete cascade, po_id text, event_type text not null, message text not null, metadata jsonb, actor text not null default 'AGENT', created_at timestamptz not null default clock_timestamp());

do $$ declare t text; begin
  foreach t in array array['suppliers','ports','products','supplier_products','routes','purchase_orders','inventory','disruptions','agent_runs','agent_actions','audit_logs'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
  end loop; end $$;

alter publication supabase_realtime add table public.audit_logs, public.agent_runs, public.agent_actions;

insert into public.suppliers values
('SUP-01','Alpha Dynamics','Shenzhen, CN','East Asia',0,'ACTIVE',0.92,now()),
('SUP-02','Beta Precision','Almaty, KZ','Central Asia',0,'ACTIVE',0.88,now()),
('SUP-03','Gamma Industrial','Busan, KR','East Asia',0,'ACTIVE',0.90,now()),
('SUP-04','Delta Components','Tashkent, UZ','Central Asia',0,'ACTIVE',0.85,now()),
('SUP-05','Echo Manufacturing','Chennai, IN','Domestic',2,'ACTIVE',0.91,now()),
('SUP-06','Foxtrot Metals','Coimbatore, IN','Domestic',2,'ACTIVE',0.80,now()),
('SUP-07','Gamma-2 Systems','Taipei, TW','East Asia',0,'ACTIVE',0.87,now()),
('SUP-08','Horizon Electronics','Bengaluru, IN','Domestic',2,'ACTIVE',0.93,now()),
('SUP-09','Nova Assemblies','Ho Chi Minh, VN','Southeast Asia',2,'ACTIVE',0.89,now()),
('SUP-10','Vertex Automotive','Pune, IN','Domestic',1,'ACTIVE',0.95,now());

insert into public.ports (id,name,location,x,y) values
('PRT-MER','Port Meridian','Strait Sector 7',0,0),('PRT-ATL','Port Atlas','North Basin',0,0),('PRT-ORI','Port Orion','Air Cargo Hub',0,0),
('PRT-PAC','Port Pacific','South Basin',0,0),('PRT-DEL','Port Delta','Inland Air Hub',0,0),('PRT-GTW','Port Gateway','Domestic Freight Gate',0,0);

insert into public.products values
('P-01','Motor Assembly','Drivetrain',420,now()),('P-02','Battery Pack','Power',610,now()),('P-03','Wiring Harness','Electrical',48,now()),
('P-04','Control Module','Electronics',260,now()),('P-05','Sensor Module','Electronics',85,now()),('P-06','Display Unit','Electronics',210,now()),
('P-07','Brake Assembly','Chassis',64,now()),('P-08','Power Controller','Power',180,now()),('P-09','Aluminum Frame','Chassis',140,now()),
('P-10','Gear Assembly','Drivetrain',95,now()),('P-11','Cooling Fan','Thermal',32,now()),('P-12','Drive Shaft','Drivetrain',120,now());

insert into public.supplier_products values
('SUP-08','P-05',500,95),('SUP-09','P-06',300,190),('SUP-10','P-06',200,330),('SUP-06','P-07',40,60),('SUP-05','P-07',400,74),
('SUP-05','P-09',600,150),('SUP-10','P-10',300,105),('SUP-06','P-11',900,30),('SUP-08','P-12',250,135);

insert into public.routes values
('R-01','Meridian Sea Lane','East Asia','Pune Plant','SEA',10,4000,true,'PRT-MER',0.90,now()),
('R-02','Meridian Rail Link','Central Asia','Pune Plant','RAIL',7,3500,true,'PRT-MER',0.88,now()),
('R-03','Atlas Sea Lane','East Asia','Pune Plant','SEA',8,4900,true,'PRT-ATL',0.86,now()),
('R-04','Orion Air Bridge','East Asia','Pune Plant','AIR',3,10800,true,'PRT-ORI',0.95,now()),
('R-05','Pacific Sea Lane','Southeast Asia','Pune Plant','SEA',9,3800,true,'PRT-PAC',0.87,now()),
('R-06','Gateway Road Freight','Domestic','Pune Plant','ROAD',2,1500,true,'PRT-GTW',0.93,now()),
('R-07','Delta Air Express','Central Asia','Pune Plant','AIR',2,7900,true,'PRT-DEL',0.94,now()),
('R-08','Atlas Multimodal Corridor','Central Asia','Pune Plant','MULTIMODAL',9,4200,true,'PRT-ATL',0.85,now());

insert into public.inventory values
('INV-01','P-01','Pune Plant',400,20,now()),('INV-02','P-02','Pune Plant',450,30,now()),('INV-03','P-03','Pune Plant',600,50,now()),
('INV-04','P-04','Pune Plant',280,40,now()),('INV-05','P-05','Pune Plant',180,30,now()),('INV-06','P-06','Pune Plant',160,40,now()),
('INV-07','P-07','Pune Plant',250,50,now()),('INV-08','P-08','Pune Plant',70,35,now()),('INV-09','P-09','Pune Plant',900,30,now()),
('INV-10','P-10','Pune Plant',1200,40,now()),('INV-11','P-11','Pune Plant',2000,60,now()),('INV-12','P-12','Pune Plant',500,20,now()),
('INV-13','P-01','Chennai DC',120,0,now()),('INV-14','P-03','Chennai DC',800,0,now()),('INV-15','P-09','Chennai DC',300,0,now()),('INV-16','P-11','Chennai DC',600,0,now());

-- 8 exposed POs (Meridian-dependent)
insert into public.purchase_orders (id,supplier_id,product_id,quantity,unit_cost,original_unit_cost,required_offset_days,eta_offset_days,current_route_id,original_supplier_id,original_route_id,status,base_status) values
('PO-101','SUP-01','P-01',200,420,420,14,3,'R-01','SUP-01','R-01','IN_TRANSIT','IN_TRANSIT'),
('PO-102','SUP-03','P-02',150,610,610,10,6,'R-01','SUP-03','R-01','IN_TRANSIT','IN_TRANSIT'),
('PO-103','SUP-02','P-03',900,48,48,9,5,'R-02','SUP-02','R-02','IN_TRANSIT','IN_TRANSIT'),
('PO-104','SUP-04','P-04',300,260,260,6,4,'R-02','SUP-04','R-02','IN_TRANSIT','IN_TRANSIT'),
('PO-105','SUP-07','P-05',120,85,85,7,5,'R-01','SUP-07','R-01','IN_TRANSIT','IN_TRANSIT'),
('PO-106','SUP-01','P-06',80,210,210,5,7,'R-01','SUP-01','R-01','IN_TRANSIT','IN_TRANSIT'),
('PO-107','SUP-02','P-07',100,64,64,8,6,'R-02','SUP-02','R-02','IN_TRANSIT','IN_TRANSIT'),
('PO-108','SUP-03','P-08',250,180,180,3,4,'R-01','SUP-03','R-01','IN_TRANSIT','IN_TRANSIT');

-- 32 unaffected POs
insert into public.purchase_orders (id,supplier_id,product_id,quantity,unit_cost,original_unit_cost,required_offset_days,eta_offset_days,current_route_id,original_supplier_id,original_route_id,status,base_status)
select 'PO-'||(108+g),
  (array['SUP-03','SUP-09','SUP-05','SUP-02','SUP-07','SUP-08','SUP-10','SUP-06'])[1+(g%8)],
  'P-'||lpad((1+(g%12))::text,2,'0'),
  50+(g*37)%400, p.unit_cost, p.unit_cost,
  10+(g%15), case when g%5=0 then -2 else 2+(g%9) end,
  r.rid, (array['SUP-03','SUP-09','SUP-05','SUP-02','SUP-07','SUP-08','SUP-10','SUP-06'])[1+(g%8)], r.rid,
  case when g%5=0 then 'DELIVERED' when g%3=0 then 'PLANNED' else 'IN_TRANSIT' end,
  case when g%5=0 then 'DELIVERED' when g%3=0 then 'PLANNED' else 'IN_TRANSIT' end
from generate_series(1,32) g
join public.products p on p.id='P-'||lpad((1+(g%12))::text,2,'0')
cross join lateral (select (array['R-03','R-05','R-06','R-08','R-06','R-05','R-03','R-08'])[1+(g%8)] as rid) r;

insert into public.disruptions (id,type,title,description,target_type,target_id,duration_days,severity) values
('DIS-MER','PORT_CLOSURE','Port Meridian Closure','Severe weather and labor action close Port Meridian for 5 days. All sea and rail flows transiting the port are halted.','PORT','PRT-MER',5,'HIGH'),
('DIS-BETA','SUPPLIER_SHUTDOWN','Beta Precision Shutdown','Fire at Beta Precision''s Almaty plant halts all outbound shipments for 7 days.','SUPPLIER','SUP-02',7,'MEDIUM'),
('DIS-PAC','ROUTE_UNAVAILABLE','Pacific Sea Lane Suspended','Pacific Sea Lane suspended for 4 days due to a canal blockage.','ROUTE','R-05',4,'MEDIUM');

create or replace function public.reset_demo() returns void language plpgsql security definer set search_path=public as $$
begin
  update agent_actions set execution_status='SKIPPED', approval_status = case when approval_status='PENDING' then 'REJECTED' else approval_status end where execution_status='PENDING';
  update agent_runs set status='FAILED', completed_at=now(), summary=coalesce(summary,'{}'::jsonb)||'{"note":"Superseded by demo reset"}' where status in ('RUNNING','WAITING_APPROVAL');
  update purchase_orders set supplier_id=original_supplier_id, current_route_id=original_route_id, unit_cost=original_unit_cost,
    status=base_status, disruption_status='NONE', required_date=current_date+required_offset_days, expected_arrival=current_date+eta_offset_days, updated_at=now();
  update ports set status='ACTIVE'; update routes set active=true; update suppliers set status='ACTIVE';
  update disruptions set status='CREATED', resolved_at=null;
end $$;
revoke execute on function public.reset_demo() from public, anon, authenticated;
grant execute on function public.reset_demo() to service_role;
select public.reset_demo();
