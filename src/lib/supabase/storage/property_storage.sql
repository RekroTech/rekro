-- Create the rekro-s3 storage bucket
insert into storage.buckets (id, name, public)
values ('rekro-s3', 'rekro-s3', true)
on conflict (id) do nothing;

-- Storage policies for rekro-s3 bucket

create policy "Public read rekro property media"
on storage.objects
for select
to public
using (
  bucket_id = 'rekro-s3'
  and split_part(name, '/', 1) = 'property'
  and exists (
    select 1
    from public.properties p
    where p.id::text = split_part(name, '/', 2)
  )
);

create policy "Auth upload rekro property media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'rekro-s3'
  and split_part(name, '/', 1) = 'property'
  and exists (
    select 1
    from public.properties p
    where p.id::text = split_part(name, '/', 2)
  )
);

create policy "Auth update rekro property media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'rekro-s3'
  and split_part(name, '/', 1) = 'property'
  and exists (
    select 1
    from public.properties p
    where p.id::text = split_part(name, '/', 2)
  )
)
with check (
  bucket_id = 'rekro-s3'
  and split_part(name, '/', 1) = 'property'
  and exists (
    select 1
    from public.properties p
    where p.id::text = split_part(name, '/', 2)
  )
);

create policy "Auth delete rekro property media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'rekro-s3'
  and split_part(name, '/', 1) = 'property'
  and exists (
    select 1
    from public.properties p
    where p.id::text = split_part(name, '/', 2)
  )
);
