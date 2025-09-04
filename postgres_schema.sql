--
-- PostgreSQL database dump
--

\restrict MueOOLZdwpHAsG6N7oVlBV1Ufog5adsAKXTWOcfthLTdydRh7rmjrv2FqrHAiaM

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.6 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: CompanyStatus; Type: TYPE; Schema: public; Owner: ingerobotords
--

CREATE TYPE public."CompanyStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'TRIAL'
);


ALTER TYPE public."CompanyStatus" OWNER TO ingerobotords;

--
-- Name: InventoryMovementType; Type: TYPE; Schema: public; Owner: ingerobotords
--

CREATE TYPE public."InventoryMovementType" AS ENUM (
    'PURCHASE',
    'SALE',
    'TRANSFER',
    'ADJUSTMENT',
    'LOSS',
    'RETURN'
);


ALTER TYPE public."InventoryMovementType" OWNER TO ingerobotords;

--
-- Name: MaterialStatus; Type: TYPE; Schema: public; Owner: ingerobotords
--

CREATE TYPE public."MaterialStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'DISCONTINUED'
);


ALTER TYPE public."MaterialStatus" OWNER TO ingerobotords;

--
-- Name: PersonProjectStatus; Type: TYPE; Schema: public; Owner: ingerobotords
--

CREATE TYPE public."PersonProjectStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'COMPLETED'
);


ALTER TYPE public."PersonProjectStatus" OWNER TO ingerobotords;

--
-- Name: PersonStatus; Type: TYPE; Schema: public; Owner: ingerobotords
--

CREATE TYPE public."PersonStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);


ALTER TYPE public."PersonStatus" OWNER TO ingerobotords;

--
-- Name: PersonTeamStatus; Type: TYPE; Schema: public; Owner: ingerobotords
--

CREATE TYPE public."PersonTeamStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


ALTER TYPE public."PersonTeamStatus" OWNER TO ingerobotords;

--
-- Name: PersonTenantStatus; Type: TYPE; Schema: public; Owner: ingerobotords
--

CREATE TYPE public."PersonTenantStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'TERMINATED'
);


ALTER TYPE public."PersonTenantStatus" OWNER TO ingerobotords;

--
-- Name: ProjectStatus; Type: TYPE; Schema: public; Owner: ingerobotords
--

CREATE TYPE public."ProjectStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."ProjectStatus" OWNER TO ingerobotords;

--
-- Name: ReorderRequestStatus; Type: TYPE; Schema: public; Owner: ingerobotords
--

CREATE TYPE public."ReorderRequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'ORDERED',
    'RECEIVED',
    'CANCELLED'
);


ALTER TYPE public."ReorderRequestStatus" OWNER TO ingerobotords;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: ingerobotords
--

CREATE TYPE public."Role" AS ENUM (
    'WORKER',
    'SUPERVISOR',
    'ADMIN',
    'SUPERUSER'
);


ALTER TYPE public."Role" OWNER TO ingerobotords;

--
-- Name: TaskCategoryStatus; Type: TYPE; Schema: public; Owner: ingerobotords
--

CREATE TYPE public."TaskCategoryStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


ALTER TYPE public."TaskCategoryStatus" OWNER TO ingerobotords;

--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: ingerobotords
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'COMPLETED',
    'OBSTACLE_PERMIT',
    'OBSTACLE_DECISION',
    'OBSTACLE_INSPECTION',
    'OBSTACLE_MATERIALS',
    'OBSTACLE_EQUIPMENT',
    'OBSTACLE_WEATHER',
    'OBSTACLE_OTHER'
);


ALTER TYPE public."TaskStatus" OWNER TO ingerobotords;

--
-- Name: TeamStatus; Type: TYPE; Schema: public; Owner: ingerobotords
--

CREATE TYPE public."TeamStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE'
);


ALTER TYPE public."TeamStatus" OWNER TO ingerobotords;

--
-- Name: ValidationStatus; Type: TYPE; Schema: public; Owner: ingerobotords
--

