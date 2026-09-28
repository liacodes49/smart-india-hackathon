CREATE TYPE "public"."data_provenance" AS ENUM('SIMULATED', 'SENSOR', 'EXTERNAL_API', 'MANUAL');--> statement-breakpoint
ALTER TYPE "public"."maintenance_status" ADD VALUE 'RECOMMENDED' BEFORE 'PENDING';--> statement-breakpoint
CREATE TABLE "weather_observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" uuid NOT NULL,
	"temperature" real NOT NULL,
	"wind_speed" real NOT NULL,
	"wind_gust" real NOT NULL,
	"wind_direction" varchar(16) NOT NULL,
	"wind_chill" real NOT NULL,
	"pressure" real NOT NULL,
	"humidity" real NOT NULL,
	"visibility_meters" integer NOT NULL,
	"condition" varchar(32) NOT NULL,
	"provenance" "data_provenance" DEFAULT 'SIMULATED' NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weather_observations" ADD CONSTRAINT "weather_observations_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_weather_station_time" ON "weather_observations" USING btree ("station_id","recorded_at");--> statement-breakpoint
CREATE INDEX "idx_weather_provenance" ON "weather_observations" USING btree ("provenance");