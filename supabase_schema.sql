-- ==============================================================================
-- THAI TRAVEL & SUBSCRIPTION PLATFORM (MAKE ME MONEY MODEL)
-- SUPABASE DATABASE SCHEMA & SEED DATA
-- ==============================================================================

-- 1. Profiles Table (รองรับผู้ใช้งาน & ระดับสมาชิก)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT NOT NULL DEFAULT 'นักเดินทางหน้าใหม่',
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role TEXT DEFAULT 'user',
    subscription_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'vip'
    subscription_status TEXT DEFAULT 'active', -- 'active', 'canceled', 'expired'
    subscription_expires_at TIMESTAMPTZ,
    total_distance_km NUMERIC(10, 2) DEFAULT 0.00,
    reward_coins INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Subscription Plans Table (แพ็กเกจสมาชิกที่สร้างรายได้)
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

-- 3. Transactions / Orders Table (ประวัติการชำระเงินสร้างรายได้)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    plan_id TEXT REFERENCES public.subscription_plans(id),
    amount_thb NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL, -- 'promptpay', 'credit_card', 'true_money'
    payment_status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    transaction_ref TEXT UNIQUE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tourist Destinations (สถานที่ท่องเที่ยวตามแผนที่ GPS)
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
    is_vip_only BOOLEAN DEFAULT false, -- จุดเช็กอินลับเฉพาะ VIP (กระตุ้นยอดขาย)
    discount_privilege TEXT, -- ส่วนลดพิเศษเมื่อเช็กอิน
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Activities & Travel Quests (กิจกรรมตาม Wireframe: เดิน, ปั่นจักรยาน, ขับรถ, มอเตอร์ไซค์)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    travel_mode TEXT NOT NULL, -- 'walking', 'cycling', 'car', 'motorcycle'
    target_km NUMERIC(6, 2) NOT NULL,
    reward_coins INTEGER NOT NULL,
    reward_voucher TEXT,
    is_vip_boost BOOLEAN DEFAULT false, -- ได้รับแต้ม x2 เมื่อเป็น VIP
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Leaderboard (อันดับนักเดินทาง)
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

-- Allow public read for demonstration
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public profiles insert update" ON public.profiles FOR ALL USING (true);

CREATE POLICY "Public plans read" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Public transactions view and insert" ON public.transactions FOR ALL USING (true);
CREATE POLICY "Public destinations read" ON public.tourist_destinations FOR SELECT USING (true);
CREATE POLICY "Public activities read" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Public leaderboard read" ON public.leaderboard FOR SELECT USING (true);

-- ==============================================================================
-- SEED DATA (ข้อมูลตัวอย่างที่พร้อมใช้งานทันที)
-- ==============================================================================

-- แพ็กเกจสมาชิกสร้างรายได้ (Subscription Plans)
INSERT INTO public.subscription_plans (id, name, name_th, price_thb, billing_period, features, badge, is_popular)
VALUES 
('free', 'Explorer Free', 'นักสำรวจเริ่มต้น', 0.00, 'month', 
 '["แผนที่ท่องเที่ยวทั่วไป", "ค้นหาสถานที่ยอดนิยม", "บันทึกระยะทางพื้นฐาน", "โฆษณาระหว่างใช้งาน"]'::jsonb, 
 'ฟรีตลอดชีพ', false),

('pro', 'Pro Traveler', 'โปร ทราเวลเลอร์', 199.00, 'month', 
 '["ระบบ GPS นำทางแม่นยำสูงพร้อมเตือนความเร็ว", "ปลดล็อกเควสกิจกรรมรับรางวัลเงินสด/คูปอง", "ไม่มีโฆษณากวนใจ 100%", "สิทธิ์เข้าร่วมลีดเดอร์บอร์ดชิงของรางวัลประจำเดือน", "คูปองส่วนลดที่พัก 15%"]'::jsonb, 
 'ยอดนิยม 🔥', true),

('vip', 'VIP Elite Voyager', 'วีไอพี เอลีท วอยเอเจอร์', 499.00, 'month', 
 '["สิทธิประโยชน์ทั้งหมดของ Pro", "ปลดล็อกพิกัดลับ Unseen Thailand 77 จังหวัด", "AI ส่วนตัวจัดทริป & คาดการณ์สภาพอากาศ", "ส่วนลดโรงแรมและร้านอาหารชั้นนำสูงสุด 50%", "ประกันอุบัติเหตุการเดินทางฟรี วงเงิน 100,000 บาท", "ป้ายสถานะมงกุฎทองคำบนลีดเดอร์บอร์ด"]'::jsonb, 
 'คุ้มค่าสูงสุด 👑', false)
ON CONFLICT (id) DO UPDATE SET price_thb = EXCLUDED.price_thb;

