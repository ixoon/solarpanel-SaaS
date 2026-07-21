-- SolarApp — dev seed data
-- Test installer so /i/demo-solar works immediately.
-- Run in Supabase SQL editor (or `supabase db reset` picks it up automatically).

insert into installers (company_name, contact_email, phone, slug, subscription_status)
values (
  'Demo Solar Kosovo',
  'webdevelopment492@gmail.com',
  '+383 44 000 000',
  'demo-solar',
  'active'
)
on conflict (slug) do nothing;
