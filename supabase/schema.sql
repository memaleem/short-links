-- הקמת מסד הנתונים למערכת קיצור הקישורים.
-- מריצים פעם אחת בפרויקט סופרבייס חדש: Dashboard -> SQL Editor -> הדבקה -> Run.
-- אחרי ההרצה: Settings -> API -> Exposed schemas -> להוסיף את links לרשימה.

create schema if not exists links;

-- הקישורים המקוצרים
create table links.links (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  destination_url text not null,
  title text,
  platform text,
  utm jsonb not null default '{}'::jsonb,
  pixel jsonb not null default '{}'::jsonb,
  archived boolean not null default false,
  click_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index links_links_slug_idx on links.links (slug);
create index links_links_created_idx on links.links (created_at desc);

-- תיעוד לחיצות
-- params: פרמטרי המעקב שהגיעו ב-query string של הקישור המקוצר (utm_campaign, gclid וכו').
-- מאפשר לפלח לחיצות לפי קמפיין תחת קישור אחד, במקום קישור נפרד לכל קמפיין.
create table links.clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references links.links(id) on delete cascade,
  created_at timestamptz not null default now(),
  country text,
  city text,
  device text,
  browser text,
  os text,
  referrer text,
  params jsonb
);

create index links_clicks_link_idx on links.clicks (link_id);
create index links_clicks_created_idx on links.clicks (created_at desc);
-- אינדקס חלקי - רק שורות שנושאות פרמטרים, כדי שיישאר קטן ברוב אורגני
create index links_clicks_params_idx on links.clicks using gin (params) where params is not null;

-- דף "המפה" - ריכוז קישורים אישי בכתובת סודית
create table links.hub_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  description text,
  category text not null,
  position integer not null default 0,
  starred boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hub_links_category_idx on links.hub_links (category, "position");

-- כל לחיצה שנרשמת מעדכנת אוטומטית את מונה הלחיצות של הקישור
create or replace function links.on_click() returns trigger
language plpgsql security definer as $$
begin
  update links.links set click_count = click_count + 1 where id = NEW.link_id;
  return NEW;
end $$;

create trigger clicks_increment after insert on links.clicks
for each row execute function links.on_click();

create or replace function links.increment_clicks(p_link_id uuid) returns void
language sql security definer as $$
  update links.links set click_count = click_count + 1 where id = p_link_id;
$$;

-- הרשאות גישה למפתח השרת (service role) - השרת הוא היחיד שניגש למסד
grant usage on schema links to service_role;
grant all on all tables in schema links to service_role;
grant execute on all functions in schema links to service_role;
alter default privileges in schema links grant all on tables to service_role;
