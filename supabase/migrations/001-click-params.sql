-- מיגרציה 001 - פילוח לחיצות לפי קמפיין
--
-- למי זה מיועד: מי שכבר הריץ את schema.sql בעבר ויש לו מסד פעיל.
-- בהתקנה חדשה אין צורך להריץ את זה - העמודה כבר קיימת ב-schema.sql.
--
-- איך מריצים: Supabase Dashboard -> SQL Editor -> הדבקה -> Run.
-- בטוח להרצה חוזרת (if not exists).

-- פרמטרי המעקב שהגיעו ב-query string של הקישור המקוצר.
-- לדוגמה: {"utm_campaign": "ep12_gads", "utm_medium": "cpc", "gclid": "..."}
alter table links.clicks add column if not exists params jsonb;

-- אינדקס לשליפה לפי קמפיין. חלקי - רק שורות שבאמת נושאות פרמטרים,
-- כך שהוא נשאר קטן גם כשרוב הלחיצות אורגניות.
create index if not exists links_clicks_params_idx
  on links.clicks using gin (params)
  where params is not null;