CREATE TYPE public."ValidationStatus" AS ENUM (
    'PENDING',
    'VALIDATED',
    'REJECTED'
);


ALTER TYPE public."ValidationStatus" OWNER TO ingerobotords;

--
-- Name: audit_row_changes(); Type: FUNCTION; Schema: public; Owner: ingerobotords
--

CREATE FUNCTION public.audit_row_changes() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO audit_logs(event_time, table_name, action, row_id, before_data, after_data)
  VALUES (now(), TG_TABLE_NAME, TG_OP,
          COALESCE(NEW.id, OLD.id)::text,
          CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) END,
          CASE WHEN TG_OP IN ('UPDATE','INSERT') THEN to_jsonb(NEW) END);
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END$$;


ALTER FUNCTION public.audit_row_changes() OWNER TO ingerobotords;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO ingerobotords;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    person_id text NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    old_values jsonb,
    new_values jsonb,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO ingerobotords;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.companies (
    id text NOT NULL,
    name text NOT NULL,
    name_es text,
    slug text NOT NULL,
    status public."CompanyStatus" DEFAULT 'ACTIVE'::public."CompanyStatus" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.companies OWNER TO ingerobotords;

--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.inventory_movements (
    id text NOT NULL,
    material_id text NOT NULL,
    type public."InventoryMovementType" NOT NULL,
    quantity double precision NOT NULL,
    unit_cost numeric(12,2),
    total_cost numeric(14,2),
    reference text,
    notes text,
    recorded_by text,
    recorded_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.inventory_movements OWNER TO ingerobotords;

--
-- Name: location_updates; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.location_updates (
    id text NOT NULL,
    person_id text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    accuracy double precision,
    "timestamp" timestamp(6) with time zone NOT NULL,
    delta_distance double precision,
    delta_heading double precision,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.location_updates OWNER TO ingerobotords;

--
-- Name: material_consumptions; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.material_consumptions (
    id text NOT NULL,
    task_progress_update_id text,
    material_id text NOT NULL,
    project_id text,
    quantity double precision NOT NULL,
    type text DEFAULT 'CONSUMPTION'::text NOT NULL,
    notes text,
    recorded_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    recorded_by text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.material_consumptions OWNER TO ingerobotords;

--
-- Name: material_losses; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.material_losses (
    id text NOT NULL,
    task_progress_update_id text NOT NULL,
    material_id text NOT NULL,
    quantity double precision NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.material_losses OWNER TO ingerobotords;

--
-- Name: materials; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.materials (
    id text NOT NULL,
    name text NOT NULL,
    name_es text,
    description text,
    unit text NOT NULL,
    unit_cost numeric(12,2),
    min_stock_level double precision,
    max_stock_level double precision,
    current_stock double precision DEFAULT 0 NOT NULL,
    status public."MaterialStatus" DEFAULT 'ACTIVE'::public."MaterialStatus" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by text
);


ALTER TABLE public.materials OWNER TO ingerobotords;

--
-- Name: people; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.people (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    password text,
    role public."Role" DEFAULT 'WORKER'::public."Role" NOT NULL,
    status public."PersonStatus" DEFAULT 'ACTIVE'::public."PersonStatus" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    company_id text
);


ALTER TABLE public.people OWNER TO ingerobotords;

--
-- Name: person_projects; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.person_projects (
    id text NOT NULL,
    person_id text NOT NULL,
    project_id text NOT NULL,
    start_date timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    end_date timestamp(6) with time zone,
    status public."PersonProjectStatus" DEFAULT 'ACTIVE'::public."PersonProjectStatus" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.person_projects OWNER TO ingerobotords;

--
-- Name: person_teams; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.person_teams (
    id text NOT NULL,
    person_id text NOT NULL,
    team_id text NOT NULL,
    start_date timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    end_date timestamp(6) with time zone,
    status public."PersonTeamStatus" DEFAULT 'ACTIVE'::public."PersonTeamStatus" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.person_teams OWNER TO ingerobotords;

--
-- Name: person_tenants; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.person_tenants (
    id text NOT NULL,
    person_id text NOT NULL,
    company_id text NOT NULL,
    start_date timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    end_date timestamp(6) with time zone,
    status public."PersonTenantStatus" DEFAULT 'ACTIVE'::public."PersonTenantStatus" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.person_tenants OWNER TO ingerobotords;

--
-- Name: project_materials; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.project_materials (
    id text NOT NULL,
    project_id text NOT NULL,
    material_id text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.project_materials OWNER TO ingerobotords;

--
-- Name: project_teams; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.project_teams (
    id text NOT NULL,
    project_id text NOT NULL,
    team_id text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.project_teams OWNER TO ingerobotords;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.projects (
    id text NOT NULL,
    name text NOT NULL,
    name_es text,
    description text,
    description_es text,
    company_id text NOT NULL,
    status public."ProjectStatus" DEFAULT 'ACTIVE'::public."ProjectStatus" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.projects OWNER TO ingerobotords;

--
-- Name: reorder_requests; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.reorder_requests (
    id text NOT NULL,
    material_id text NOT NULL,
    requested_quantity double precision NOT NULL,
    requested_by text NOT NULL,
    requested_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    approved_by text,
    approved_at timestamp(6) with time zone,
    rejected_by text,
    rejected_at timestamp(6) with time zone,
    rejection_reason text,
    order_number text,
    ordered_at timestamp(6) with time zone,
    received_at timestamp(6) with time zone,
    status public."ReorderRequestStatus" DEFAULT 'PENDING'::public."ReorderRequestStatus" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.reorder_requests OWNER TO ingerobotords;

--
-- Name: task_categories; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.task_categories (
    id text NOT NULL,
    name text NOT NULL,
    name_es text,
    description text,
    status public."TaskCategoryStatus" DEFAULT 'ACTIVE'::public."TaskCategoryStatus" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.task_categories OWNER TO ingerobotords;

--
-- Name: task_progress_updates; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.task_progress_updates (
    id text NOT NULL,
    task_id text NOT NULL,
    project_id text NOT NULL,
    worker_id text NOT NULL,
    assignment_id text,
    amount_completed double precision NOT NULL,
    additional_attributes text,
    status public."TaskStatus" NOT NULL,
    photos text[],
    validated_by text,
    validated_at timestamp(6) with time zone,
    validation_status public."ValidationStatus" DEFAULT 'PENDING'::public."ValidationStatus" NOT NULL,
    validation_comments text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.task_progress_updates OWNER TO ingerobotords;

--
-- Name: task_project_assignments; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.task_project_assignments (
    id text NOT NULL,
    task_id text NOT NULL,
    project_id text NOT NULL,
    assigned_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_by text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.task_project_assignments OWNER TO ingerobotords;

--
-- Name: task_worker_assignments; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.task_worker_assignments (
    id text NOT NULL,
    task_id text NOT NULL,
    project_id text NOT NULL,
    worker_id text NOT NULL,
    assigned_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_by text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.task_worker_assignments OWNER TO ingerobotords;

--
-- Name: tasks; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.tasks (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    category_id text,
    progress_unit text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    deleted_at timestamp(6) with time zone,
    deleted_by text
);


ALTER TABLE public.tasks OWNER TO ingerobotords;

--
-- Name: teams; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.teams (
    id text NOT NULL,
    name text NOT NULL,
    name_es text,
    description text,
    company_id text NOT NULL,
    status public."TeamStatus" DEFAULT 'ACTIVE'::public."TeamStatus" NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.teams OWNER TO ingerobotords;

--
-- Name: work_logs; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.work_logs (
    id text NOT NULL,
    person_id text NOT NULL,
    project_id text NOT NULL,
    clock_in timestamp(6) with time zone NOT NULL,
    clock_out timestamp(6) with time zone,
    location text,
    tasks_completed jsonb NOT NULL,
    materials_used jsonb NOT NULL,
    photos text[],
    notes text,
    notes_es text,
    approved boolean DEFAULT false NOT NULL,
    approved_by text,
    approved_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    company_id text
);


ALTER TABLE public.work_logs OWNER TO ingerobotords;

--
-- Name: worklog_entries; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.worklog_entries (
    id text NOT NULL,
    worklog_id text NOT NULL,
    person_id text NOT NULL,
    project_id text NOT NULL,
    task_id text,
    description text NOT NULL,
    time_spent integer DEFAULT 0 NOT NULL,
    notes text,
    location_latitude double precision,
    location_longitude double precision,
    location_accuracy double precision,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL
);


ALTER TABLE public.worklog_entries OWNER TO ingerobotords;

--
-- Name: worklog_material_usage; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.worklog_material_usage (
    id text NOT NULL,
    entry_id text NOT NULL,
    material_id text NOT NULL,
    quantity double precision NOT NULL,
    unit text NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.worklog_material_usage OWNER TO ingerobotords;

--
-- Name: worklog_photos; Type: TABLE; Schema: public; Owner: ingerobotords
--

CREATE TABLE public.worklog_photos (
    id text NOT NULL,
    entry_id text NOT NULL,
    url text NOT NULL,
    caption text,
    "timestamp" timestamp(6) with time zone NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.worklog_photos OWNER TO ingerobotords;

--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: location_updates location_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.location_updates
    ADD CONSTRAINT location_updates_pkey PRIMARY KEY (id);


--
-- Name: material_consumptions material_consumptions_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.material_consumptions
    ADD CONSTRAINT material_consumptions_pkey PRIMARY KEY (id);


--
-- Name: material_losses material_losses_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.material_losses
    ADD CONSTRAINT material_losses_pkey PRIMARY KEY (id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: people people_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_pkey PRIMARY KEY (id);


--
-- Name: person_projects person_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.person_projects
    ADD CONSTRAINT person_projects_pkey PRIMARY KEY (id);


--
-- Name: person_teams person_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.person_teams
    ADD CONSTRAINT person_teams_pkey PRIMARY KEY (id);


--
-- Name: person_tenants person_tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.person_tenants
    ADD CONSTRAINT person_tenants_pkey PRIMARY KEY (id);


--
-- Name: project_materials project_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.project_materials
    ADD CONSTRAINT project_materials_pkey PRIMARY KEY (id);


--
-- Name: project_teams project_teams_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.project_teams
    ADD CONSTRAINT project_teams_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: reorder_requests reorder_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.reorder_requests
    ADD CONSTRAINT reorder_requests_pkey PRIMARY KEY (id);


--
-- Name: task_categories task_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.task_categories
    ADD CONSTRAINT task_categories_pkey PRIMARY KEY (id);


--
-- Name: task_progress_updates task_progress_updates_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.task_progress_updates
    ADD CONSTRAINT task_progress_updates_pkey PRIMARY KEY (id);


--
-- Name: task_project_assignments task_project_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.task_project_assignments
    ADD CONSTRAINT task_project_assignments_pkey PRIMARY KEY (id);


--
-- Name: task_worker_assignments task_worker_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.task_worker_assignments
    ADD CONSTRAINT task_worker_assignments_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: work_logs work_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.work_logs
    ADD CONSTRAINT work_logs_pkey PRIMARY KEY (id);


--
-- Name: worklog_entries worklog_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.worklog_entries
    ADD CONSTRAINT worklog_entries_pkey PRIMARY KEY (id);


--
-- Name: worklog_material_usage worklog_material_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.worklog_material_usage
    ADD CONSTRAINT worklog_material_usage_pkey PRIMARY KEY (id);


--
-- Name: worklog_photos worklog_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.worklog_photos
    ADD CONSTRAINT worklog_photos_pkey PRIMARY KEY (id);


--
-- Name: companies_slug_key; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE UNIQUE INDEX companies_slug_key ON public.companies USING btree (slug);


--
-- Name: location_updates_person_id_key; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE UNIQUE INDEX location_updates_person_id_key ON public.location_updates USING btree (person_id);


--
-- Name: material_consumptions_material_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX material_consumptions_material_id_idx ON public.material_consumptions USING btree (material_id);


--
-- Name: material_consumptions_project_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX material_consumptions_project_id_idx ON public.material_consumptions USING btree (project_id);


--
-- Name: material_consumptions_task_progress_update_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX material_consumptions_task_progress_update_id_idx ON public.material_consumptions USING btree (task_progress_update_id);


--
-- Name: material_losses_material_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX material_losses_material_id_idx ON public.material_losses USING btree (material_id);


--
-- Name: material_losses_task_progress_update_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX material_losses_task_progress_update_id_idx ON public.material_losses USING btree (task_progress_update_id);


--
-- Name: materials_deleted_at_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX materials_deleted_at_idx ON public.materials USING btree (deleted_at);


--
-- Name: people_email_key; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE UNIQUE INDEX people_email_key ON public.people USING btree (email);


--
-- Name: person_projects_person_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX person_projects_person_id_idx ON public.person_projects USING btree (person_id);


--
-- Name: person_projects_person_id_project_id_start_date_key; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE UNIQUE INDEX person_projects_person_id_project_id_start_date_key ON public.person_projects USING btree (person_id, project_id, start_date);


--
-- Name: person_projects_project_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX person_projects_project_id_idx ON public.person_projects USING btree (project_id);


--
-- Name: person_teams_person_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX person_teams_person_id_idx ON public.person_teams USING btree (person_id);


--
-- Name: person_teams_person_id_team_id_start_date_key; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE UNIQUE INDEX person_teams_person_id_team_id_start_date_key ON public.person_teams USING btree (person_id, team_id, start_date);


--
-- Name: person_teams_team_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX person_teams_team_id_idx ON public.person_teams USING btree (team_id);


--
-- Name: person_tenants_company_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX person_tenants_company_id_idx ON public.person_tenants USING btree (company_id);


--
-- Name: person_tenants_person_id_company_id_start_date_key; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE UNIQUE INDEX person_tenants_person_id_company_id_start_date_key ON public.person_tenants USING btree (person_id, company_id, start_date);


--
-- Name: person_tenants_person_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX person_tenants_person_id_idx ON public.person_tenants USING btree (person_id);


--
-- Name: project_materials_material_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX project_materials_material_id_idx ON public.project_materials USING btree (material_id);


--
-- Name: project_materials_project_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX project_materials_project_id_idx ON public.project_materials USING btree (project_id);


--
-- Name: project_materials_project_id_material_id_key; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE UNIQUE INDEX project_materials_project_id_material_id_key ON public.project_materials USING btree (project_id, material_id);


--
-- Name: project_teams_project_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX project_teams_project_id_idx ON public.project_teams USING btree (project_id);


--
-- Name: project_teams_project_id_team_id_key; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE UNIQUE INDEX project_teams_project_id_team_id_key ON public.project_teams USING btree (project_id, team_id);


--
-- Name: project_teams_team_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX project_teams_team_id_idx ON public.project_teams USING btree (team_id);


--
-- Name: task_progress_updates_assignment_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX task_progress_updates_assignment_id_idx ON public.task_progress_updates USING btree (assignment_id);


--
-- Name: task_progress_updates_project_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX task_progress_updates_project_id_idx ON public.task_progress_updates USING btree (project_id);


--
-- Name: task_progress_updates_task_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX task_progress_updates_task_id_idx ON public.task_progress_updates USING btree (task_id);


--
-- Name: task_progress_updates_worker_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX task_progress_updates_worker_id_idx ON public.task_progress_updates USING btree (worker_id);


--
-- Name: task_project_assignments_project_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX task_project_assignments_project_id_idx ON public.task_project_assignments USING btree (project_id);


--
-- Name: task_project_assignments_task_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX task_project_assignments_task_id_idx ON public.task_project_assignments USING btree (task_id);


--
-- Name: task_project_assignments_task_id_project_id_key; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE UNIQUE INDEX task_project_assignments_task_id_project_id_key ON public.task_project_assignments USING btree (task_id, project_id);


--
-- Name: task_worker_assignments_project_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX task_worker_assignments_project_id_idx ON public.task_worker_assignments USING btree (project_id);


--
-- Name: task_worker_assignments_task_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX task_worker_assignments_task_id_idx ON public.task_worker_assignments USING btree (task_id);


--
-- Name: task_worker_assignments_task_id_project_id_worker_id_key; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE UNIQUE INDEX task_worker_assignments_task_id_project_id_worker_id_key ON public.task_worker_assignments USING btree (task_id, project_id, worker_id);


--
-- Name: task_worker_assignments_worker_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX task_worker_assignments_worker_id_idx ON public.task_worker_assignments USING btree (worker_id);


--
-- Name: tasks_deleted_at_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX tasks_deleted_at_idx ON public.tasks USING btree (deleted_at);


--
-- Name: work_logs_company_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX work_logs_company_id_idx ON public.work_logs USING btree (company_id);


--
-- Name: work_logs_person_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX work_logs_person_id_idx ON public.work_logs USING btree (person_id);


--
-- Name: work_logs_project_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX work_logs_project_id_idx ON public.work_logs USING btree (project_id);


--
-- Name: worklog_entries_person_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX worklog_entries_person_id_idx ON public.worklog_entries USING btree (person_id);


--
-- Name: worklog_entries_project_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX worklog_entries_project_id_idx ON public.worklog_entries USING btree (project_id);


--
-- Name: worklog_entries_task_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX worklog_entries_task_id_idx ON public.worklog_entries USING btree (task_id);


--
-- Name: worklog_entries_worklog_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX worklog_entries_worklog_id_idx ON public.worklog_entries USING btree (worklog_id);


--
-- Name: worklog_material_usage_entry_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX worklog_material_usage_entry_id_idx ON public.worklog_material_usage USING btree (entry_id);


--
-- Name: worklog_material_usage_material_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX worklog_material_usage_material_id_idx ON public.worklog_material_usage USING btree (material_id);


--
-- Name: worklog_photos_entry_id_idx; Type: INDEX; Schema: public; Owner: ingerobotords
--

CREATE INDEX worklog_photos_entry_id_idx ON public.worklog_photos USING btree (entry_id);


--
-- Name: worklog_entries trg_audit_worklog_entries; Type: TRIGGER; Schema: public; Owner: ingerobotords
--

CREATE TRIGGER trg_audit_worklog_entries AFTER INSERT OR DELETE OR UPDATE ON public.worklog_entries FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes();


--
-- Name: worklog_material_usage trg_audit_worklog_material_usage; Type: TRIGGER; Schema: public; Owner: ingerobotords
--

CREATE TRIGGER trg_audit_worklog_material_usage AFTER INSERT OR DELETE OR UPDATE ON public.worklog_material_usage FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes();


--
-- Name: worklog_photos trg_audit_worklog_photos; Type: TRIGGER; Schema: public; Owner: ingerobotords
--

CREATE TRIGGER trg_audit_worklog_photos AFTER INSERT OR DELETE OR UPDATE ON public.worklog_photos FOR EACH ROW EXECUTE FUNCTION public.audit_row_changes();


--
-- Name: audit_logs audit_logs_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: inventory_movements inventory_movements_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: location_updates location_updates_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.location_updates
    ADD CONSTRAINT location_updates_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: material_consumptions material_consumptions_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.material_consumptions
    ADD CONSTRAINT material_consumptions_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: material_consumptions material_consumptions_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.material_consumptions
    ADD CONSTRAINT material_consumptions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: material_consumptions material_consumptions_task_progress_update_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.material_consumptions
    ADD CONSTRAINT material_consumptions_task_progress_update_id_fkey FOREIGN KEY (task_progress_update_id) REFERENCES public.task_progress_updates(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: material_losses material_losses_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.material_losses
    ADD CONSTRAINT material_losses_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: material_losses material_losses_task_progress_update_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.material_losses
    ADD CONSTRAINT material_losses_task_progress_update_id_fkey FOREIGN KEY (task_progress_update_id) REFERENCES public.task_progress_updates(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: people people_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.people
    ADD CONSTRAINT people_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: person_projects person_projects_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.person_projects
    ADD CONSTRAINT person_projects_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: person_projects person_projects_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.person_projects
    ADD CONSTRAINT person_projects_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: person_teams person_teams_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.person_teams
    ADD CONSTRAINT person_teams_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: person_teams person_teams_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.person_teams
    ADD CONSTRAINT person_teams_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: person_tenants person_tenants_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.person_tenants
    ADD CONSTRAINT person_tenants_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: person_tenants person_tenants_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.person_tenants
    ADD CONSTRAINT person_tenants_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_materials project_materials_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.project_materials
    ADD CONSTRAINT project_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: project_materials project_materials_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.project_materials
    ADD CONSTRAINT project_materials_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_teams project_teams_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.project_teams
    ADD CONSTRAINT project_teams_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: project_teams project_teams_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.project_teams
    ADD CONSTRAINT project_teams_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: projects projects_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: reorder_requests reorder_requests_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.reorder_requests
    ADD CONSTRAINT reorder_requests_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: task_progress_updates task_progress_updates_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.task_progress_updates
    ADD CONSTRAINT task_progress_updates_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.task_worker_assignments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: task_progress_updates task_progress_updates_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.task_progress_updates
    ADD CONSTRAINT task_progress_updates_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: task_progress_updates task_progress_updates_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.task_progress_updates
    ADD CONSTRAINT task_progress_updates_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: task_progress_updates task_progress_updates_worker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.task_progress_updates
    ADD CONSTRAINT task_progress_updates_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: task_project_assignments task_project_assignments_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.task_project_assignments
    ADD CONSTRAINT task_project_assignments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_project_assignments task_project_assignments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.task_project_assignments
    ADD CONSTRAINT task_project_assignments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_worker_assignments task_worker_assignments_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.task_worker_assignments
    ADD CONSTRAINT task_worker_assignments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_worker_assignments task_worker_assignments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.task_worker_assignments
    ADD CONSTRAINT task_worker_assignments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_worker_assignments task_worker_assignments_worker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.task_worker_assignments
    ADD CONSTRAINT task_worker_assignments_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.task_categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: teams teams_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_logs work_logs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.work_logs
    ADD CONSTRAINT work_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: work_logs work_logs_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.work_logs
    ADD CONSTRAINT work_logs_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: work_logs work_logs_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.work_logs
    ADD CONSTRAINT work_logs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: worklog_entries worklog_entries_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.worklog_entries
    ADD CONSTRAINT worklog_entries_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.people(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: worklog_entries worklog_entries_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.worklog_entries
    ADD CONSTRAINT worklog_entries_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: worklog_entries worklog_entries_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.worklog_entries
    ADD CONSTRAINT worklog_entries_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: worklog_entries worklog_entries_worklog_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.worklog_entries
    ADD CONSTRAINT worklog_entries_worklog_id_fkey FOREIGN KEY (worklog_id) REFERENCES public.work_logs(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: worklog_material_usage worklog_material_usage_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.worklog_material_usage
    ADD CONSTRAINT worklog_material_usage_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.worklog_entries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: worklog_material_usage worklog_material_usage_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.worklog_material_usage
    ADD CONSTRAINT worklog_material_usage_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: worklog_photos worklog_photos_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ingerobotords
--

ALTER TABLE ONLY public.worklog_photos
    ADD CONSTRAINT worklog_photos_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.worklog_entries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict MueOOLZdwpHAsG6N7oVlBV1Ufog5adsAKXTWOcfthLTdydRh7rmjrv2FqrHAiaM

