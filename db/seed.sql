-- Business names, published reference prices and photo references are shared
-- business DATA, not shared application code. Source audit: docs/catalog-data.md.
-- stock is this classroom catalog's seat allocation, not studio inventory.
-- Re-running preserves edited stock/prices and never creates duplicate SKUs.
begin;
insert into public.products (sku, name, category, price, stock, image_url) values
  ('SD-LARO-MUG', 'Laro Ceramics: Mug-making + painting', 'Pottery', 3000.00, 6, './assets/laro-mug.webp'),
  ('SD-LARO-WHEEL', 'Laro Ceramics: Beginner''s wheel-throwing', 'Pottery', 3200.00, 2, './assets/laro-wheel.webp'),
  ('SD-BUMI-MUG', 'Bumi & Ashe: Mug-making workshop', 'Pottery', 2650.00, 0, './assets/bumi-mug.webp'),
  ('SD-BUMI-FREEFORM', 'Bumi & Ashe: Free Form Pottery + Paint', 'Pottery', 3200.00, 5, './assets/bumi-freeform.webp'),
  ('SD-AMT-HAND', 'AMT Ceramics: Hand-Building single session', 'Pottery', 2900.00, 4, './assets/amt-handbuilding.webp'),
  ('SD-AMT-WHEEL', 'AMT Ceramics: Wheel-Throwing Exploratory single session', 'Pottery', 2900.00, 3, './assets/amt-wheel.webp'),
  ('SD-SIP-PAINT', 'Sip & Gogh: Open Session painting', 'Painting', 1400.00, 8, './assets/sip-open.webp'),
  ('SD-TAHANAN-WHEEL', 'Tahanan Pottery: Exploratory Wheel Workshop', 'Pottery', 2500.00, 6, './assets/tahanan-wheel.webp')
on conflict (sku) do nothing;
commit;
