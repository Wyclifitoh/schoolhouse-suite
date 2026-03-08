
-- Move pg_trgm to extensions schema
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Update fuzzy_match_admission to use extensions schema
CREATE OR REPLACE FUNCTION public.fuzzy_match_admission(p_reference TEXT, p_school_id UUID)
RETURNS TABLE(id UUID, full_name TEXT, admission_number TEXT, similarity_score REAL)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.full_name, s.admission_number,
    extensions.similarity(LOWER(s.admission_number), LOWER(p_reference)) AS similarity_score
  FROM students s
  WHERE s.school_id = p_school_id
    AND extensions.similarity(LOWER(s.admission_number), LOWER(p_reference)) > 0.3
  ORDER BY similarity_score DESC
  LIMIT 5;
END;
$$;
