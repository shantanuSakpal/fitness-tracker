-- Safe on fresh DBs (no-op) and on legacy DBs (text weight_grams, missing unique_foods).
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns c
		WHERE c.table_schema = 'public'
			AND c.table_name = 'foods'
			AND c.column_name = 'weight_grams'
			AND c.data_type IN ('text', 'character varying')
	) THEN
		ALTER TABLE "foods" ALTER COLUMN "weight_grams" DROP DEFAULT;
		ALTER TABLE "foods" ALTER COLUMN "weight_grams" TYPE real USING (
			CASE
				WHEN trim(both from "weight_grams"::text) = '' THEN 0::real
				WHEN trim(both from "weight_grams"::text) ~ '^-?[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?$'
					THEN trim(both from "weight_grams"::text)::real
				ELSE 0::real
			END
		);
		ALTER TABLE "foods" ALTER COLUMN "weight_grams" SET DEFAULT 0;
	END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unique_foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_key" text NOT NULL,
	"food_name" text NOT NULL,
	"calories_per_100g" real DEFAULT 0 NOT NULL,
	"protein_per_100g" real DEFAULT 0 NOT NULL,
	"fat_per_100g" real DEFAULT 0 NOT NULL,
	"fiber_per_100g" real DEFAULT 0 NOT NULL,
	"is_fruit" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "unique_foods_name_key_unique" UNIQUE("name_key")
);
