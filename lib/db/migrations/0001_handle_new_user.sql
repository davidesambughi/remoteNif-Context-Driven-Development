-- Creates a public.users row every time a Supabase Auth user is created.
-- Language is read from raw_user_meta_data so the Server Action can pass it via options.data.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, role, language)
  values (
    new.id,
    new.email,
    'customer',
    coalesce(
      (new.raw_user_meta_data ->> 'language')::public.language,
      'en'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
