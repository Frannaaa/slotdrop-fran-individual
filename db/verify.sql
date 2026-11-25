-- Read-only dashboard checks for your personal Supabase project.
select 'products' as table_name, count(*) as row_count from public.products
union all select 'orders', count(*) from public.orders
union all select 'order_items', count(*) from public.order_items;

select sku, name, price, stock from public.products order by id;

select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('products', 'orders', 'order_items');

select tablename, cmd, roles, qual
from pg_policies
where schemaname = 'public' and tablename in ('products', 'orders', 'order_items');

select role_name, table_name,
  has_table_privilege(role_name, 'public.' || table_name, 'SELECT') as may_select,
  has_table_privilege(role_name, 'public.' || table_name, 'INSERT') as may_insert,
  has_table_privilege(role_name, 'public.' || table_name, 'UPDATE') as may_update,
  has_table_privilege(role_name, 'public.' || table_name, 'DELETE') as may_delete
from (values ('anon'), ('authenticated')) as roles(role_name)
cross join (values ('products'), ('orders'), ('order_items')) as tables(table_name)
order by role_name, table_name;
