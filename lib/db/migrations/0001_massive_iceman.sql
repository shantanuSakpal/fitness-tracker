ALTER TABLE "foods" RENAME COLUMN "weight_or_count" TO "weight_grams";--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "unit_count" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "is_fruit" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "foods" ADD COLUMN "fruit_grams" real DEFAULT 0 NOT NULL;