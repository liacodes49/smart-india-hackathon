CREATE TYPE "public"."connectivity_state" AS ENUM('ONLINE', 'DEGRADED', 'BLACKOUT');--> statement-breakpoint
CREATE TYPE "public"."gateway_protocol" AS ENUM('REST', 'MQTT', 'MODBUS', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('DAILY_SITREP', 'WEEKLY_ENERGY', 'FUEL_AUDIT', 'INCIDENT_SUMMARY');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('PENDING', 'SYNCING', 'SYNCED', 'FAILED', 'CONFLICT');--> statement-breakpoint
ALTER TYPE "public"."data_provenance" ADD VALUE 'EDGE_SYNC';--> statement-breakpoint
CREATE TABLE "edge_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" uuid NOT NULL,
	"edge_node_id" varchar(100) NOT NULL,
	"sequence_number" integer NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "sync_status" DEFAULT 'PENDING' NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "edge_outbox_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "edge_sync_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" uuid NOT NULL,
	"edge_node_id" varchar(100) NOT NULL,
	"batch_number" integer NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"first_sequence" integer NOT NULL,
	"last_sequence" integer NOT NULL,
	"record_count" integer DEFAULT 0 NOT NULL,
	"reconciled_count" integer DEFAULT 0 NOT NULL,
	"duplicate_count" integer DEFAULT 0 NOT NULL,
	"conflict_count" integer DEFAULT 0 NOT NULL,
	"status" "sync_status" DEFAULT 'PENDING' NOT NULL,
	"checksum" varchar(255) NOT NULL,
	"error_info" text,
	"metadata" jsonb,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "edge_sync_batches_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" uuid NOT NULL,
	"type" "report_type" NOT NULL,
	"format" varchar(20) DEFAULT 'JSON' NOT NULL,
	"title" varchar(255) NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"generated_by" uuid,
	"data_completeness_percent" real DEFAULT 100 NOT NULL,
	"summary_metrics" jsonb NOT NULL,
	"content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "edge_outbox" ADD CONSTRAINT "edge_outbox_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edge_sync_batches" ADD CONSTRAINT "edge_sync_batches_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_edge_outbox_station_status" ON "edge_outbox" USING btree ("station_id","status");--> statement-breakpoint
CREATE INDEX "idx_edge_outbox_seq" ON "edge_outbox" USING btree ("station_id","sequence_number");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_edge_outbox_idempotency" ON "edge_outbox" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_edge_batches_station_status" ON "edge_sync_batches" USING btree ("station_id","status");--> statement-breakpoint
CREATE INDEX "idx_edge_batches_edge_node" ON "edge_sync_batches" USING btree ("edge_node_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_edge_batches_idempotency" ON "edge_sync_batches" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_reports_station_type" ON "reports" USING btree ("station_id","type");--> statement-breakpoint
CREATE INDEX "idx_reports_period" ON "reports" USING btree ("period_start","period_end");