-- Optional recorded memory and owner-editable appearance; existing owner RLS applies.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS building_customization jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS lessons_learned text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS revival_requirements text;
-- Owner RLS protects rows; this protects every visitor rendering public appearance data.
ALTER TABLE public.projects ADD CONSTRAINT projects_building_customization_shape CHECK (
  CASE
    WHEN building_customization IS NULL THEN true
    WHEN jsonb_typeof(building_customization) <> 'object' THEN false
    ELSE COALESCE(
      building_customization ?& ARRAY['height','glowIntensity','style','color']
      AND building_customization - ARRAY['height','glowIntensity','style','color'] = '{}'::jsonb
      AND CASE WHEN jsonb_typeof(building_customization->'height') = 'number'
        THEN (building_customization->>'height')::numeric BETWEEN 0.5 AND 2 ELSE false END
      AND CASE WHEN jsonb_typeof(building_customization->'glowIntensity') = 'number'
        THEN (building_customization->>'glowIntensity')::numeric BETWEEN 0.5 AND 4 ELSE false END
      AND building_customization->>'style' IN ('standard','spire','pyramid','dome','crystal')
      AND building_customization->>'color' ~ '^#[0-9A-Fa-f]{6}$'
    , false)
  END
);
