CREATE TYPE "public"."asset_criticality" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."inventory_category" AS ENUM('FUEL', 'FOOD', 'WATER', 'MEDICAL', 'SPARE_PARTS', 'CONSUMABLES');--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50) NOT NULL,
	"category" "inventory_category" NOT NULL,
	"current_stock" real DEFAULT 0 NOT NULL,
	"minimum_threshold" real DEFAULT 0 NOT NULL,
	"unit" varchar(50) NOT NULL,
	"location" varchar(255),
	"expiration_date" timestamp with time zone,
	"resupply_date" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_items_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "resource_consumption" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"station_id" uuid NOT NULL,
	"asset_id" uuid,
	"quantity" real NOT NULL,
	"unit" varchar(50) NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now() NOT NULL,
	"logged_by" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "criticality" "asset_criticality" DEFAULT 'MEDIUM' NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_consumption" ADD CONSTRAINT "resource_consumption_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_consumption" ADD CONSTRAINT "resource_consumption_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_consumption" ADD CONSTRAINT "resource_consumption_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_consumption" ADD CONSTRAINT "resource_consumption_logged_by_users_id_fk" FOREIGN KEY ("logged_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_inventory_station" ON "inventory_items" USING btree ("station_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_category" ON "inventory_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_resource_consumption_item" ON "resource_consumption" USING btree ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_resource_consumption_station" ON "resource_consumption" USING btree ("station_id");--> statement-breakpoint
CREATE INDEX "idx_alerts_station_status" ON "alerts" USING btree ("station_id","status");--> statement-breakpoint
CREATE INDEX "idx_alerts_sensor" ON "alerts" USING btree ("sensor_id");--> statement-breakpoint
CREATE INDEX "idx_assets_station" ON "assets" USING btree ("station_id");--> statement-breakpoint
CREATE INDEX "idx_assets_category" ON "assets" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_sensors_station" ON "sensors" USING btree ("station_id");--> statement-breakpoint
CREATE INDEX "idx_sensors_asset" ON "sensors" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "idx_sensors_type" ON "sensors" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_telemetry_sensor_timestamp" ON "telemetry" USING btree ("sensor_id","timestamp");--> statement-breakpoint
CREATE INDEX "idx_telemetry_station_timestamp" ON "telemetry" USING btree ("station_id","timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_telemetry_sensor_timestamp_unique" ON "telemetry" USING btree ("sensor_id","timestamp");