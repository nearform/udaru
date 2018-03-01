ALTER TABLE public.organizations
    ADD COLUMN metadata jsonb;
ALTER TABLE public.teams
    ADD COLUMN metadata jsonb;
ALTER TABLE public.users
    ADD COLUMN metadata jsonb;
    