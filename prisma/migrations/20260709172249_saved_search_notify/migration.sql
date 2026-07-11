-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL DEFAULT 'user',
    "user_type" TEXT DEFAULT 'buyer',
    "language_preference" TEXT DEFAULT 'en',
    "phone" TEXT,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "search_preferences" JSONB,
    "name" VARCHAR(100),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "patronymic" VARCHAR(100),
    "avatar_url" VARCHAR(500),
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "blocked_at" TIMESTAMP(3),
    "blocked_by" UUID,
    "block_reason" TEXT,
    "is_online" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "email" VARCHAR(255) NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'registration',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "provider" VARCHAR(50) NOT NULL,
    "provider_user_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID,
    "title" VARCHAR(500) NOT NULL,
    "address" VARCHAR(500),
    "district" VARCHAR(100),
    "neighborhood" VARCHAR(100),
    "price" DECIMAL(12,2),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'AMD',
    "rooms" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "area" DECIMAL(10,2),
    "size_sqm" DECIMAL(10,2),
    "floor" INTEGER,
    "total_floors" INTEGER,
    "year_built" INTEGER,
    "building_type" VARCHAR(50),
    "condition" VARCHAR(50),
    "description" TEXT,
    "features" TEXT[],
    "images" TEXT[],
    "image_url" VARCHAR(500),
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "match_score" INTEGER NOT NULL DEFAULT 0,
    "is_top_choice" BOOLEAN NOT NULL DEFAULT false,
    "recommendation_reasons" TEXT[],
    "warning" TEXT,
    "utilities_estimate" DECIMAL(10,2),
    "deposit_months" INTEGER,
    "minimum_lease_months" INTEGER,
    "pets_allowed" BOOLEAN NOT NULL DEFAULT false,
    "has_parking" BOOLEAN NOT NULL DEFAULT false,
    "has_balcony" BOOLEAN NOT NULL DEFAULT false,
    "property_type" VARCHAR(50),
    "deal_type" VARCHAR(50),
    "contact" JSONB,
    "nearby_pois" JSONB,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "listing_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "legal_analysis" JSONB,
    "location_analysis" JSONB,
    "infrastructure_analysis" JSONB,
    "investment_analysis" JSONB,
    "virtual_tour_enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viewings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "property_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "agent_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "last_proposed_by_id" UUID NOT NULL,
    "cancelled_by_id" UUID,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_client',
    "comment" TEXT,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "viewings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "properties_count" INTEGER NOT NULL DEFAULT 0,
    "cities_count" INTEGER NOT NULL DEFAULT 0,
    "deals_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ViewingSlot" (
    "id" TEXT NOT NULL,
    "property_id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "booked_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViewingSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyListing" (
    "id" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "property_type" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "area" DOUBLE PRECISION NOT NULL,
    "rooms" INTEGER NOT NULL,
    "description" TEXT,
    "photos" JSONB,
    "contact" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "moderated_at" TIMESTAMP(3),
    "moderated_by" UUID,
    "rejection_reason" TEXT,

    CONSTRAINT "PropertyListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_action_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admin_id" UUID NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "target_type" VARCHAR(50) NOT NULL,
    "target_id" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VirtualTourRoom" (
    "id" TEXT NOT NULL,
    "property_id" UUID NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_ru" TEXT NOT NULL,
    "name_hy" TEXT NOT NULL,
    "panorama_url" TEXT NOT NULL,
    "hotspots" JSONB,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VirtualTourRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "property_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255),
    "comment" TEXT,
    "query" TEXT NOT NULL,
    "chatMessages" JSONB NOT NULL,
    "properties" JSONB NOT NULL,
    "criteriaChips" TEXT[],
    "insights" JSONB,
    "top_choice_id" TEXT,
    "notify" BOOLEAN NOT NULL DEFAULT true,
    "notify_criteria" JSONB,
    "known_property_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'open',
    "property_id" UUID,
    "client_id" UUID NOT NULL,
    "consultant_id" UUID,
    "subject" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_users_blocked" ON "users"("is_blocked");

-- CreateIndex
CREATE INDEX "idx_otp_email_code" ON "otp_codes"("email", "code");

-- CreateIndex
CREATE INDEX "idx_otp_user_id" ON "otp_codes"("user_id");

-- CreateIndex
CREATE INDEX "idx_otp_expires_at" ON "otp_codes"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_password_reset_token" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_password_reset_user_id" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_oauth_user_id" ON "oauth_accounts"("user_id");

-- CreateIndex
CREATE INDEX "idx_oauth_provider" ON "oauth_accounts"("provider", "provider_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_provider_user_id_key" ON "oauth_accounts"("provider", "provider_user_id");

-- CreateIndex
CREATE INDEX "idx_properties_owner_id" ON "properties"("owner_id");

-- CreateIndex
CREATE INDEX "idx_properties_district" ON "properties"("district");

-- CreateIndex
CREATE INDEX "idx_properties_neighborhood" ON "properties"("neighborhood");

-- CreateIndex
CREATE INDEX "idx_properties_price" ON "properties"("price");

-- CreateIndex
CREATE INDEX "idx_properties_available" ON "properties"("available");

-- CreateIndex
CREATE INDEX "idx_properties_property_type" ON "properties"("property_type");

-- CreateIndex
CREATE INDEX "idx_properties_deal_type" ON "properties"("deal_type");

-- CreateIndex
CREATE INDEX "idx_properties_rooms" ON "properties"("rooms");

-- CreateIndex
CREATE INDEX "idx_properties_bedrooms" ON "properties"("bedrooms");

-- CreateIndex
CREATE INDEX "idx_properties_area" ON "properties"("area");

-- CreateIndex
CREATE INDEX "idx_properties_listing_date" ON "properties"("listing_date");

-- CreateIndex
CREATE INDEX "idx_properties_location" ON "properties"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "idx_favorites_user_id" ON "favorites"("user_id");

-- CreateIndex
CREATE INDEX "idx_favorites_property_id" ON "favorites"("property_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_property_id_key" ON "favorites"("user_id", "property_id");

-- CreateIndex
CREATE INDEX "viewings_property_id_idx" ON "viewings"("property_id");

-- CreateIndex
CREATE INDEX "viewings_client_id_idx" ON "viewings"("client_id");

-- CreateIndex
CREATE INDEX "viewings_agent_id_idx" ON "viewings"("agent_id");

-- CreateIndex
CREATE INDEX "viewings_status_idx" ON "viewings"("status");

-- CreateIndex
CREATE INDEX "ViewingSlot_property_id_idx" ON "ViewingSlot"("property_id");

-- CreateIndex
CREATE INDEX "ViewingSlot_date_idx" ON "ViewingSlot"("date");

-- CreateIndex
CREATE INDEX "PropertyListing_owner_id_idx" ON "PropertyListing"("owner_id");

-- CreateIndex
CREATE INDEX "PropertyListing_status_idx" ON "PropertyListing"("status");

-- CreateIndex
CREATE INDEX "idx_listings_moderation" ON "PropertyListing"("status", "created_at");

-- CreateIndex
CREATE INDEX "idx_admin_log_admin" ON "admin_action_logs"("admin_id");

-- CreateIndex
CREATE INDEX "idx_admin_log_target" ON "admin_action_logs"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "idx_admin_log_date" ON "admin_action_logs"("created_at");

-- CreateIndex
CREATE INDEX "VirtualTourRoom_property_id_idx" ON "VirtualTourRoom"("property_id");

-- CreateIndex
CREATE INDEX "idx_notifications_user_read" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE INDEX "idx_notifications_user_created" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "reviews_property_id_idx" ON "reviews"("property_id");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_property_id_user_id_key" ON "reviews"("property_id", "user_id");

-- CreateIndex
CREATE INDEX "saved_searches_user_id_idx" ON "saved_searches"("user_id");

-- CreateIndex
CREATE INDEX "saved_searches_notify_idx" ON "saved_searches"("notify");

-- CreateIndex
CREATE INDEX "conversations_client_id_idx" ON "conversations"("client_id");

-- CreateIndex
CREATE INDEX "conversations_consultant_id_idx" ON "conversations"("consultant_id");

-- CreateIndex
CREATE INDEX "conversations_status_idx" ON "conversations"("status");

-- CreateIndex
CREATE INDEX "conversations_type_idx" ON "conversations"("type");

-- CreateIndex
CREATE INDEX "conversations_updated_at_idx" ON "conversations"("updated_at");

-- CreateIndex
CREATE INDEX "live_chat_messages_conversation_id_idx" ON "live_chat_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "live_chat_messages_sender_id_idx" ON "live_chat_messages"("sender_id");

-- CreateIndex
CREATE INDEX "live_chat_messages_conversation_id_created_at_idx" ON "live_chat_messages"("conversation_id", "created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_blocked_by_fkey" FOREIGN KEY ("blocked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewings" ADD CONSTRAINT "viewings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewings" ADD CONSTRAINT "viewings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewings" ADD CONSTRAINT "viewings_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewings" ADD CONSTRAINT "viewings_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewings" ADD CONSTRAINT "viewings_last_proposed_by_id_fkey" FOREIGN KEY ("last_proposed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viewings" ADD CONSTRAINT "viewings_cancelled_by_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewingSlot" ADD CONSTRAINT "ViewingSlot_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewingSlot" ADD CONSTRAINT "ViewingSlot_booked_by_fkey" FOREIGN KEY ("booked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyListing" ADD CONSTRAINT "PropertyListing_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_action_logs" ADD CONSTRAINT "admin_action_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualTourRoom" ADD CONSTRAINT "VirtualTourRoom_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_chat_messages" ADD CONSTRAINT "live_chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_chat_messages" ADD CONSTRAINT "live_chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
