-- Productfoto's: publiek leesbaar, alleen beheerders uploaden of verwijderen.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "product-images: beheer uploaden" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "product-images: beheer wijzigen" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

create policy "product-images: beheer verwijderen" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));
