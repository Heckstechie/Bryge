-- Migration: 003_create_site_banners
CREATE TABLE IF NOT EXISTS site_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  cta_text  VARCHAR(255),
  cta_url   TEXT,
  active    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_site_banners_updated_at
  BEFORE UPDATE ON site_banners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
