CREATE TABLE "knowledge_chunks" (
	"id" text PRIMARY KEY,
	"version_id" text NOT NULL,
	"document_id" text NOT NULL,
	"title" text NOT NULL,
	"area" text NOT NULL,
	"section" text NOT NULL,
	"ordinal" integer NOT NULL,
	"text" text NOT NULL,
	"content_hash" text NOT NULL,
	"vector_id" text NOT NULL UNIQUE
);
--> statement-breakpoint
CREATE TABLE "knowledge_documents" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"area" text NOT NULL,
	"path" text NOT NULL,
	"content_hash" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_index_versions" (
	"id" text PRIMARY KEY,
	"embedding_model" text NOT NULL,
	"dimensions" integer NOT NULL,
	"index_name" text NOT NULL,
	"state" text DEFAULT 'preparing' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activated_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_one_active_model" ON "knowledge_index_versions" ("embedding_model") WHERE "state" = 'active';--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_version_id_knowledge_index_versions_id_fkey" FOREIGN KEY ("version_id") REFERENCES "knowledge_index_versions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_id_knowledge_documents_id_fkey" FOREIGN KEY ("document_id") REFERENCES "knowledge_documents"("id") ON DELETE RESTRICT;