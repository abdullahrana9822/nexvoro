CREATE TABLE IF NOT EXISTS "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot" varchar(40) DEFAULT 'homepage' NOT NULL,
	"eyebrow" varchar(120),
	"title" varchar(200) NOT NULL,
	"subtitle" varchar(400),
	"cta_label" varchar(60),
	"cta_href" varchar(400),
	"image_url" varchar(500),
	"tone" varchar(40) DEFAULT 'brand' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "banners_slot_idx" ON "banners" USING btree ("slot","is_active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "banners_position_idx" ON "banners" USING btree ("position");
