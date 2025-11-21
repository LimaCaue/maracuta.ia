-- Create legislative_proposals table
CREATE TABLE IF NOT EXISTS legislative_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  status TEXT NOT NULL DEFAULT 'em_tramitacao',
  house TEXT NOT NULL, -- 'camara' or 'senado'
  proposal_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create risk_alerts table
CREATE TABLE IF NOT EXISTS risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES legislative_proposals(id) ON DELETE CASCADE,
  risk_level TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  risk_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_population TEXT[],
  jabuti_detected BOOLEAN DEFAULT false,
  ai_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create viral_content table
CREATE TABLE IF NOT EXISTS viral_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES risk_alerts(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'audio', 'video', 'image'
  content_url TEXT,
  script TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  topics TEXT[],
  risk_levels TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_proposals_status ON legislative_proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_house ON legislative_proposals(house);
CREATE INDEX IF NOT EXISTS idx_alerts_risk_level ON risk_alerts(risk_level);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON risk_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_viral_views ON viral_content(views DESC);

-- Enable RLS
ALTER TABLE legislative_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Public read policies for proposals and alerts
CREATE POLICY "Anyone can view proposals" ON legislative_proposals FOR SELECT USING (true);
CREATE POLICY "Anyone can view alerts" ON risk_alerts FOR SELECT USING (true);
CREATE POLICY "Anyone can view viral content" ON viral_content FOR SELECT USING (true);

-- Subscription policies
CREATE POLICY "Anyone can create subscriptions" ON user_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view their subscriptions" ON user_subscriptions FOR SELECT USING (true);
