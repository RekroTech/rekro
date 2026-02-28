create or replace view public.liked_profiles as
select
  u.property_id,
  pl.user_id,
  usr.full_name,
  usr.username,
  usr.image_url,
  usr.occupation,
  usr.bio,
  usr.native_language,
  array_agg(distinct u.id) as unit_ids,
  array_agg(distinct u.name) filter (where u.name is not null) as unit_names
from public.units u
join public.unit_likes pl on pl.unit_id = u.id
join public.users usr on usr.id = pl.user_id
where usr.discoverable = true
group by
  u.property_id,
  pl.user_id,
  usr.full_name,
  usr.username,
  usr.image_url,
  usr.occupation,
  usr.bio,
  usr.native_language;

grant select on public.liked_profiles to authenticated;
