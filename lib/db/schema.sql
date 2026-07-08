-- HomLy Database Schema
-- PostgreSQL database schema for HomLy real estate platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- OTP CODES TABLE
-- ============================================
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  type VARCHAR(20) DEFAULT 'registration',
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- OAUTH ACCOUNTS TABLE
-- ============================================
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

-- ============================================
-- PROPERTIES TABLE
-- ============================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  address VARCHAR(500),
  district VARCHAR(100),
  neighborhood VARCHAR(100),
  price DECIMAL(12,2),
  currency VARCHAR(10) DEFAULT 'AMD',
  rooms INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  area DECIMAL(10,2),
  size_sqm DECIMAL(10,2),
  floor INTEGER,
  total_floors INTEGER,
  year_built INTEGER,
  building_type VARCHAR(50),
  condition VARCHAR(50),
  description TEXT,
  features TEXT[],
  images TEXT[],
  image_url VARCHAR(500),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  match_score INTEGER DEFAULT 0,
  is_top_choice BOOLEAN DEFAULT FALSE,
  recommendation_reasons TEXT[],
  warning TEXT,
  utilities_estimate DECIMAL(10,2),
  deposit_months INTEGER,
  minimum_lease_months INTEGER,
  pets_allowed BOOLEAN DEFAULT FALSE,
  has_parking BOOLEAN DEFAULT FALSE,
  has_balcony BOOLEAN DEFAULT FALSE,
  property_type VARCHAR(50),
  deal_type VARCHAR(50),
  contact JSONB,
  nearby_pois JSONB,
  available BOOLEAN DEFAULT TRUE,
  verified BOOLEAN DEFAULT FALSE,
  listing_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- ============================================
-- VIEWINGS TABLE
-- ============================================
CREATE TABLE viewings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- PLATFORM METRICS TABLE
-- ============================================
CREATE TABLE platform_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  properties_count INTEGER DEFAULT 0,
  cities_count INTEGER DEFAULT 0,
  deals_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);

-- OTP codes indexes
CREATE INDEX idx_otp_email_code ON otp_codes(email, code);
CREATE INDEX idx_otp_user_id ON otp_codes(user_id);
CREATE INDEX idx_otp_expires_at ON otp_codes(expires_at);

-- Password reset tokens indexes
CREATE INDEX idx_password_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_user_id ON password_reset_tokens(user_id);

-- OAuth accounts indexes
CREATE INDEX idx_oauth_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_provider ON oauth_accounts(provider, provider_user_id);

-- Properties indexes
CREATE INDEX idx_properties_district ON properties(district);
CREATE INDEX idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_available ON properties(available);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_deal_type ON properties(deal_type);
CREATE INDEX idx_properties_rooms ON properties(rooms);
CREATE INDEX idx_properties_bedrooms ON properties(bedrooms);
CREATE INDEX idx_properties_area ON properties(area);
CREATE INDEX idx_properties_listing_date ON properties(listing_date);
CREATE INDEX idx_properties_location ON properties(latitude, longitude);

-- Favorites indexes
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_property_id ON favorites(property_id);

-- Viewings indexes
CREATE INDEX idx_viewings_user_id ON viewings(user_id);
CREATE INDEX idx_viewings_property_id ON viewings(property_id);
CREATE INDEX idx_viewings_scheduled_at ON viewings(scheduled_at);
CREATE INDEX idx_viewings_status ON viewings(status);

-- ============================================
-- TRIGGER FUNCTION FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_metrics_updated_at
    BEFORE UPDATE ON platform_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