-- จุดหมายปลายทางตัวอย่างในไทย (Tourist Destinations)
INSERT INTO public.tourist_destinations (name_th, name_en, category, lat, lng, description, image_url, province, rating, is_vip_only, discount_privilege)
VALUES
('วัดพระศรีรัตนศาสดาราม (วัดพระแก้ว)', 'Wat Phra Kaew', 'culture', 13.7516, 100.4927, 'วัดคู่บ้านคู่เมือง สถาปัตยกรรมไทยชั้นสูงใจกลางพระนคร', 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600', 'กรุงเทพมหานคร', 4.9, false, 'รับฟรีโปสการ์ดที่ระลึก AR'),
('ดอยอินทนนท์ ยอดดอยสูงสุดแดนสยาม', 'Doi Inthanon', 'nature', 18.5884, 98.4870, 'จุดสูงสุดของประเทศไทย อากาศหนาวเย็นตลอดปี ทะเลหมอกตระการตา', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600', 'เชียงใหม่', 4.9, false, 'ส่วนลดกาแฟดอยช้าง 20%'),
('เกาะพีพีดอน อ่าวมาหยา', 'Phi Phi Islands', 'nature', 7.7407, 98.7784, 'สวรรค์แห่งอันดามัน น้ำทะเลใสราวกระจก หาดทรายขาวเนียน', 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600', 'กระบี่', 4.8, false, 'ส่วนลดทริปดำน้ำ 300 บาท'),
('จุดชมวิวผาเดียวดาย เขาใหญ่ (VIP Unseen)', 'Pha Diew Dai Secret View', 'vip_secret', 14.3600, 101.4000, 'จุดชมวิวทะเลหมอกพระอาทิตย์ขึ้นลับเฉพาะสมาชิก VIP ปลอดฝูงชน', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600', 'นครราชสีมา', 5.0, true, 'สิทธิ์กางเต็นท์ VIP โซนริมผา พร้อมชาอุ่น'),
('Slow Life Cafe Rim Khong', 'ริมโขง สโลว์ไลฟ์ คาเฟ่', 'cafe', 17.8931, 102.7483, 'คาเฟ่สไตล์โฮมมี่ วิวแม่น้ำโขงสุดผ่อนคลาย ขนมปังปิ้งสูตรโบราณ', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600', 'หนองคาย', 4.7, false, 'ฟรีเครื่องดื่ม 1 แก้วเมื่อสั่งขนม'),
('ลานกางเต็นท์หุบเขาหมอก สวนผึ้ง', 'Misty Valley Camping', 'camping', 13.5432, 99.3400, 'ลานกางเต็นท์พรีเมียมริมธารน้ำ ตื่นมารับสายหมอกและดูดาวตอนกลางคืน', 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=600', 'ราชบุรี', 4.8, false, 'ส่วนลดเช่าเต็นท์ 20%')
ON CONFLICT DO NOTHING;

-- เควสกิจกรรม (Activities)
INSERT INTO public.activities (title, travel_mode, target_km, reward_coins, reward_voucher, is_vip_boost, description)
VALUES
('ภารกิจเดินชิลชมเมืองเก่า (Walking Quest)', 'walking', 3.50, 150, 'คูปองไอศกรีมโบราณ ฿50', true, 'เดินสำรวจแลนด์มาร์กประวัติศาสตร์สะสมก้าวเดินเพื่อสุขภาพ'),
('ปั่นรับลมรอบบึง/แม่น้ำ (Cycling Quest)', 'cycling', 12.00, 300, 'ส่วนลดเช่าจักรยาน & คาเฟ่ ฿100', true, 'ปั่นจักรยานชมวิวธรรมชาติ สัมผัสวิถีชุมชนท้องถิ่น'),
('โรดทริปพิชิตโค้งเขาใหญ่ (Roadtrip Drive)', 'car', 45.00, 500, 'คูปองเติมน้ำมัน ฿150', false, 'ขับรถท่องเที่ยวผ่านเส้นทางธรรมชาติสายรองเพื่อส่งเสริมเศรษฐกิจชุมชน'),
('ไบค์เกอร์ลุยดอยล่าสายหมอก (Motorbike Adventure)', 'motorcycle', 25.00, 450, 'คูปองอาหารท้องถิ่น ฿120', true, 'ขับขี่มอเตอร์ไซค์รับลมเย็นบนเส้นทางวิวทิวทัศน์สุดตระการตา')
ON CONFLICT DO NOTHING;

-- อันดับลีดเดอร์บอร์ดตัวอย่าง (Leaderboard)
INSERT INTO public.leaderboard (display_name, avatar_url, total_km, completed_quests, badge_title)
VALUES
('พี่ตูน ชวนวิ่งตะลุยไทย', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', 342.80, 24, '🏆 Champion Voyager'),
('น้องฟ้า สายคาเฟ่ทั่วทิศ', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 289.50, 19, '🥈 Silver Explorer'),
('กัปตันป้อม แบกเป้เที่ยว', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', 215.30, 15, '🥉 Bronze Traveler'),
('เอก โคตรปั่นสองล้อ', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 168.20, 12, 'Pro Cyclist'),
('หมิว สายแคมป์ปิ้งภูเขา', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', 142.10, 10, 'Nature Lover'),
('บอย โรดทริปเปอร์', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 98.40, 7, 'Road Master')
ON CONFLICT DO NOTHING;
