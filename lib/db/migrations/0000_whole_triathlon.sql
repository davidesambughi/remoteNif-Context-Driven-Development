CREATE TYPE "public"."ai_review_status" AS ENUM('pending', 'clear', 'flagged', 'error', 'manual_review');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('passport', 'proof_of_address', 'signed_poa');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('en', 'fr', 'es', 'de');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('documents_pending', 'documents_under_review', 'documents_approved', 'submitted', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('customer', 'admin', 'operator');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('essential', 'standard', 'express');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"order_id" uuid,
	"action" text NOT NULL,
	"details" jsonb NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "document_type" NOT NULL,
	"file_path" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"ai_review_status" "ai_review_status",
	"ai_review_reason" text,
	"ai_reviewed_at" timestamp,
	"ai_review_attempts" integer DEFAULT 0 NOT NULL,
	"admin_override" boolean DEFAULT false NOT NULL,
	"admin_override_by" uuid,
	"admin_override_reason" text,
	"admin_override_at" timestamp,
	"approved" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp,
	"superseded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operator_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"operator_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "operator_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"sms_notifications" boolean DEFAULT true NOT NULL,
	"phone_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "operator_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tier" "tier" NOT NULL,
	"status" "order_status" DEFAULT 'documents_pending' NOT NULL,
	"full_name" text,
	"date_of_birth" date,
	"nationality" text,
	"passport_number" text,
	"passport_expiry" date,
	"address" text,
	"nif_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"documents_submitted_at" timestamp,
	"documents_approved_at" timestamp,
	"submitted_to_financas_at" timestamp,
	"delivered_at" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"fiscal_rep_expires_at" timestamp,
	"fiscal_rep_dismissed_at" timestamp,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_payment_intent_id" text NOT NULL,
	"stripe_checkout_session_id" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'eur' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"tier" "tier" NOT NULL,
	"is_renewal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id"),
	CONSTRAINT "payments_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" "role" DEFAULT 'customer' NOT NULL,
	"language" "language" DEFAULT 'en' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_admin_override_by_users_id_fk" FOREIGN KEY ("admin_override_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_notifications" ADD CONSTRAINT "operator_notifications_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_notifications" ADD CONSTRAINT "operator_notifications_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_preferences" ADD CONSTRAINT "operator_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_log_user_id" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_log_order_id" ON "audit_log" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_audit_log_action" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_log_created_at" ON "audit_log" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_documents_order_id" ON "documents" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_documents_user_id" ON "documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_documents_type" ON "documents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_documents_ai_review_status" ON "documents" USING btree ("ai_review_status");--> statement-breakpoint
CREATE INDEX "idx_operator_notifications_order_id" ON "operator_notifications" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_operator_notifications_status" ON "operator_notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_user_id" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_tier" ON "orders" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "idx_orders_created_at" ON "orders" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_orders_documents_approved_at" ON "orders" USING btree ("documents_approved_at") WHERE "orders"."status" = 'documents_approved';--> statement-breakpoint
CREATE INDEX "idx_payments_order_id" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_payments_user_id" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_payments_stripe_payment_intent_id" ON "payments" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_payments_stripe_checkout_session_id" ON "payments" USING btree ("stripe_checkout_session_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");