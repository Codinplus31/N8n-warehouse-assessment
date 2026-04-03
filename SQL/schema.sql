CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(3072),
  match_count     INT DEFAULT 3,
  filter          JSONB DEFAULT '{}'
)
RETURNS TABLE (
  id          BIGINT,
  content     TEXT,
  metadata    JSONB,
  similarity  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pm.id,
    pm.content,
    jsonb_build_object(
      'product_name', pm.product_name,
      'category',     pm.category,
      'version',      pm.version,
      'last_updated', pm.last_updated
    ) AS metadata,
    1 - (pm.embedding <=> query_embedding) AS similarity
  FROM product_manuals pm
  WHERE pm.embedding IS NOT NULL
  ORDER BY pm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
