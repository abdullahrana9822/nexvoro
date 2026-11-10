-- NEXVORO uses server-side PostgreSQL sessions, not Supabase Auth JWTs.
-- Therefore no anon/authenticated PostgREST access is required to app tables.
-- Owners (the server connection) retain access; existing rows are untouched.
DO $$
DECLARE
  table_name text;
  api_role text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users','sessions','password_reset_tokens','addresses','brands','categories',
    'products','product_variants','reviews','carts','cart_items','wishlist_items',
    'coupons','shipping_plans','orders','order_items','order_events','payments',
    'notifications','settings','audit_logs','newsletter_subscribers',
    'contact_messages','banners'
  ] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      FOREACH api_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = api_role) THEN
          EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name, api_role);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- Only create buckets when running on Supabase. Never overwrite an existing
-- bucket's access settings: the owner may already have intentionally set them.
DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES
      ('product-images','product-images',true,10485760,ARRAY['image/jpeg','image/png','image/webp','image/avif']),
      ('category-images','category-images',true,10485760,ARRAY['image/jpeg','image/png','image/webp','image/avif']),
      ('brand-logos','brand-logos',true,2097152,ARRAY['image/jpeg','image/png','image/webp','image/avif']),
      ('homepage-banners','homepage-banners',true,10485760,ARRAY['image/jpeg','image/png','image/webp','image/avif']),
      ('customer-uploads','customer-uploads',false,5242880,ARRAY['image/jpeg','image/png','image/webp','image/avif'])
    ON CONFLICT (id) DO NOTHING;
    -- No browser write policies: uploads must pass application authorization
    -- before using the server-only service-role Storage helper.
  END IF;
END $$;
