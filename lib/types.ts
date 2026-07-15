export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  properties?: Property[];
  type?: 'property_recommendations' | 'information' | 'comparison';
}

export interface Property {
  id: string;
  title: string;
  address: string;
  district: string;
  price: number;
  currency: string;
  rooms: number;
  bathrooms: number;
  area: number;
  floor: string;
  year_built: number;
  condition: string;
  description: string;
  features: string[];
  developer: string;
  images: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  nearby: string[];
  price_per_sqm: number;
  available: boolean;
  listing_date: string;
  match_score?: number;
}

export interface ChatRequest {
  messages: ChatMessage[];
  sessionId?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  status: 'success' | 'error';
  error?: string;
}

export interface SSEEvent {
  type: 'message' | 'error' | 'done' | 'properties_update';
  content?: string;
  error?: string;
  data?: PropertyDisplayCommand;
}

export interface PropertyDisplayCommand {
  properties: string[];      // IDs of properties to show
  top_choice?: string;       // ID of the recommended property
  criteria_extracted: string[]; // What criteria AI extracted from user query
  insights: {
    total_found: number;     // Total properties matching criteria
    shown: number;           // Number being displayed
    best_district?: string;  // AI-identified best district for this search
    reason?: string;         // Reason for recommendations
  };
}

export interface ClaudeStreamEvent {
  type: string;
  message?: {
    content: string | ContentBlock[];
    [key: string]: any;
  };
  content?: string | ContentBlock;
  delta?: {
    text?: string;
    [key: string]: any;
  };
  error?: string;
  [key: string]: any;
}

export interface ContentBlock {
  type: 'text' | string;
  text?: string;
  [key: string]: any;
}

// Point of Interest interface for nearby locations
export interface POI {
  name: string;
  distance_m: number;
  walk_time_min?: number;
  rating?: number;
}

// Search criteria for property filtering
export interface SearchCriteria {
  min_price?: number;
  max_price?: number;
  currency?: 'AMD' | 'USD';
  min_rooms?: number;
  max_rooms?: number;
  districts?: string[];
  has_school_nearby?: boolean;
  safety_level?: 'low' | 'medium' | 'high';
  property_type?: 'apartment' | 'house' | 'studio';
  deal_type?: 'long_term_rental' | 'short_term_rental' | 'sale';
  pets_allowed?: boolean;
  has_parking?: boolean;
  family_size?: number;
  search_context?: string;
}

// Property types for real estate listings from external sources
export interface PropertyShowcase {
  id: string;
  name: string;           // Название ЖК
  title?: string;         // Alternative name field
  address: string;        // Адрес
  district: string;       // Район
  price: number;          // Цена в USD
  currency?: string;      // Currency code
  pricePerSqm?: number;   // Цена за м²
  area: number;           // Площадь м²
  rooms: number;          // Количество комнат
  bathrooms?: number;     // Количество ванных
  floor?: number;         // Этаж
  total_floors?: number;  // Всего этажей
  totalFloors?: number;   // Всего этажей (alias)
  year_built?: number;    // Год постройки
  imageUrl?: string;      // URL изображения с источника
  images?: string[];      // Массив URL изображений
  sourceUrl?: string;     // Ссылка на источник (list.am, construction.am)
  sourceName?: string;    // Название источника
  developer?: string;     // Застройщик
  description?: string;   // Описание объекта
  features?: string[];    // List of features
  completionDate?: string; // Дата сдачи
  condition?: 'new' | 'renovation' | 'needs_repair' | 'shell' | string; // Состояние
  listing_date?: string;  // Date when listed
  coordinates?: {         // Alternative coordinates format
    lat: number;
    lng: number;
  };

  // AI Recommendations (CRITICAL - frontend expects these)
  is_top_choice: boolean;
  recommendation_reasons: string[];
  warning?: string;
  match_score: number; // 0-100

  // Geo coordinates (for map)
  latitude: number;
  longitude: number;

  // Field aliases (frontend uses these names)
  bedrooms: number;      // alias for rooms
  size_sqm: number;      // alias for area
  neighborhood: string;  // alias for district
  image_url: string;     // first from images[]

  // Contact info
  contact?: {
    name: string;
    type: 'owner' | 'agent';
    verified: boolean;
    phone?: string;
  };

  // Owner info (from User table)
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    user_type?: string;
  };

  // Nearby Points of Interest
  nearby_pois?: {
    schools: POI[];
    parks: POI[];
    metro: POI[];
    supermarkets: POI[];
  };

  // Extended characteristics
  building_type?: 'brick' | 'panel' | 'monolith';
  utilities_estimate?: number;
  deposit_months?: number;
  minimum_lease_months?: number;
  pets_allowed?: boolean;
  has_parking?: boolean;
  has_balcony?: boolean;
  has_virtual_tour?: boolean;
  property_type?: 'apartment' | 'house' | 'studio';
  deal_type?: 'long_term_rental' | 'short_term_rental' | 'sale';
  verified?: boolean;
  available?: boolean;
}

export interface PropertySearchResult {
  properties: PropertyShowcase[];
  totalCount: number;
  source: string;
  timestamp: string;
}

// WebSocket communication types for AI-controlled property display

export interface AIInsights {
  best_neighborhood: string;
  description: string;
  analyzed_count: number;
  suitable_count: number;
  recommended_count: number;
  neighborhood_count: number;
}

export interface WebSocketChatMessage {
  type: 'message';
  content: string;
}

// Property data returned by show_properties tool
export interface PropertyFromTool {
  id: string;
  title?: string;
  name?: string;
  address: string;
  district: string;
  neighborhood?: string;
  price: number;
  currency: string;
  rooms: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  size_sqm?: number;
  floor?: number;
  totalFloors?: number;
  latitude: number;
  longitude: number;
  images: string[];
  image_url?: string;
  match_score?: number;
  hasParking?: boolean;
  hasBalcony?: boolean;
  petsAllowed?: boolean;
  recommendation_reasons?: string[];
  is_top_choice?: boolean;
}

// Extended PropertyDisplayCommand for WebSocket communication with AIInsights
// show_properties tool returns full property objects, not just IDs
export interface WebSocketPropertyDisplayCommand {
  properties: PropertyFromTool[];
  top_choice: string | null;
  criteria_extracted?: string[];
  criteria?: string[];
  insights?: AIInsights | null;
  top_choice_title?: string;
  top_choice_reason?: string;
}

export interface WebSocketPropertiesUpdate {
  type: 'properties_update';
  data: WebSocketPropertyDisplayCommand;
}

export interface WebSocketError {
  type: 'error';
  error: string;
}

export interface WebSocketConnected {
  type: 'connected';
}

/** Sent by /ws/chat when an anonymous visitor exceeds the free AI allowance
 *  and must sign in to continue (C2). */
export interface WebSocketAuthRequired {
  type: 'auth_required';
  error?: string;
}

export type WebSocketMessage =
  | WebSocketChatMessage
  | WebSocketPropertiesUpdate
  | WebSocketError
  | WebSocketConnected
  | WebSocketAuthRequired;

// Reviews System Types
export interface Review {
  id: string;
  property_id: string;
  user_id: string;
  rating: number; // 1-5
  comment: string | null;
  created_at: string;
  updated_at?: string;
  user?: {
    id: string;
    email: string;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: ReviewStats;
}

export interface CreateReviewRequest {
  rating: number;
  comment?: string;
}
