CREATE INDEX "team_members#user_id"
    ON public.team_members USING btree
    (user_id COLLATE pg_catalog."default" varchar_ops)
    TABLESPACE pg_default;
ALTER TABLE public.team_members
    CLUSTER ON "team_members#user_id";