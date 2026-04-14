CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"log_date" date,
	"food_name" text NOT NULL,
	"weight_grams" real DEFAULT 0 NOT NULL,
	"unit_count" real DEFAULT 0 NOT NULL,
	"calories" integer DEFAULT 0 NOT NULL,
	"protein" real DEFAULT 0 NOT NULL,
	"fat" real DEFAULT 0 NOT NULL,
	"fiber" real DEFAULT 0 NOT NULL,
	"is_fruit" boolean DEFAULT false NOT NULL,
	"fruit_grams" real DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"calories_target" integer DEFAULT 0 NOT NULL,
	"calories_consumed" integer DEFAULT 0 NOT NULL,
	"protein_target" integer DEFAULT 0 NOT NULL,
	"protein_consumed" real DEFAULT 0 NOT NULL,
	"training_done" boolean DEFAULT false NOT NULL,
	"training_notes" text DEFAULT '' NOT NULL,
	"sleep_hours" real DEFAULT 0 NOT NULL,
	"step_count" integer DEFAULT 0 NOT NULL,
	"walk_after_lunch" boolean DEFAULT false NOT NULL,
	"walk_after_dinner" boolean DEFAULT false NOT NULL,
	"zone2_done" boolean DEFAULT false NOT NULL,
	"water_intake" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"fiber_consumed" real DEFAULT 0 NOT NULL,
	"fruits_consumed" real DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "inputs_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "outputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"body_weight" real DEFAULT 0 NOT NULL,
	"waist" real DEFAULT 0 NOT NULL,
	"chest" real DEFAULT 0 NOT NULL,
	"arm" real DEFAULT 0 NOT NULL,
	"thigh" real DEFAULT 0 NOT NULL,
	"progress_photo_url" text DEFAULT '' NOT NULL,
	"energy_level" text DEFAULT '' NOT NULL,
	"mood" text DEFAULT '' NOT NULL,
	"recovery" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL,
	CONSTRAINT "outputs_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "unique_foods" (
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
