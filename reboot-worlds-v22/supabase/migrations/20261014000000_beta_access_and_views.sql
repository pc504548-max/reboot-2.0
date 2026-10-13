-- Bootstrap owner_uid using the SQL editor/service role, never a browser claim.
CREATE TABLE public.beta_config (
 id boolean PRIMARY KEY DEFAULT true CHECK(id), owner_uid text,
 member_limit integer NOT NULL DEFAULT 1000 CHECK(member_limit BETWEEN 1 AND 100000),
 project_limit integer NOT NULL DEFAULT 10000 CHECK(project_limit BETWEEN 1 AND 1000000),
 member_project_limit integer NOT NULL DEFAULT 20 CHECK(member_project_limit BETWEEN 1 AND 10000),
 owner_project_limit integer NOT NULL DEFAULT 1000 CHECK(owner_project_limit BETWEEN 1 AND 100000)
);
INSERT INTO public.beta_config(id) VALUES(true);
CREATE TABLE public.beta_requests (
 uid text PRIMARY KEY, email text NOT NULL CHECK(length(email) BETWEEN 3 AND 254),
 note text NOT NULL DEFAULT '' CHECK(length(note)<=600),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz
);
CREATE TABLE public.beta_feedback (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), uid text NOT NULL,
 message text NOT NULL CHECK(length(message) BETWEEN 5 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.beta_feedback(uid,created_at);
CREATE TABLE public.project_metrics (
 project_id uuid PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
 view_count integer NOT NULL DEFAULT 0 CHECK(view_count>=0)
);
CREATE TABLE public.project_views (
 project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
 viewer_uid text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(project_id,viewer_uid)
);
ALTER TABLE public.beta_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.beta_config,public.beta_requests,public.beta_feedback,public.project_views,public.project_metrics FROM anon,authenticated;
GRANT SELECT ON public.project_metrics TO anon,authenticated;
CREATE POLICY metrics_read ON public.project_metrics FOR SELECT TO anon,authenticated USING(true);

CREATE FUNCTION public.beta_is_owner() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT COALESCE((SELECT owner_uid=auth.jwt()->>'firebase_uid' FROM beta_config WHERE id),false)
$$;
CREATE FUNCTION public.beta_can_publish() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT beta_is_owner() OR EXISTS(SELECT 1 FROM beta_requests WHERE uid=auth.jwt()->>'firebase_uid' AND status='approved')
$$;
CREATE FUNCTION public.beta_status() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('admin',beta_is_owner(),'status',CASE WHEN beta_is_owner() THEN 'owner' ELSE COALESCE((SELECT status FROM beta_requests WHERE uid=auth.jwt()->>'firebase_uid'),'none') END,
 'memberLimit',member_limit,'projectLimit',project_limit,'myProjectLimit',CASE WHEN beta_is_owner() THEN owner_project_limit ELSE member_project_limit END,
 'myProjects',(SELECT count(*) FROM projects WHERE firebase_uid=auth.jwt()->>'firebase_uid')) FROM beta_config WHERE id
$$;
CREATE FUNCTION public.request_beta(contact_email text, introduction text DEFAULT '') RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u text:=auth.jwt()->>'firebase_uid'; verified text:=NULLIF(auth.jwt()->>'email','');
BEGIN
 -- contact_email is retained for API compatibility; client-supplied identity labels are ignored.
 IF u IS NULL OR u='' THEN RAISE EXCEPTION 'Sign in before requesting access'; END IF;
 INSERT INTO beta_requests(uid,email,note) VALUES(u,COALESCE(verified,'Unverified Firebase identity'),trim(introduction)) ON CONFLICT(uid) DO NOTHING;
END $$;
CREATE FUNCTION public.admin_beta_overview() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT beta_is_owner() THEN RAISE EXCEPTION 'Owner access required'; END IF;
 RETURN jsonb_build_object('config',(SELECT to_jsonb(c)-'owner_uid' FROM beta_config c WHERE id),
 'approved',(SELECT count(*) FROM beta_requests WHERE status='approved'), 'projects',(SELECT count(*) FROM projects),
 'pending',(SELECT count(*) FROM beta_requests WHERE status='pending'),
 'requests',COALESCE((SELECT jsonb_agg(r) FROM (SELECT * FROM beta_requests WHERE status='pending' ORDER BY created_at LIMIT 200) r),'[]'::jsonb),
 'feedback',COALESCE((SELECT jsonb_agg(f) FROM (SELECT * FROM beta_feedback ORDER BY created_at DESC LIMIT 100) f),'[]'::jsonb));
END $$;
CREATE FUNCTION public.admin_review_beta(request_uid text, approve boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE cap integer; current_status text;
BEGIN
 IF NOT beta_is_owner() THEN RAISE EXCEPTION 'Owner access required'; END IF;
 SELECT member_limit INTO cap FROM beta_config WHERE id FOR UPDATE;
 SELECT status INTO current_status FROM beta_requests WHERE uid=request_uid FOR UPDATE;
 IF current_status IS NULL THEN RAISE EXCEPTION 'Request not found'; END IF;
 IF approve AND current_status<>'approved' AND (SELECT count(*) FROM beta_requests WHERE status='approved')>=cap THEN RAISE EXCEPTION 'Beta is full. Increase the member limit first.'; END IF;
 UPDATE beta_requests SET status=CASE WHEN approve THEN 'approved' ELSE 'rejected' END,reviewed_at=now() WHERE uid=request_uid;
END $$;
CREATE FUNCTION public.admin_set_limits(members integer, projects_total integer, per_member integer, per_owner integer) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NOT beta_is_owner() THEN RAISE EXCEPTION 'Owner access required'; END IF;
 PERFORM 1 FROM beta_config WHERE id FOR UPDATE;
 IF members<(SELECT count(*) FROM beta_requests WHERE status='approved') OR projects_total<(SELECT count(*) FROM projects) THEN RAISE EXCEPTION 'Limits cannot be below current usage'; END IF;
 UPDATE beta_config SET member_limit=members,project_limit=projects_total,member_project_limit=per_member,owner_project_limit=per_owner WHERE id;
END $$;
CREATE FUNCTION public.submit_feedback(message_text text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u text:=auth.jwt()->>'firebase_uid';
BEGIN
 IF u IS NULL OR NOT beta_can_publish() THEN RAISE EXCEPTION 'Approved beta access required'; END IF;
 -- Serialize per-user submissions to enforce the daily bound under concurrent calls.
 PERFORM pg_advisory_xact_lock(hashtextextended(u,17));
 IF (SELECT count(*) FROM beta_feedback WHERE uid=u AND created_at>now()-interval '1 day')>=5 THEN RAISE EXCEPTION 'Five feedback messages per day. Please try tomorrow.'; END IF;
 INSERT INTO beta_feedback(uid,message) VALUES(u,trim(message_text));
END $$;
CREATE FUNCTION public.enforce_beta_project_limit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE c beta_config; owned integer;
BEGIN
 IF NOT beta_can_publish() OR NEW.firebase_uid IS DISTINCT FROM (auth.jwt()->>'firebase_uid') THEN RAISE EXCEPTION 'Approved beta access required to publish'; END IF;
 SELECT * INTO c FROM beta_config WHERE id FOR UPDATE;
 -- Upsert retry of the same owned UUID consumes no extra capacity.
 IF EXISTS(SELECT 1 FROM projects WHERE id=NEW.id AND firebase_uid=NEW.firebase_uid) THEN RETURN NEW; END IF;
 SELECT count(*) INTO owned FROM projects WHERE firebase_uid=NEW.firebase_uid;
 IF owned >= (CASE WHEN beta_is_owner() THEN c.owner_project_limit ELSE c.member_project_limit END) THEN RAISE EXCEPTION 'Your building limit has been reached'; END IF;
 IF (SELECT count(*) FROM projects)>=c.project_limit THEN RAISE EXCEPTION 'Project capacity reached. Contact the owner.'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER project_beta_limit BEFORE INSERT ON public.projects FOR EACH ROW EXECUTE FUNCTION public.enforce_beta_project_limit();
DROP POLICY owner_insert_projects ON public.projects;
CREATE POLICY owner_insert_projects ON public.projects FOR INSERT TO authenticated WITH CHECK(firebase_uid=auth.jwt()->>'firebase_uid' AND beta_can_publish());
DROP POLICY owner_update_projects ON public.projects;
CREATE POLICY owner_update_projects ON public.projects FOR UPDATE TO authenticated USING(firebase_uid=auth.jwt()->>'firebase_uid' AND beta_can_publish()) WITH CHECK(firebase_uid=auth.jwt()->>'firebase_uid' AND beta_can_publish());

CREATE FUNCTION public.record_project_view(target_id uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE u text:=auth.jwt()->>'firebase_uid'; owner text; inserted integer;
BEGIN
 SELECT firebase_uid INTO owner FROM projects WHERE id=target_id;
 IF NOT FOUND THEN RETURN 0; END IF;
 IF u IS NULL OR NOT beta_can_publish() OR u=owner THEN RETURN COALESCE((SELECT view_count FROM project_metrics WHERE project_id=target_id),0); END IF;
 INSERT INTO project_views(project_id,viewer_uid) VALUES(target_id,u) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT;
 IF inserted=1 THEN
  INSERT INTO project_metrics(project_id,view_count) VALUES(target_id,1) ON CONFLICT(project_id) DO UPDATE SET view_count=project_metrics.view_count+1;
 END IF;
 RETURN COALESCE((SELECT view_count FROM project_metrics WHERE project_id=target_id),0);
END $$;
-- Explicit grants: Supabase otherwise grants new functions to PUBLIC by default.
REVOKE ALL ON FUNCTION public.beta_is_owner(),public.beta_can_publish(),public.beta_status(),public.request_beta(text,text),public.admin_beta_overview(),public.admin_review_beta(text,boolean),public.admin_set_limits(integer,integer,integer,integer),public.submit_feedback(text),public.record_project_view(uuid),public.enforce_beta_project_limit() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.beta_is_owner(),public.beta_can_publish(),public.beta_status(),public.request_beta(text,text),public.admin_beta_overview(),public.admin_review_beta(text,boolean),public.admin_set_limits(integer,integer,integer,integer),public.submit_feedback(text),public.record_project_view(uuid) TO authenticated;
