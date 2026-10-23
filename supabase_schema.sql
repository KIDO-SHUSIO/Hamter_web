-- ==============================================================================
-- THAI TRAVEL & SUBSCRIPTION PLATFORM (MAKE ME MONEY MODEL)
-- SUPABASE DATABASE SCHEMA & AUTH TRIGGER
-- ==============================================================================

-- 1. Profiles Table (รองรับผู้ใช้งาน, username, & ระดับสมาชิก)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    email TEXT,
    full_name TEXT NOT NULL DEFAULT 'นักเดินทางหน้าใหม่',
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role TEXT DEFAULT 'user',
    subscription_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'vip'
    subscription_status TEXT DEFAULT 'active', -- 'active', 'canceled', 'expired'
    subscription_expires_at TIMESTAMPTZ,
    total_distance_km NUMERIC(10, 2) DEFAULT 0.00,
    reward_coins INTEGER DEFAULT 50,
    savings_thb NUMERIC(10, 2) DEFAULT 450.00,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- เพิ่มคอลัมน์กรณีตารางถูกสร้างไว้ก่อนแล้ว
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='username') THEN
        ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='savings_thb') THEN
        ALTER TABLE public.profiles ADD COLUMN savings_thb NUMERIC(10, 2) DEFAULT 450.00;
    END IF;
END $$;

-- 2. Trigger อัตโนมัติ: เมื่อมีผู้ใช้ลงทะเบียนผ่าน Supabase Auth ให้สร้างข้อมูลใน public.profiles ทันที
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (auth_user_id, email, username, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')
  )
  ON CONFLICT (auth_user_id) DO UPDATE
  SET email = EXCLUDED.email,
      username = COALESCE(EXCLUDED.username, public.profiles.username);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Subscription Plans Table (แพ็กเกจสมาชิกที่สร้างรายได้)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_th TEXT NOT NULL,
    price_thb NUMERIC(10, 2) NOT NULL,
    billing_period TEXT NOT NULL, -- 'month', 'year'
    features JSONB NOT NULL,
    badge TEXT,
    is_popular BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Transactions / Orders Table (ประวัติการชำระเงินสร้างรายได้)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    plan_id TEXT REFERENCES public.subscription_plans(id),
    amount_thb NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL, -- 'promptpay', 'credit_card', 'true_money'
    payment_status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    transaction_ref TEXT UNIQUE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tourist Destinations (สถานที่ท่องเที่ยวตามแผนที่ GPS)
CREATE TABLE IF NOT EXISTS public.tourist_destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_th TEXT NOT NULL,
    name_en TEXT,
    category TEXT NOT NULL, -- 'nature', 'culture', 'cafe', 'camping', 'vip_secret'
    lat NUMERIC(9, 6) NOT NULL,
    lng NUMERIC(9, 6) NOT NULL,
    description TEXT,
    image_url TEXT,
    province TEXT NOT NULL,
    rating NUMERIC(2, 1) DEFAULT 4.8,
    is_vip_only BOOLEAN DEFAULT false,
    discount_privilege TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Activities & Travel Quests
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    travel_mode TEXT NOT NULL, -- 'walking', 'cycling', 'car', 'motorcycle'
    target_km NUMERIC(6, 2) NOT NULL,
    reward_coins INTEGER NOT NULL,
    reward_voucher TEXT,
    is_vip_boost BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Leaderboard (อันดับนักเดินทาง)
CREATE TABLE IF NOT EXISTS public.leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    total_km NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    completed_quests INTEGER DEFAULT 0,
    badge_title TEXT DEFAULT 'Explorer',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourist_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public profiles insert update" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Public plans read" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Public transactions view and insert" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Public destinations read" ON public.tourist_destinations FOR SELECT USING (true);
CREATE POLICY "Public activities read" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Public leaderboard read" ON public.leaderboard FOR SELECT USING (true);

-- ==============================================================================
-- SEED DATA
-- ==============================================================================
INSERT INTO public.subscription_plans (id, name, name_th, price_thb, billing_period, features, badge, is_popular)
VALUES 
('free', 'Explorer Free', 'นักสำรวจเริ่มต้น', 0.00, 'month', '["แผนที่ท่องเที่ยวทั่วไป", "ค้นหาสถานที่ยอดนิยม", "บันทึกระยะทางพื้นฐาน"]'::jsonb, 'ฟรีตลอดชีพ', false),
('pro', 'Pro Traveler', 'โปร ทราเวลเลอร์', 199.00, 'month', '["ระบบ GPS นำทางแม่นยำสูงพร้อมเตือนความเร็ว", "ปลดล็อกเควสกิจกรรมรับรางวัลเงินสด/คูปอง", "ไม่มีโฆษณากวนใจ 100%"]'::jsonb, 'ยอดนิยม 🔥', true),
('vip', 'VIP Elite Voyager', 'วีไอพี เอลีท วอยเอเจอร์', 499.00, 'month', '["สิทธิประโยชน์ทั้งหมดของ Pro", "ปลดล็อกพิกัดลับ Unseen Thailand 77 จังหวัด", "ส่วนลดโรงแรมและร้านอาหารชั้นนำสูงสุด 50%"]'::jsonb, 'คุ้มค่าสูงสุด 👑', false)
ON CONFLICT (id) DO UPDATE SET price_thb = EXCLUDED.price_thb;

INSERT INTO public.tourist_destinations (name_th, name_en, category, lat, lng, description, image_url, province, rating, is_vip_only, discount_privilege)
VALUES
('วัดพระศรีรัตนศาสดาราม (วัดพระแก้ว)', 'Wat Phra Kaew', 'culture', 13.7516, 100.4927, 'วัดคู่บ้านคู่เมือง สถาปัตยกรรมไทยชั้นสูงใจกลางพระนคร', 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600', 'กรุงเทพมหานคร', 4.9, false, 'รับฟรีโปสการ์ดที่ระลึก AR'),
('ดอยอินทนนท์ ยอดดอยสูงสุดแดนสยาม', 'Doi Inthanon', 'nature', 18.5884, 98.4870, 'จุดสูงสุดของประเทศไทย อากาศหนาวเย็นตลอดปี ทะเลหมอกตระการตา', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600', 'เชียงใหม่', 4.9, false, 'ส่วนลดกาแฟดอยช้าง 20%'),
('เกาะพีพีดอน อ่าวมาหยา', 'Phi Phi Islands', 'nature', 7.7407, 98.7784, 'สวรรค์แห่งอันดามัน น้ำทะเลใสราวกระจก หาดทรายขาวเนียน', 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600', 'กระบี่', 4.8, false, 'ส่วนลดทริปดำน้ำ 300 บาท'),
('จุดชมวิวผาเดียวดาย เขาใหญ่ (VIP Unseen)', 'Pha Diew Dai Secret View', 'vip_secret', 14.3600, 101.4000, 'จุดชมวิวทะเลหมอกพระอาทิตย์ขึ้นลับเฉพาะสมาชิก VIP ปลอดฝูงชน', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600', 'นครราชสีมา', 5.0, true, 'สิทธิ์กางเต็นท์ VIP โซนริมผา พร้อมชาอุ่น')
ON CONFLICT DO NOTHING;
