/* ==============================================================================
   THAI TRAVEL & SUBSCRIPTION PLATFORM - CORE JAVASCRIPT LOGIC
   Theme: การท่องเที่ยวไทย x โมเดลสร้างรายได้ (Make Me Money Concept)
   Supabase Integrated Backend & Auth System (Login & Register)
   Real Hardware GPS Geolocation & Speedometer Engine
   ============================================================================== */

// HARDCODED SUPABASE CREDENTIALS (เชื่อมต่อ Supabase ทันที)
const SUPABASE_URL = 'https://tmwotpolpmjuhdwxpnlo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VB5eS4RGhbaX-l0MqPdkZw_FcUw-iox';

// Longdo Map API Key (ใช้ร่วมกันทั้ง Map SDK และ Search API)
const LONGDO_API_KEY = '3be021d3baa4e7ddd10d07dcec80f561';

// POI Categories สำหรับค้นหาสถานที่ใกล้เคียงผ่าน Longdo Map Search API
const POI_CATEGORIES = {
  hotel:      { tag: 'hotel',       keyword: 'โรงแรม ที่พัก',           icon: 'fa-hotel',      color: '#8b5cf6', label: 'โรงแรม' },
  mall:       { tag: 'shopping',    keyword: 'ห้างสรรพสินค้า ศูนย์การค้า ช้อปปิ้ง', icon: 'fa-store', color: '#3b82f6', label: 'ห้าง' },
  restaurant: { tag: 'restaurant',  keyword: 'ร้านอาหาร อาหาร',         icon: 'fa-utensils',   color: '#f97316', label: 'ร้านอาหาร' },
  cafe:       { tag: 'cafe',        keyword: 'คาเฟ่ กาแฟ ร้านกาแฟ',    icon: 'fa-mug-saucer', color: '#d97706', label: 'คาเฟ่' },
  gas:        { tag: 'gas_station', keyword: 'ปั๊มน้ำมัน ปตท บางจาก',  icon: 'fa-gas-pump',   color: '#ef4444', label: 'ปั๊มน้ำมัน' },
  hospital:   { tag: 'hospital',    keyword: 'โรงพยาบาล คลินิก',       icon: 'fa-hospital',   color: '#10b981', label: 'โรงพยาบาล' }
};

// Global State
const STATE = {
  activeView: 'auth', // 'auth' | 'app'
  activeAppScreen: 'map', // 'map' | 'activities' | 'leaderboard' | 'account'
  activeCategoryFilter: 'all',
  
  // Supabase Client
  supabase: null,
  isSupabaseConnected: false,
  authUser: null, // Supabase Auth User object

  // Current User Profile
  user: {
    id: null,
    username: 'นักเดินทางหน้าใหม่',
    fullName: 'ผู้เยี่ยมชม (Guest)',
    email: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    tier: 'free', // 'free' | 'pro' | 'vip'
    status: 'active',
    expiresAt: null,
    totalDistanceKm: 0.0,
    savingsThb: 450,
    coins: 50,
    isLoggedIn: false
  },

  // Real-time GPS & Speedometer tracking
  gps: {
    lat: null,       // null จนกว่าจะได้ตำแหน่งจริง
    lng: null,       // null จนกว่าจะได้ตำแหน่งจริง
    accuracy: null,
    speedKmH: 0,
    targetSpeed: 0,
    tripDistanceKm: 0.0,
    mode: 'stopped',
    simTimer: null,
    isRealGpsActive: false,
    gpsResolved: false  // true เมื่อได้ตำแหน่งจริง (หรือ fallback) แล้ว
  },

  // Active pending payment
  pendingOrder: {
    planId: 'vip',
    planName: 'VIP Elite Voyager',
    priceThb: 499,
    method: 'promptpay'
  },

  // Quests matching wireframe (เดิน, ปั่น, รถ, มอเตอร์ไซค์)
  activities: [
    {
      id: 'act_1',
      title: 'ภารกิจเดินชิลชมเมืองเก่า (Walking Quest)',
      mode: 'walking',
      icon: 'fa-person-walking',
      colorClass: 'mode-walking',
      currentKm: 2.8,
      targetKm: 3.5,
      rewardCoins: 150,
      rewardVoucher: 'คูปองไอศกรีมโบราณ ฿50',
      isClaimed: false
    },
    {
      id: 'act_2',
      title: 'ปั่นรับลมรอบบึง/แม่น้ำ (Cycling Quest)',
      mode: 'cycling',
      icon: 'fa-bicycle',
      colorClass: 'mode-cycling',
      currentKm: 7.2,
      targetKm: 12.0,
      rewardCoins: 300,
      rewardVoucher: 'ส่วนลดเช่าจักรยาน ฿100',
      isClaimed: false
    },
    {
      id: 'act_3',
      title: 'โรดทริปพิชิตโค้งเขาใหญ่ (Roadtrip Drive)',
      mode: 'car',
      icon: 'fa-car',
      colorClass: 'mode-car',
      currentKm: 38.0,
      targetKm: 45.0,
      rewardCoins: 500,
      rewardVoucher: 'คูปองเติมน้ำมัน ฿150',
      isClaimed: false
    },
    {
      id: 'act_4',
      title: 'ไบค์เกอร์ลุยดอยล่าสายหมอก (Motorbike Adventure)',
      mode: 'motorcycle',
      icon: 'fa-motorcycle',
      colorClass: 'mode-motorcycle',
      currentKm: 14.5,
      targetKm: 25.0,
      rewardCoins: 450,
      rewardVoucher: 'คูปองอาหารท้องถิ่น ฿120',
      isClaimed: false
    }
  ],

  // Leaderboard data matching wireframe (Podium 1, 2, 3 & List 4, 5, 6)
  leaderboard: [
    { rank: 1, name: 'พี่ตูน ชวนวิ่ง', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', km: 342.8, badge: '🏆 Champion' },
    { rank: 2, name: 'น้องฟ้า สายชิล', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', km: 289.5, badge: '🥈 Silver' },
    { rank: 3, name: 'กัปตันป้อม แบกเป้', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', km: 215.3, badge: '🥉 Bronze' },
    { rank: 4, name: 'เอก โคตรปั่นสองล้อ', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', km: 168.2, badge: 'Pro Cyclist' },
    { rank: 5, name: 'หมิว สายแคมป์ปิ้ง', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', km: 142.1, badge: 'Nature Lover' },
    { rank: 6, name: 'บอย โรดทริปเปอร์', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', km: 98.4, badge: 'Road Master' }
  ],

  // Tourist Destinations
  destinations: [
    {
      id: 'dest_1',
      nameTh: 'วัดพระแก้ว & พระบรมมหาราชวัง',
      category: 'culture',
      province: 'กรุงเทพมหานคร',
      lat: 13.7516,
      lng: 100.4927,
      rating: 4.9,
      isVipOnly: false,
      image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600',
      description: 'ศูนย์รวมศิลปวัฒนธรรมไทยชั้นสูง พระอุโบสถประดิษฐานพระพุทธมหามณีรัตนปฏิมากร',
      perk: 'รับฟรีโปสการ์ดที่ระลึก AR'
    },
    {
      id: 'dest_2',
      nameTh: 'ดอยอินทนนท์ ยอดดอยสูงสุดแดนสยาม',
      category: 'nature',
      province: 'เชียงใหม่',
      lat: 18.5884,
      lng: 98.4870,
      rating: 4.9,
      isVipOnly: false,
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600',
      description: 'จุดสูงสุดของประเทศไทย อากาศหนาวเย็นตลอดปี เส้นทางศึกษาธรรมชาติกิ่วแม่ปาน',
      perk: 'ส่วนลดกาแฟดอยช้าง 20%'
    },
    {
      id: 'dest_3',
      nameTh: 'เกาะพีพีดอน & อ่าวมาหยา',
      category: 'nature',
      province: 'กระบี่',
      lat: 7.7407,
      lng: 98.7784,
      rating: 4.8,
      isVipOnly: false,
      image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600',
      description: 'อัญมณีแห่งทะเลอันดามัน น้ำใส หาดทรายขาวละเอียด จุดดำน้ำระดับโลก',
      perk: 'ส่วนลดแพ็กเกจเรือหางยาว ฿300'
    },
    {
      id: 'dest_4',
      nameTh: 'ริมโขง สโลว์ไลฟ์ คาเฟ่',
      category: 'cafe',
      province: 'หนองคาย',
      lat: 17.8931,
      lng: 102.7483,
      rating: 4.7,
      isVipOnly: false,
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600',
      description: 'คาเฟ่บรรยากาศอบอุ่นริมแม่น้ำโขง ชมพระอาทิตย์ตกดินสุดโรแมนติก',
      perk: 'ฟรีเครื่องดื่ม 1 แก้วเมื่อสั่งขนม'
    },
    {
      id: 'dest_5',
      nameTh: 'หุบเขาหมอก แคมป์ปิ้ง สวนผึ้ง',
      category: 'camping',
      province: 'ราชบุรี',
      lat: 13.5432,
      lng: 99.3400,
      rating: 4.8,
      isVipOnly: false,
      image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=600',
      description: 'ลานกางเต็นท์ริมลำธาร อากาศบริสุทธิ์ ตื่นมาสัมผัสหมอกยามเช้า',
      perk: 'ส่วนลดค่ากางเต็นท์ 20%'
    },
    {
      id: 'dest_6',
      nameTh: 'ผาเดียวดาย จุดชมวิวทะเลหมอกลับ (VIP Unseen)',
      category: 'vip_secret',
      province: 'นครราชสีมา (เขาใหญ่)',
      lat: 14.3600,
      lng: 101.4000,
      rating: 5.0,
      isVipOnly: true,
      image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600',
      description: 'พิกัดลับเฉพาะสมาชิก VIP ยอดผาชมพระอาทิตย์ขึ้น 360 องศา ปลอดผู้คนพลุกพล่าน',
      perk: 'สิทธิ์กางเต็นท์ VIP โซนริมผา + ชาอุ่นฟรี'
    }
  ],

  transactions: []
};

// Longdo Map & Geolocation Instances
let longdoMap = null;
let mapMarkers = [];
let userLocationMarker = null;
let userAccuracyCircle = null;
let searchResultMarker = null;
let watchGpsId = null;

// ==============================================================================
// PAGE ROUTING & NAVIGATION (Auth Page vs Main App Page)
// ==============================================================================
function showMainApp() {
  const pageAuth = document.getElementById('page-auth');
  const pageMain = document.getElementById('page-main');
  if (pageAuth) pageAuth.classList.remove('active');
  if (pageMain) pageMain.classList.add('active');
  STATE.activeView = 'app';

  if (!longdoMap && !STATE.gps.gpsResolved) {
    // ยังไม่เคย init แผนที่ — เริ่มกระบวนการ GPS → Map
    setTimeout(() => {
      resolveGpsAndInitMap();
    }, 150);
  } else if (!longdoMap && STATE.gps.gpsResolved) {
    // GPS resolved แล้วแต่แผนที่ยังไม่ init (กรณีหายาก)
    setTimeout(() => {
      const lat = STATE.gps.lat || DEFAULT_LAT;
      const lng = STATE.gps.lng || DEFAULT_LNG;
      initLongdoMap(lat, lng, 15);
    }, 150);
  } else if (longdoMap) {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 150);
  }
}

function showAuthPage() {
  const pageAuth = document.getElementById('page-auth');
  const pageMain = document.getElementById('page-main');
  if (pageMain) pageMain.classList.remove('active');
  if (pageAuth) pageAuth.classList.add('active');
  STATE.activeView = 'auth';
}

function switchAuthPageMode(mode) {
  const loginView = document.getElementById('form-login-view');
  const regView = document.getElementById('form-register-view');
  const tabLogin = document.getElementById('tabBtnLogin');
  const tabReg = document.getElementById('tabBtnRegister');

  if (mode === 'register') {
    if (loginView) loginView.style.display = 'none';
    if (regView) regView.style.display = 'block';
    if (tabLogin) tabLogin.classList.remove('active');
    if (tabReg) tabReg.classList.add('active');
  } else {
    if (loginView) loginView.style.display = 'block';
    if (regView) regView.style.display = 'none';
    if (tabLogin) tabLogin.classList.add('active');
    if (tabReg) tabReg.classList.remove('active');
  }
}

function enterAsGuest() {
  STATE.user.isLoggedIn = false;
  STATE.user.username = 'Guest';
  STATE.user.fullName = 'ผู้เยี่ยมชม (Guest)';
  STATE.user.tier = 'free';
  updateUserUI();
  showMainApp();
  showToast('เข้าใช้งานในโหมดผู้เยี่ยมชม (Guest Mode)', 'info');
}

function switchAppScreen(screenId) {
  STATE.activeAppScreen = screenId;

  // Toggle active class on screen sections
  document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
  const targetScreen = document.getElementById(`screen-${screenId}`);
  if (targetScreen) targetScreen.classList.add('active');

  // Toggle active class on bottom nav items
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  const targetNav = document.getElementById(`nav-btn-${screenId}`);
  if (targetNav) targetNav.classList.add('active');

  if (screenId === 'map') {
    if (longdoMap) {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
  } else if (screenId === 'activities') {
    renderActivities();
  } else if (screenId === 'leaderboard') {
    renderLeaderboard();
  } else if (screenId === 'account') {
    updateUserUI();
  }
}

// ==============================================================================
// SUPABASE CLIENT INITIALIZATION & AUTHENTICATION
// ==============================================================================
function initSupabaseClient() {
  const authDot = document.getElementById('authStatusDot');

  if (window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      STATE.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      STATE.isSupabaseConnected = true;
      if (authDot) authDot.className = 'auth-dot';

      listenToAuthState();

      // Check for active session
      STATE.supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session && session.user) {
          await handleAuthSession(session);
          showMainApp();
        } else {
          updateUserUI();
        }
      });
      return;
    } catch (err) {
      // Supabase initialization not available
    }
  }

  STATE.isSupabaseConnected = false;
  if (authDot) authDot.className = 'auth-dot offline';
}

function listenToAuthState() {
  if (!STATE.supabase) return;

  STATE.supabase.auth.onAuthStateChange(async (event, session) => {
    if (session && session.user) {
      await handleAuthSession(session);
    } else {
      STATE.authUser = null;
      STATE.user.isLoggedIn = false;
      STATE.user.fullName = 'ผู้เยี่ยมชม (Guest)';
      STATE.user.username = 'Guest';
      STATE.user.email = '';
      STATE.user.tier = 'free';
      persistState();
      updateUserUI();
    }
  });
}

async function handleAuthSession(session) {
  STATE.authUser = session.user;
  STATE.user.id = session.user.id;
  STATE.user.email = session.user.email;
  STATE.user.isLoggedIn = true;

  const meta = session.user.user_metadata || {};
  if (meta.username) STATE.user.username = meta.username;
  if (meta.full_name) STATE.user.fullName = meta.full_name;

  // Sync profile details from Supabase public.profiles
  if (STATE.supabase) {
    try {
      const { data: profile } = await STATE.supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (profile) {
        STATE.user.username = profile.username || STATE.user.username;
        STATE.user.fullName = profile.full_name || STATE.user.fullName;
        STATE.user.tier = profile.subscription_tier || 'free';
        STATE.user.savingsThb = profile.savings_thb || STATE.user.savingsThb;
        STATE.user.coins = profile.reward_coins || STATE.user.coins;
        STATE.user.totalDistanceKm = profile.total_distance_km || STATE.user.totalDistanceKm;
        if (profile.avatar_url) STATE.user.avatar = profile.avatar_url;
      }
    } catch (e) {
      // Profile fetch unavailable
    }
  }

  persistState();
  updateUserUI();
}

// 1. Handle Login (Username หรือ Email + Password)
async function handleLoginSubmit(event) {
  event.preventDefault();
  const usernameOrEmail = document.getElementById('loginUsernameInput').value.trim();
  const password = document.getElementById('loginPasswordInput').value;
  const submitBtn = document.getElementById('btnLoginSubmit');

  if (!usernameOrEmail || !password) {
    showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
    return;
  }

  const origBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังเข้าสู่ระบบ...';
  submitBtn.disabled = true;

  try {
    if (!STATE.supabase) {
      throw new Error('ระบบ Supabase ยังไม่พร้อมใช้งาน');
    }

    let emailToUse = usernameOrEmail;

    // ถ้าป้อนเป็น username (ไม่มี @) ให้ค้นหา email จาก public.profiles
    if (!emailToUse.includes('@')) {
      const { data: profile } = await STATE.supabase
        .from('profiles')
        .select('email')
        .ilike('username', emailToUse)
        .limit(1)
        .maybeSingle();

      if (profile && profile.email) {
        emailToUse = profile.email;
      } else {
        emailToUse = `${usernameOrEmail.toLowerCase()}@gothai.app`;
      }
    }

    const { data, error } = await STATE.supabase.auth.signInWithPassword({
      email: emailToUse,
      password: password
    });

    if (error) throw error;

    showToast(`ยินดีต้อนรับกลับมาคุณ ${data.user.user_metadata?.username || usernameOrEmail}!`, 'success');
    showMainApp();
    triggerConfetti();

  } catch (err) {
    showToast(err.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'warning');
  } finally {
    submitBtn.innerHTML = origBtnText;
    submitBtn.disabled = false;
  }
}

// 2. Handle Register (Username, Email, Password พร้อมแจ้งยืนยันอีเมล)
async function handleRegisterSubmit(event) {
  event.preventDefault();
  const username = document.getElementById('regUsernameInput').value.trim();
  const email = document.getElementById('regEmailInput').value.trim();
  const password = document.getElementById('regPasswordInput').value;
  const submitBtn = document.getElementById('btnRegisterSubmit');

  if (!username || !email || !password) {
    showToast('กรุณากรอกข้อมูลให้ครบทุกช่อง', 'warning');
    return;
  }

  const origBtnText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังสร้างบัญชี...';
  submitBtn.disabled = true;

  try {
    if (!STATE.supabase) {
      throw new Error('ระบบ Supabase ยังไม่พร้อมใช้งาน');
    }

    const { data, error } = await STATE.supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username,
          full_name: username
        }
      }
    });

    if (error) throw error;

    // ตรวจสอบการส่งลิงก์ยืนยันอีเมล
    if (data.user && (!data.session || data.user.identities?.length === 0 || !data.user.email_confirmed_at)) {
      showToast(`✉️ สมัครสำเร็จ! ระบบได้ส่งลิงก์ยืนยันไปที่ ${email} แล้ว กรุณาเช็กกล่องจดหมาย`, 'success');
      switchAuthPageMode('login');
      const loginInput = document.getElementById('loginUsernameInput');
      if (loginInput) loginInput.value = username;
    } else {
      showToast('สมัครสมาชิกสำเร็จและเข้าสู่ระบบอัตโนมัติ!', 'success');
      showMainApp();
      triggerConfetti();
    }

  } catch (err) {
    showToast(err.message || 'ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง', 'warning');
  } finally {
    submitBtn.innerHTML = origBtnText;
    submitBtn.disabled = false;
  }
}

// 3. Handle Logout
async function handleLogout() {
  if (STATE.supabase) {
    try {
      await STATE.supabase.auth.signOut();
    } catch (e) {
      // Signout error handled gracefully
    }
  }

  STATE.authUser = null;
  STATE.user.isLoggedIn = false;
  STATE.user.username = 'Guest';
  STATE.user.fullName = 'ผู้เยี่ยมชม (Guest)';
  STATE.user.email = '';
  STATE.user.tier = 'free';
  localStorage.removeItem('gothai_user');

  updateUserUI();
  showAuthPage();
  showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
}

// ==============================================================================
// LONGDO MAP API v3 & REAL GPS GEOLOCATION & SPEEDOMETER
// ==============================================================================

// ค่า fallback กรุงเทพฯ — ใช้เฉพาะเมื่อ GPS ไม่พร้อมใช้งาน
const DEFAULT_LAT = 13.7563;
const DEFAULT_LNG = 100.5018;

/**
 * Smart Multi-Tier Device Location Resolver:
 * Tier 1: HTML5 Geolocation (Hardware GPS / Wi-Fi / Cell network)
 * Tier 2: Network IP Geolocation (ipwho.is / geojs.io) - ทำงาน 100% บน PC/โน้ตบุ๊กที่ไม่มีชิป GPS
 * Tier 3: Default Bangkok Fallback
 */
async function getDeviceRealPosition(timeoutMs = 4000) {
  // 1. ลองดึงผ่าน Browser Geolocation (โหมด standard accuracy ไม่รอ timeout ดาวเทียม)
  const tryBrowserGeo = (highAccuracy) => new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy || 30,
        speed: pos.coords.speed,
        source: highAccuracy ? 'GPS ดาวเทียม' : 'พิกัดเครือข่ายอุปกรณ์'
      }),
      (err) => reject(err),
      { enableHighAccuracy: highAccuracy, timeout: timeoutMs, maximumAge: 30000 }
    );
  });

  // ลอง Standard Geolocation ก่อน (ตอบสนองไวมากทั้งบนมือถือและคอมพิวเตอร์)
  try {
    return await tryBrowserGeo(false);
  } catch (err1) {
    // Standard geolocation unavailable, trying IP fallback
  }

  // 2. สำรองอัตโนมัติด้วย IP-Based Geolocation (ได้ตำแหน่งเมือง/จังหวัดจริงของผู้ใช้ เช่น สมุทรสาคร, กรุงเทพฯ ฯลฯ)
  try {
    const res = await fetch('https://ipwho.is/');
    const data = await res.json();
    if (data && data.success && data.latitude && data.longitude) {
      const locName = data.city || data.region || 'ประเทศไทย';
      return {
        lat: parseFloat(data.latitude),
        lng: parseFloat(data.longitude),
        accuracy: 1000,
        speed: 0,
        source: `เครือข่าย ${locName}`,
        locationName: locName
      };
    }
  } catch (err2) {
    // ipwho.is lookup failed, trying geojs fallback
  }

  try {
    const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
    const data = await res.json();
    if (data && data.latitude && data.longitude) {
      const locName = data.city || data.region || 'ประเทศไทย';
      return {
        lat: parseFloat(data.latitude),
        lng: parseFloat(data.longitude),
        accuracy: 1000,
        speed: 0,
        source: `เครือข่าย ${locName}`,
        locationName: locName
      };
    }
  } catch (err3) {
    // All IP lookups failed, using default fallback
  }

  // 3. Fallback สุดท้ายถ้าไม่มีเน็ต
  return {
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    accuracy: 5000,
    speed: 0,
    source: 'ค่าเริ่มต้น',
    locationName: 'กรุงเทพฯ'
  };
}

/**
 * เริ่มกระบวนการรับตำแหน่งอุปกรณ์จริงก่อน แล้วค่อย init แผนที่ Longdo
 */
async function resolveGpsAndInitMap() {
  const mapEl = document.getElementById('longdo-map');
  if (!mapEl) return;

  // แสดง loading overlay บนแผนที่
  showMapGpsLoading(true);

  try {
    const pos = await getDeviceRealPosition(4000);
    STATE.gps.lat = pos.lat;
    STATE.gps.lng = pos.lng;
    STATE.gps.accuracy = pos.accuracy;
    STATE.gps.isRealGpsActive = (pos.lat !== DEFAULT_LAT || pos.lng !== DEFAULT_LNG);
    STATE.gps.gpsResolved = true;

    showMapGpsLoading(false);
    initLongdoMap(pos.lat, pos.lng, 14);
    updateUserRealGPS(pos.lat, pos.lng, pos.accuracy, pos.speed);
    startGpsWatcher();

    showToast(`📍 พิกัดอุปกรณ์จริง: ${pos.locationName ? pos.locationName + ' ' : ''}(${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}) [${pos.source}]`, 'success');
  } catch (err) {
    applyFallbackPosition('ไม่สามารถดึงตำแหน่งได้');
  }
}

function applyFallbackPosition(reason) {
  if (STATE.gps.gpsResolved) return;
  STATE.gps.lat = DEFAULT_LAT;
  STATE.gps.lng = DEFAULT_LNG;
  STATE.gps.gpsResolved = true;
  STATE.gps.isRealGpsActive = false;

  showMapGpsLoading(false);
  initLongdoMap(DEFAULT_LAT, DEFAULT_LNG, 13);
  startGpsWatcher();

  showToast(`⚠️ ${reason} — ใช้ตำแหน่งเริ่มต้น (กรุงเทพฯ)`, 'warning');
}

function showMapGpsLoading(show) {
  let overlay = document.getElementById('gpsLoadingOverlay');
  if (show) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'gpsLoadingOverlay';
      overlay.innerHTML = `
        <div class="gps-loading-content">
          <div class="gps-loading-pulse"></div>
          <i class="fa-solid fa-satellite-dish" style="font-size: 2rem; color: #0ea5e9; margin-bottom: 0.75rem;"></i>
          <h4 style="color: white; margin-bottom: 0.25rem;">กำลังค้นหาตำแหน่ง GPS จริง...</h4>
          <p style="color: #94a3b8; font-size: 0.8rem;">กรุณากด "อนุญาต (Allow)" เพื่อให้แอปเข้าถึงตำแหน่งของคุณ</p>
        </div>
      `;
      const mapContainer = document.querySelector('.screen-map-container');
      if (mapContainer) mapContainer.appendChild(overlay);
    }
    overlay.style.display = 'flex';
  } else {
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.4s ease';
      setTimeout(() => overlay.remove(), 400);
    }
  }
}

function initLongdoMap(lat, lng, zoom = 14) {
  const mapEl = document.getElementById('longdo-map');
  if (!mapEl || longdoMap) return;

  // ตรวจสอบว่า Longdo SDK โหลดเสร็จหรือยัง
  if (typeof longdo === 'undefined' || !longdo.Map) {
    console.warn('Longdo Map API กำลังโหลด รอสักครู่...');
    setTimeout(() => initLongdoMap(lat, lng, zoom), 300);
    return;
  }

  // สร้าง Longdo Map instance
  longdoMap = new longdo.Map({
    placeholder: mapEl,
    location: { lon: lng, lat: lat },
    zoom: zoom,
    ui: longdo.UiComponent.Mobile,
    language: 'th',
    autoResize: true
  });
  window.longdoMap = longdoMap;

  // ซ่อน Cursor / Crosshair สีแดงกึ่งกลางแผนที่ให้ล่องหน
  try {
    if (longdoMap.Ui && longdoMap.Ui.Crosshair) {
      longdoMap.Ui.Crosshair.visible(false);
    }
  } catch (e) {}

  // ดักจับ Event เมื่อคลิกที่หมุด (overlayClick) บน Longdo Map เพื่อแสดงข้อมูลสถานที่
  try {
    longdoMap.Event.bind('overlayClick', function(overlay) {
      if (overlay && overlay.placeData) {
        showPlaceDetail(overlay.placeData);
      }
    });
  } catch (e) {}

  createUserLocationMarker(lat, lng);
  renderMapMarkers();
}

function createUserLocationMarker(lat, lng) {
  if (!longdoMap || typeof longdo === 'undefined') return;
  if (userLocationMarker) {
    try { longdoMap.Overlays.remove(userLocationMarker); } catch (e) {}
  }

  userLocationMarker = new longdo.Marker(
    { lon: lng, lat: lat },
    {
      title: STATE.gps.isRealGpsActive ? '📍 ตำแหน่ง GPS จริงของคุณ' : '📍 ตำแหน่งเริ่มต้น',
      icon: {
        html: `
          <div style="
            width: 22px; height: 22px; border-radius: 50%;
            background: #0ea5e9; border: 3px solid white;
            box-shadow: 0 0 15px rgba(14, 165, 233, 0.9);
            display: flex; align-items: center; justify-content: center;
          ">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: white;"></div>
          </div>
        `,
        offset: { x: 11, y: 11 }
      },
      popup: {
        html: `
          <div style="padding: 6px 10px; font-family: 'Prompt', sans-serif; font-size: 13px; font-weight: 600; color: #0f172a;">
            📍 ${STATE.gps.isRealGpsActive ? 'ตำแหน่ง GPS จริงของคุณ' : 'ตำแหน่งเริ่มต้น (ยังไม่ได้ GPS)'}
          </div>
        `
      }
    }
  );

  try {
    longdoMap.Overlays.add(userLocationMarker);
  } catch (e) {
    // Marker add error handled gracefully
  }
}

function updateUserRealGPS(lat, lng, accuracy = null, speed = null) {
  STATE.gps.lat = lat;
  STATE.gps.lng = lng;
  STATE.gps.accuracy = accuracy;
  STATE.gps.isRealGpsActive = true;

  if (userLocationMarker && typeof userLocationMarker.location === 'function') {
    userLocationMarker.location({ lon: lng, lat: lat });
  } else if (longdoMap) {
    createUserLocationMarker(lat, lng);
  }

  // วาดวงกลมแสดงความแม่นยำ GPS (Accuracy Circle) บน Longdo Map (พร้อม try-catch ป้องกันใน v3)
  if (longdoMap && typeof longdo !== 'undefined' && longdo.Circle) {
    try {
      if (userAccuracyCircle) {
        longdoMap.Overlays.remove(userAccuracyCircle);
        userAccuracyCircle = null;
      }
      if (accuracy) {
        const radiusInMeter = Math.min(accuracy, 150);
        const metrePerLat = 111320; // 1 องศาละติจูด ~ 111,320 เมตร
        const radiusInDegree = radiusInMeter / metrePerLat;
        userAccuracyCircle = new longdo.Circle(
          { lon: lng, lat: lat },
          radiusInDegree,
          {
            lineWidth: 1,
            lineColor: '#0ea5e9',
            fillColor: 'rgba(56, 189, 248, 0.18)'
          }
        );
        longdoMap.Overlays.add(userAccuracyCircle);
      }
    } catch (circleErr) {
      // Circle overlay error ใน Longdo v3 ไม่ให้กระทบการทำงานหลัก
    }
  }

  // If real speed is reported by device GPS (speed in m/s converted to km/h)
  if (speed !== null && speed !== undefined && speed >= 0) {
    const kmh = Math.round(speed * 3.6);
    STATE.gps.speedKmH = kmh;
    const speedEl = document.getElementById('liveSpeedNumber');
    if (speedEl) speedEl.innerText = kmh;
    
    const modeTitle = document.getElementById('travelModeTitle');
    if (modeTitle) {
      if (kmh > 40) modeTitle.innerText = 'ขับรถ (GPS จริง)';
      else if (kmh > 15) modeTitle.innerText = 'ปั่นจักรยาน (GPS จริง)';
      else if (kmh > 1) modeTitle.innerText = 'เดินเท้า (GPS จริง)';
      else modeTitle.innerText = 'กำลังหยุดพัก (GPS จริง)';
    }
  }
}

/**
 * เฝ้าดูตำแหน่ง GPS อย่างต่อเนื่อง (watchPosition)
 * จะอัปเดตตำแหน่งผู้ใช้บนแผนที่แบบเรียลไทม์
 */
function startGpsWatcher() {
  if (!('geolocation' in navigator)) return;
  if (watchGpsId) navigator.geolocation.clearWatch(watchGpsId);

  watchGpsId = navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const prevLat = STATE.gps.lat;
      const prevLng = STATE.gps.lng;

      // ถ้าครั้งแรกที่ได้ GPS จริง (จากกรณีที่ fallback ไปก่อน) → เลื่อนแผนที่ไปตำแหน่งจริง
      if (!STATE.gps.isRealGpsActive && longdoMap) {
        try {
          if (longdoMap.Renderer && typeof longdoMap.Renderer.flyTo === 'function') {
            longdoMap.Renderer.flyTo({ center: [lng, lat], zoom: 15, essential: true });
          }
        } catch (e) {}
        showToast(`📍 ได้รับตำแหน่ง GPS จริงแล้ว! (${lat.toFixed(4)}, ${lng.toFixed(4)})`, 'success');
      }

      // Calculate real distance moved in km
      if (prevLat !== null && prevLng !== null && (prevLat !== lat || prevLng !== lng)) {
        const distKm = calculateDistance(prevLat, prevLng, lat, lng);
        if (distKm > 0.005 && distKm < 2.0) { // filter out GPS jitter
          STATE.gps.tripDistanceKm = parseFloat((STATE.gps.tripDistanceKm + distKm).toFixed(2));
          STATE.user.totalDistanceKm = parseFloat((STATE.user.totalDistanceKm + distKm).toFixed(2));
          const tripEl = document.getElementById('tripDistText');
          if (tripEl) tripEl.innerText = STATE.gps.tripDistanceKm.toFixed(1);
          advanceActivityQuest('เดิน', distKm);
        }
      }

      updateUserRealGPS(lat, lng, pos.coords.accuracy, pos.coords.speed);
    },
    (err) => {
      // ไม่แสดง warning รบกวนเมื่อไม่มีชิป GPS ฮาร์ดแวร์
    },
    { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 }
  );
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

let currentSelectedPlace = null;
if (!window.poiCache) window.poiCache = {};

function renderMapMarkers() {
  if (!longdoMap || typeof longdo === 'undefined') return;
  // ถ้ากำลังดู POI category (ไม่ใช่ "แนะนำ" หรือ "vip_secret") ไม่ต้อง override หมุด
  if (STATE.activeCategoryFilter !== 'all' && STATE.activeCategoryFilter !== 'vip_secret') return;

  closePlaceDetailCard();

  mapMarkers.forEach(m => {
    try { longdoMap.Overlays.remove(m); } catch (e) {}
  });
  mapMarkers = [];
  window.poiCache = {};

  const listToRender = STATE.activeCategoryFilter === 'vip_secret'
    ? STATE.destinations.filter(d => d.category === 'vip_secret' || d.isVipOnly)
    : STATE.destinations;

  listToRender.forEach(dest => {
    const isVipLocked = dest.isVipOnly && STATE.user.tier === 'free';
    
    let pinColor = '#10b981';
    let pinIcon = 'fa-mountain';
    let catLabel = 'ธรรมชาติ';

    if (dest.category === 'culture') { pinColor = '#38bdf8'; pinIcon = 'fa-gopuram'; catLabel = 'วัฒนธรรม'; }
    else if (dest.category === 'cafe') { pinColor = '#f59e0b'; pinIcon = 'fa-mug-saucer'; catLabel = 'คาเฟ่'; }
    else if (dest.category === 'camping') { pinColor = '#ec4899'; pinIcon = 'fa-campground'; catLabel = 'แคมป์ปิ้ง'; }
    else if (dest.category === 'vip_secret') { pinColor = '#fbbf24'; pinIcon = 'fa-crown'; catLabel = 'พิกัดลับ VIP'; }

    const placeData = {
      id: dest.id,
      name: dest.nameTh,
      lat: dest.lat,
      lon: dest.lng,
      address: `จังหวัด${dest.province}`,
      province: dest.province,
      image: dest.image,
      rating: dest.rating,
      description: dest.description,
      perk: dest.perk,
      isVipOnly: dest.isVipOnly,
      isVipLocked: isVipLocked,
      categoryKey: dest.category,
      categoryLabel: catLabel,
      categoryIcon: pinIcon,
      categoryColor: pinColor
    };

    window.poiCache[dest.id] = placeData;

    let popupHtml = '';
    if (isVipLocked) {
      popupHtml = `
        <div style="max-width: 240px; font-family: 'Prompt', sans-serif; padding: 4px;">
          <div style="background: #1e293b; color: #fbbf24; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-crown"></i> พิกัดลับเฉพาะสมาชิก VIP
          </div>
          <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${escapeHtml(dest.nameTh)}</h4>
          <p style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            ปลดล็อกเพื่อดูเส้นทางลับ, จุดชมวิวส่วนตัว และรับสิทธิ์ส่วนลด 50%
          </p>
          <button onclick="openSubscriptionPaywall()" style="
            width: 100%; background: linear-gradient(135deg, #fbbf24, #d97706);
            color: #1e1b4b; border: none; padding: 6px 10px; border-radius: 6px;
            font-size: 12px; font-weight: 700; cursor: pointer;
          ">
            <i class="fa-solid fa-crown"></i> ปลดล็อก VIP ทันที
          </button>
        </div>
      `;
    } else {
      popupHtml = `
        <div style="max-width: 250px; font-family: 'Prompt', sans-serif; padding: 4px;">
          ${dest.image ? `<img src="${dest.image}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">` : ''}
          <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 3px;">${escapeHtml(dest.nameTh)}</h4>
          <p style="font-size: 11px; color: #64748b; margin-bottom: 6px;">📍 ${escapeHtml(dest.province)} • ⭐ ${dest.rating}</p>
          <p style="font-size: 12px; color: #334155; margin-bottom: 8px; line-height: 1.35;">${escapeHtml(dest.description)}</p>
          ${dest.perk ? `
          <div style="background: #ecfdf5; border: 1px dashed #10b981; color: #065f46; padding: 5px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; margin-bottom: 8px;">
            🎁 สิทธิพิเศษ: ${escapeHtml(dest.perk)}
          </div>` : ''}
          <div style="display: flex; gap: 6px;">
            <button onclick="window.startInAppNavigationById('${dest.id}')" style="
              flex: 1; text-align: center; background: #0ea5e9; color: white; padding: 4px 8px; border-radius: 6px;
              font-size: 11px; font-weight: 700; border: none; cursor: pointer;
            ">🧭 เริ่มนำทาง</button>
            <button onclick="window.showPlaceDetailById('${dest.id}')" style="
              flex: 1; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 5px 8px; border-radius: 6px;
              font-size: 11px; font-weight: 700; cursor: pointer;
            ">ดูข้อมูล</button>
          </div>
        </div>
      `;
    }

    const marker = new longdo.Marker(
      { lon: dest.lng, lat: dest.lat },
      {
        title: dest.nameTh,
        icon: {
          html: `
            <div onclick="event.stopPropagation(); window.showPlaceDetailById('${dest.id}');" style="
              width: 36px; height: 36px; border-radius: 50% 50% 50% 0;
              background: ${isVipLocked ? '#475569' : pinColor};
              transform: rotate(-45deg);
              border: 2px solid white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.35);
              display: flex; align-items: center; justify-content: center;
              cursor: pointer;
              pointer-events: auto;
              transition: transform 0.15s ease;
            " onmouseover="this.style.transform='rotate(-45deg) scale(1.15)'" onmouseout="this.style.transform='rotate(-45deg) scale(1)'">
              <i class="fa-solid ${isVipLocked ? 'fa-lock' : pinIcon}" style="
                transform: rotate(45deg);
                color: ${isVipLocked ? '#facc15' : 'white'};
                font-size: 14px;
              "></i>
            </div>
          `,
          offset: { x: 18, y: 36 }
        },
        popup: {
          html: popupHtml
        }
      }
    );

    marker.placeData = placeData;
    longdoMap.Overlays.add(marker);
    mapMarkers.push(marker);
  });
}

async function filterMapCategory(cat, btn) {
  STATE.activeCategoryFilter = cat;
  document.querySelectorAll('.tag-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  closePlaceDetailCard();

  if (cat === 'all') {
    renderMapMarkers();
    showToast('📍 แสดงสถานที่ท่องเที่ยวยอดนิยมทั้งหมด (แตะที่หมุดเพื่อดูข้อมูล)', 'info');
    return;
  }

  if (cat === 'vip_secret') {
    renderMapMarkers();
    showToast('👑 แสดงพิกัดลับเฉพาะสมาชิก VIP (แตะที่หมุดเพื่อดูข้อมูล)', 'info');
    return;
  }

  // ค้นหา POI ใกล้เคียงผ่าน Longdo Map Search API (เช่น โรงแรม, ห้าง, ร้านอาหาร)
  await searchAndRenderPOI(cat);
}

/**
 * ค้นหาสถานที่ประเภทที่เลือก (โรงแรม, ห้าง, ร้านอาหาร, คาเฟ่ ฯลฯ) ใกล้จุดกึ่งกลางแผนที่
 * แสดงผลเป็นหมุดสีแยกตามประเภท พร้อม popup และการ์ดข้อมูลเมื่อแตะที่หมุด
 */
async function searchAndRenderPOI(categoryId) {
  const category = POI_CATEGORIES[categoryId];
  if (!category || !longdoMap) return;

  closePlaceDetailCard();

  // ลบหมุดเก่าทั้งหมด
  mapMarkers.forEach(m => {
    try { longdoMap.Overlays.remove(m); } catch (e) {}
  });
  mapMarkers = [];
  if (!window.poiCache) window.poiCache = {};

  // ดึงจุดกึ่งกลางแผนที่ปัจจุบันเพื่อค้นหาสถานที่ใกล้เคียง
  let centerLat = STATE.gps.lat || DEFAULT_LAT;
  let centerLng = STATE.gps.lng || DEFAULT_LNG;
  try {
    const loc = longdoMap.location();
    if (loc && loc.lat && loc.lon) {
      centerLat = loc.lat;
      centerLng = loc.lon;
    }
  } catch (e) {}

  showToast(`🔍 กำลังค้นหา${category.label}ในบริเวณนี้...`, 'info');

  try {
    const fetchPromises = [];
    if (category.tag) {
      fetchPromises.push(
        fetch(`https://search.longdo.com/mapsearch/json/search?tag=${encodeURIComponent(category.tag)}&lon=${centerLng}&lat=${centerLat}&limit=35&key=${LONGDO_API_KEY}`)
          .then(r => r.json()).catch(() => ({ data: [] }))
      );
    }
    if (category.keyword) {
      fetchPromises.push(
        fetch(`https://search.longdo.com/mapsearch/json/search?keyword=${encodeURIComponent(category.keyword)}&lon=${centerLng}&lat=${centerLat}&limit=35&key=${LONGDO_API_KEY}`)
          .then(r => r.json()).catch(() => ({ data: [] }))
      );
    }

    const responses = await Promise.all(fetchPromises);
    let combinedData = [];
    responses.forEach(r => {
      if (r && r.data && Array.isArray(r.data)) {
        combinedData = combinedData.concat(r.data);
      }
    });

    // Deduplicate by name/id
    const seenMap = new Map();
    const rawItems = [];
    combinedData.forEach(item => {
      const key = item.id || item.name;
      if (key && !seenMap.has(key)) {
        seenMap.set(key, true);
        rawItems.push(item);
      }
    });

    if (rawItems.length > 0) {
      // คัดกรองพิกัดที่ถูกต้อง ไม่ใช่ถนนหรือสระน้ำ และคำนวณระยะทางจากจุดกึ่งกลาง
      const validItems = rawItems
        .map(item => {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          if (isNaN(lat) || isNaN(lon)) return null;
          if (item.type === 'road' || item.type === 'water' || item.type === 'khet') return null;
          const dist = calculateDistance(centerLat, centerLng, lat, lon);
          return {
            id: item.id || `poi_${Math.random().toString(36).substring(2, 9)}`,
            name: item.name,
            lat: lat,
            lon: lon,
            address: item.address || '',
            tel: item.tel || '',
            url: item.url || '',
            categoryKey: categoryId,
            categoryLabel: category.label,
            categoryIcon: category.icon,
            categoryColor: category.color,
            distanceKm: dist
          };
        })
        .filter(item => item !== null)
        .sort((a, b) => a.distanceKm - b.distanceKm)
        .slice(0, 25); // คัดเลือก 25 แห่งที่ใกล้ที่สุด

      if (validItems.length === 0) {
        showToast(`ไม่พบ${category.label}ใกล้เคียง ลองเลื่อนแผนที่แล้วกดอีกครั้ง`, 'warning');
        return;
      }

      validItems.forEach(place => {
        window.poiCache[place.id] = place;

        const distText = place.distanceKm < 1 
          ? `${Math.round(place.distanceKm * 1000)} ม.` 
          : `${place.distanceKm.toFixed(1)} กม.`;

        const popupHtml = `
          <div style="max-width: 260px; font-family: 'Prompt', sans-serif; padding: 4px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="
                width: 36px; height: 36px; border-radius: 10px;
                background: ${place.categoryColor}18; border: 1px solid ${place.categoryColor}40;
                display: flex; align-items: center; justify-content: center; flex-shrink: 0;
              ">
                <i class="fa-solid ${place.categoryIcon}" style="color: ${place.categoryColor}; font-size: 15px;"></i>
              </div>
              <div style="flex: 1; min-width: 0;">
                <h4 style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 0; line-height: 1.3;">${escapeHtml(place.name)}</h4>
                <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                  <span style="font-size: 10px; color: ${place.categoryColor}; font-weight: 600;">${place.categoryLabel}</span>
                  <span style="font-size: 10px; color: #64748b;">• ห่าง ${distText}</span>
                </div>
              </div>
            </div>
            ${place.address ? `<p style="font-size: 11px; color: #64748b; margin-bottom: 5px; line-height: 1.35;">📍 ${escapeHtml(place.address)}</p>` : ''}
            ${place.tel ? `<p style="font-size: 11px; color: #334155; margin-bottom: 6px;">📞 <a href="tel:${escapeHtml(place.tel)}" style="color: #0ea5e9; font-weight: 600; text-decoration: none;">${escapeHtml(place.tel)}</a></p>` : ''}
            <div style="display: flex; gap: 6px; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
              <button onclick="window.startInAppNavigationById('${place.id}')" style="
                flex: 1; text-align: center; background: #0ea5e9; color: white; padding: 4px 8px; border-radius: 6px;
                font-size: 11px; font-weight: 700; border: none; cursor: pointer;
              ">🧭 เริ่มนำทาง</button>
              <button onclick="window.showPlaceDetailById('${place.id}')" style="
                flex: 1; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 5px 8px; border-radius: 6px;
                font-size: 11px; font-weight: 700; cursor: pointer;
              ">ดูข้อมูล</button>
            </div>
          </div>
        `;

        const marker = new longdo.Marker(
          { lon: place.lon, lat: place.lat },
          {
            title: place.name,
            icon: {
              html: `
                <div onclick="event.stopPropagation(); window.showPlaceDetailById('${place.id}');" style="
                  width: 36px; height: 36px; border-radius: 50% 50% 50% 0;
                  background: ${place.categoryColor};
                  transform: rotate(-45deg);
                  border: 2px solid white;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.35);
                  display: flex; align-items: center; justify-content: center;
                  cursor: pointer;
                  pointer-events: auto;
                  transition: transform 0.15s ease;
                " onmouseover="this.style.transform='rotate(-45deg) scale(1.15)'" onmouseout="this.style.transform='rotate(-45deg) scale(1)'">
                  <i class="fa-solid ${place.categoryIcon}" style="
                    transform: rotate(45deg);
                    color: white;
                    font-size: 14px;
                  "></i>
                </div>
              `,
              offset: { x: 18, y: 36 }
            },
            popup: { html: popupHtml }
          }
        );

        marker.placeData = place;
        longdoMap.Overlays.add(marker);
        mapMarkers.push(marker);
      });

      // ปรับกรอบแผนที่ (Bounding Box) ให้เห็นหมุดอย่างสวยงามบนจอ
      if (typeof longdo !== 'undefined' && longdo.Util && typeof longdo.Util.locationBound === 'function' && validItems.length > 0) {
        try {
          const fitLocations = validItems.slice(0, 10).map(p => ({ lon: p.lon, lat: p.lat }));
          fitLocations.push({ lon: centerLng, lat: centerLat });
          const bbox = longdo.Util.locationBound(fitLocations);
          longdoMap.bound(bbox);
        } catch (bErr) {}
      }

      showToast(`📍 พบ${category.label} ${validItems.length} แห่งในบริเวณนี้ (แตะที่หมุดเพื่อดูข้อมูล)`, 'success');
    } else {
      showToast(`ไม่พบ${category.label}ใกล้เคียง ลองเลื่อนแผนที่แล้วกดค้นหาใหม่`, 'warning');
    }
  } catch (err) {
    showToast(`เกิดข้อผิดพลาดในการค้นหา${category.label}`, 'warning');
  }
}

/**
 * แสดงรายละเอียดของสถานที่ (Place Detail Card) เมื่อผู้ใช้แตะที่หมุดบนแผนที่
 */
function showPlaceDetail(place) {
  if (!place) return;
  currentSelectedPlace = place;

  const card = document.getElementById('placeDetailCard');
  if (!card) return;

  // 1. Icon & Category Badge
  const iconEl = document.getElementById('placeCardIcon');
  const catNameEl = document.getElementById('placeCardCatName');
  const badgeEl = document.getElementById('placeCardBadge');
  if (badgeEl) {
    badgeEl.style.background = `${place.categoryColor || '#0ea5e9'}22`;
    badgeEl.style.color = place.categoryColor || '#38bdf8';
    badgeEl.style.border = `1px solid ${place.categoryColor || '#0ea5e9'}55`;
  }
  if (iconEl) iconEl.className = `fa-solid ${place.categoryIcon || 'fa-location-dot'}`;
  if (catNameEl) catNameEl.innerText = place.categoryLabel || 'สถานที่';

  // 2. ระยะทางจากตำแหน่งผู้ใช้ (GPS)
  let userLat = STATE.gps.lat;
  let userLng = STATE.gps.lng;
  let distText = '';
  if (userLat !== null && userLng !== null) {
    const dist = calculateDistance(userLat, userLng, place.lat, place.lon);
    distText = dist < 1 ? `ห่างจากคุณ ${Math.round(dist * 1000)} ม.` : `ห่างจากคุณ ${dist.toFixed(1)} กม.`;
  } else if (place.distanceKm !== undefined) {
    distText = place.distanceKm < 1 ? `ห่าง ${Math.round(place.distanceKm * 1000)} ม.` : `ห่าง ${place.distanceKm.toFixed(1)} กม.`;
  }
  const distEl = document.getElementById('placeCardDistText');
  const distWrap = document.getElementById('placeCardDistance');
  if (distWrap && distEl) {
    if (distText) {
      distEl.innerText = distText;
      distWrap.style.display = 'inline-flex';
    } else {
      distWrap.style.display = 'none';
    }
  }

  // 3. ชื่อสถานที่
  const titleEl = document.getElementById('placeCardTitle');
  if (titleEl) titleEl.innerText = place.name;

  // 4. รูปภาพ (กรณีสถานที่ท่องเที่ยว)
  const imgWrap = document.getElementById('placeCardImageWrap');
  const imgEl = document.getElementById('placeCardImg');
  if (imgWrap && imgEl) {
    if (place.image) {
      imgEl.src = place.image;
      imgWrap.style.display = 'block';
    } else {
      imgWrap.style.display = 'none';
    }
  }

  // 5. ที่อยู่
  const addrEl = document.getElementById('placeCardAddressText');
  const addrWrap = document.getElementById('placeCardAddress');
  if (addrWrap && addrEl) {
    if (place.address) {
      addrEl.innerText = place.address;
      addrWrap.style.display = 'flex';
    } else {
      addrWrap.style.display = 'none';
    }
  }

  // 6. เบอร์โทรศัพท์ (มีปุ่มโทรออกได้ทันที)
  const telWrap = document.getElementById('placeCardTelWrap');
  const telLink = document.getElementById('placeCardTelLink');
  const callBtn = document.getElementById('placeCardCallBtn');
  if (place.tel) {
    if (telWrap) telWrap.style.display = 'flex';
    if (telLink) {
      telLink.href = `tel:${place.tel}`;
      telLink.innerText = place.tel;
    }
    if (callBtn) {
      callBtn.href = `tel:${place.tel}`;
      callBtn.style.display = 'inline-flex';
    }
  } else {
    if (telWrap) telWrap.style.display = 'none';
    if (callBtn) callBtn.style.display = 'none';
  }

  // 7. สิทธิพิเศษ / คำอธิบาย
  const perkWrap = document.getElementById('placeCardPerkWrap');
  const perkText = document.getElementById('placeCardPerkText');
  if (perkWrap && perkText) {
    if (place.perk) {
      perkText.innerHTML = `🎁 <strong>สิทธิพิเศษ:</strong> ${escapeHtml(place.perk)}`;
      perkWrap.style.display = 'block';
    } else if (place.description) {
      perkText.innerHTML = escapeHtml(place.description);
      perkWrap.style.display = 'block';
    } else {
      perkWrap.style.display = 'none';
    }
  }

  // 8. ปุ่มนำทางบนแอป (In-App Navigation)
  const navBtn = document.getElementById('placeCardNavBtn');
  if (navBtn) {
    navBtn.onclick = function() {
      startInAppNavigationFromCard();
    };
  }

  // แสดงการ์ดข้อมูล
  card.style.display = 'flex';

  // เลื่อนแผนที่ไปที่ตำแหน่งหมุดอย่างนุ่มนวล
  if (longdoMap) {
    try {
      longdoMap.location({ lon: place.lon, lat: place.lat }, true);
    } catch (e) {}
  }
}

function showPlaceDetailById(id) {
  if (window.poiCache && window.poiCache[id]) {
    showPlaceDetail(window.poiCache[id]);
  }
}
window.showPlaceDetailById = showPlaceDetailById;

function closePlaceDetailCard() {
  const card = document.getElementById('placeDetailCard');
  if (card) card.style.display = 'none';
  currentSelectedPlace = null;
}
window.closePlaceDetailCard = closePlaceDetailCard;

function copyCurrentPlaceCoords() {
  if (!currentSelectedPlace) return;
  const coordStr = `${currentSelectedPlace.lat.toFixed(5)}, ${currentSelectedPlace.lon.toFixed(5)}`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(coordStr).then(() => {
      showToast(`📋 คัดลอกพิกัด ${coordStr} สำเร็จ`, 'success');
    }).catch(() => {
      showToast(`พิกัด: ${coordStr}`, 'info');
    });
  } else {
    showToast(`พิกัด: ${coordStr}`, 'info');
  }
}
window.copyCurrentPlaceCoords = copyCurrentPlaceCoords;

// ==============================================================================
// IN-APP NAVIGATION ENGINE (ระบบนำทางสดบนเว็บ ไม่ต้องเปิด Google Maps)
// ==============================================================================
let activeNavigation = {
  isActive: false,
  destLat: null,
  destLng: null,
  destName: '',
  polyline: null,
  destMarker: null,
  routeData: null,
  steps: []
};

function getTurnInfo(turn) {
  switch (turn) {
    case 1:
      return { text: 'เบี่ยงซ้ายเข้าสู่', icon: 'fa-arrow-turn-up fa-rotate-270' };
    case 2:
      return { text: 'เลี้ยวซ้ายเข้าสู่', icon: 'fa-arrow-turn-up fa-rotate-270' };
    case 3:
      return { text: 'เลี้ยวซ้ายหักศอกเข้าสู่', icon: 'fa-arrow-turn-up fa-rotate-270' };
    case 4:
      return { text: 'กลับรถ', icon: 'fa-arrow-rotate-left' };
    case 5:
      return { text: 'เลี้ยวขวาเข้าสู่', icon: 'fa-arrow-turn-up fa-rotate-90' };
    case 6:
      return { text: 'เบี่ยงขวาเข้าสู่', icon: 'fa-arrow-turn-up fa-rotate-90' };
    case 7:
      return { text: 'เลี้ยวขวาหักศอกเข้าสู่', icon: 'fa-arrow-turn-up fa-rotate-90' };
    default:
      return { text: 'ตรงไปตาม', icon: 'fa-arrow-up' };
  }
}

async function startInAppNavigation(destLat, destLng, destName) {
  const numLat = parseFloat(destLat);
  const numLng = parseFloat(destLng);
  if (isNaN(numLat) || isNaN(numLng)) return;

  closePlaceDetailCard();

  // จุดเริ่มต้น: ตำแหน่ง GPS ปัจจุบัน หรือตำแหน่งที่แผนที่กำลังโฟกัส
  let startLat = STATE.gps.lat || DEFAULT_LAT;
  let startLng = STATE.gps.lng || DEFAULT_LNG;
  try {
    const loc = longdoMap.location();
    if (loc && loc.lat && loc.lon && (STATE.gps.lat === null || !STATE.gps.isRealGpsActive)) {
      startLat = loc.lat;
      startLng = loc.lon;
    }
  } catch (e) {}

  // ซ่อน Search Bar และ Tag Filters เพื่อให้หน้าจอนำทางโล่ง ชัดเจนแบบแอปนำทางจริง
  const searchWrap = document.querySelector('.map-search-bar-wrap');
  const tagWrap = document.querySelector('.filter-tags-scroll');
  const vipBanner = document.querySelector('.map-vip-floating-banner');
  if (searchWrap) searchWrap.style.display = 'none';
  if (tagWrap) tagWrap.style.display = 'none';
  if (vipBanner) vipBanner.style.display = 'none';

  // แสดงแถบ In-App Navigation HUD
  const navHud = document.getElementById('inAppNavHud');
  if (navHud) navHud.style.display = 'flex';

  // อัปเดตข้อมูลเบื้องต้นบน HUD
  const targetNameEl = document.getElementById('navHudTargetName');
  const instructionEl = document.getElementById('navHudInstruction');
  const metricTimeEl = document.getElementById('navMetricTime');
  const metricDistEl = document.getElementById('navMetricDist');
  const stepsListEl = document.getElementById('navStepsListItems');
  const turnIconEl = document.getElementById('navHudTurnIcon');

  if (targetNameEl) targetNameEl.innerText = `ปลายทาง: ${destName || 'สถานที่ที่เลือก'}`;
  if (instructionEl) instructionEl.innerText = 'กำลังคำนวณเส้นทางที่ดีที่สุด...';
  if (metricTimeEl) metricTimeEl.innerText = 'กำลังคำนวณ...';
  if (metricDistEl) metricDistEl.innerText = '';
  if (stepsListEl) stepsListEl.innerHTML = '<div style="padding: 10px; text-align: center; color: #94a3b8; font-size: 0.75rem;"><i class="fa-solid fa-spinner fa-spin"></i> กำลังโหลดขั้นตอนนำทาง...</div>';

  showToast(`🧭 กำลังเริ่มนำทางบนเว็บไปยัง "${destName || 'ปลายทาง'}"...`, 'info');

  // ลบเส้นทางเดิมก่อน
  if (activeNavigation.polyline) {
    try { longdoMap.Overlays.remove(activeNavigation.polyline); } catch (e) {}
    activeNavigation.polyline = null;
  }
  if (activeNavigation.destMarker) {
    try { longdoMap.Overlays.remove(activeNavigation.destMarker); } catch (e) {}
    activeNavigation.destMarker = null;
  }
  if (longdoMap && longdoMap.Route) {
    try { longdoMap.Route.clear(); } catch (e) {}
  }

  activeNavigation.isActive = true;
  activeNavigation.destLat = numLat;
  activeNavigation.destLng = numLng;
  activeNavigation.destName = destName;

  try {
    // 1. เรียก Route Guide API เพื่อดึงระยะทาง เวลาเดินทาง และขั้นตอนการเลี้ยว (Turn-by-turn)
    const guideRes = await fetch(
      `https://api.longdo.com/RouteService/json/route/guide?flon=${startLng}&flat=${startLat}&tlon=${numLng}&tlat=${numLat}&key=${LONGDO_API_KEY}`
    );
    const guideJson = await guideRes.json();

    let totalDistKm = 0;
    let totalTimeMin = 0;
    let steps = [];
    let pathId = null;

    if (guideJson && guideJson.data && guideJson.data.length > 0) {
      const routeInfo = guideJson.data[0];
      totalDistKm = (routeInfo.distance / 1000).toFixed(1);
      totalTimeMin = Math.max(1, Math.ceil(routeInfo.interval / 60));
      steps = routeInfo.guide || [];
      pathId = routeInfo.id;
    } else {
      const directDist = calculateDistance(startLat, startLng, numLat, numLng);
      totalDistKm = directDist.toFixed(1);
      totalTimeMin = Math.max(1, Math.ceil(directDist * 2.5));
    }

    if (metricTimeEl) metricTimeEl.innerText = `~${totalTimeMin} นาที`;
    if (metricDistEl) metricDistEl.innerText = `(${totalDistKm} กม.)`;

    // 2. ดึงเส้นทางพิกัดละเอียด (Polyline path) มาวาดบนแผนที่
    let routeCoords = [];
    if (pathId) {
      try {
        const pathRes = await fetch(
          `https://api.longdo.com/RouteService/json/route/path?id=${pathId}&key=${LONGDO_API_KEY}`
        );
        const pathJson = await pathRes.json();
        if (pathJson && pathJson.data && Array.isArray(pathJson.data)) {
          pathJson.data.forEach(segment => {
            if (Array.isArray(segment)) {
              segment.forEach(pt => {
                if (pt && !isNaN(pt.lat) && !isNaN(pt.lon)) {
                  routeCoords.push({ lon: pt.lon, lat: pt.lat });
                }
              });
            }
          });
        }
      } catch (pathErr) {}
    }

    if (routeCoords.length === 0) {
      routeCoords = [
        { lon: startLng, lat: startLat },
        { lon: numLng, lat: numLat }
      ];
    }

    // วาดเส้นทางบนแผนที่ (Polyline สดใส)
    if (longdoMap && typeof longdo !== 'undefined' && longdo.Polyline) {
      activeNavigation.polyline = new longdo.Polyline(routeCoords, {
        lineWidth: 6,
        lineColor: '#0ea5e9'
      });
      longdoMap.Overlays.add(activeNavigation.polyline);
    }

    // เสริมคำสั่ง Longdo Map Route SDK ถ้ามี
    try {
      if (longdoMap && longdoMap.Route) {
        longdoMap.Route.clear();
        longdoMap.Route.line('road', { lineWidth: 6, lineColor: '#0ea5e9' });
        longdoMap.Route.add({ lon: startLng, lat: startLat });
        longdoMap.Route.add({ lon: numLng, lat: numLat });
        longdoMap.Route.search();
      }
    } catch (routeSdkErr) {}

    // ปักหมุดธงปลายทาง
    activeNavigation.destMarker = new longdo.Marker(
      { lon: numLng, lat: numLat },
      {
        title: `🏁 ${destName}`,
        icon: {
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 48px; height: 48px; border-radius: 50%; border: 2px solid rgba(16, 185, 129, 0.8); animation: radar-ping 1.8s infinite; pointer-events: none;"></div>
              <div style="
                width: 38px; height: 38px; border-radius: 50% 50% 50% 0;
                background: linear-gradient(135deg, #10b981, #059669);
                transform: rotate(-45deg);
                border: 2.5px solid white;
                box-shadow: 0 4px 16px rgba(16, 185, 129, 0.6);
                display: flex; align-items: center; justify-content: center;
              ">
                <i class="fa-solid fa-flag-checkered" style="transform: rotate(45deg); color: white; font-size: 15px;"></i>
              </div>
            </div>
          `,
          offset: { x: 19, y: 38 }
        }
      }
    );
    longdoMap.Overlays.add(activeNavigation.destMarker);

    // ปรับ Bounding Box ให้มองเห็นทั้งเส้นทาง
    if (longdoMap && typeof longdo !== 'undefined' && longdo.Util && typeof longdo.Util.locationBound === 'function') {
      try {
        const bounds = longdo.Util.locationBound(routeCoords);
        longdoMap.bound(bounds);
      } catch (bErr) {}
    }

    // 3. แสดงคำแนะนำการเลี้ยว (Turn-by-turn guidance)
    if (steps.length > 0) {
      const firstStep = steps[0];
      const turnInfo = getTurnInfo(firstStep.turn);
      if (instructionEl) {
        instructionEl.innerText = `${turnInfo.text} ${firstStep.name || 'ทางหลัก'} อีก ${firstStep.distance} ม.`;
      }
      if (turnIconEl) {
        turnIconEl.className = `fa-solid ${turnInfo.icon}`;
      }

      if (stepsListEl) {
        stepsListEl.innerHTML = steps.map((s, idx) => {
          const tInfo = getTurnInfo(s.turn);
          const dText = s.distance >= 1000 ? `${(s.distance / 1000).toFixed(1)} กม.` : `${s.distance} ม.`;
          return `
            <div class="nav-step-item">
              <div class="nav-step-icon">
                <i class="fa-solid ${tInfo.icon}"></i>
              </div>
              <div class="nav-step-text">
                <div style="font-weight: 600; color: #ffffff;">${idx + 1}. ${tInfo.text} ${escapeHtml(s.name || 'ทางเชื่อมต่อ')}</div>
              </div>
              <div class="nav-step-dist">${dText}</div>
            </div>
          `;
        }).join('');
      }
    } else {
      if (instructionEl) {
        instructionEl.innerText = `มุ่งหน้าไปยัง ${destName} (${totalDistKm} กม.)`;
      }
      if (stepsListEl) {
        stepsListEl.innerHTML = `
          <div class="nav-step-item">
            <div class="nav-step-icon"><i class="fa-solid fa-arrow-up"></i></div>
            <div class="nav-step-text">ตรงไปยัง ${escapeHtml(destName)}</div>
            <div class="nav-step-dist">${totalDistKm} กม.</div>
          </div>
        `;
      }
    }

    showToast(`📍 กำลังนำทางไป ${destName} (${totalDistKm} กม. ~${totalTimeMin} นาที)`, 'success');

  } catch (err) {
    if (instructionEl) instructionEl.innerText = `มุ่งหน้าไปยัง ${destName}`;
    showToast(`เริ่มนำทางไปยัง ${destName}`, 'info');
  }
}

function startInAppNavigationFromCard() {
  if (!currentSelectedPlace) return;
  startInAppNavigation(currentSelectedPlace.lat, currentSelectedPlace.lon, currentSelectedPlace.name);
}
window.startInAppNavigationFromCard = startInAppNavigationFromCard;

function startInAppNavigationById(id) {
  if (window.poiCache && window.poiCache[id]) {
    const p = window.poiCache[id];
    startInAppNavigation(p.lat, p.lon, p.name);
  }
}
window.startInAppNavigationById = startInAppNavigationById;

function stopInAppNavigation() {
  const navHud = document.getElementById('inAppNavHud');
  if (navHud) navHud.style.display = 'none';

  // ปิด Accordion รายการขั้นตอน
  const dropdown = document.getElementById('navStepsDropdown');
  if (dropdown) dropdown.style.display = 'none';

  // แสดง Search Bar และ Tag Filters กลับมา
  const searchWrap = document.querySelector('.map-search-bar-wrap');
  const tagWrap = document.querySelector('.filter-tags-scroll');
  const vipBanner = document.querySelector('.map-vip-floating-banner');
  if (searchWrap) searchWrap.style.display = 'block';
  if (tagWrap) tagWrap.style.display = 'flex';
  if (vipBanner) vipBanner.style.display = 'flex';

  // ลบเส้นทางและหมุดธงปลายทาง
  if (activeNavigation.polyline) {
    try { longdoMap.Overlays.remove(activeNavigation.polyline); } catch (e) {}
    activeNavigation.polyline = null;
  }
  if (activeNavigation.destMarker) {
    try { longdoMap.Overlays.remove(activeNavigation.destMarker); } catch (e) {}
    activeNavigation.destMarker = null;
  }
  if (longdoMap && longdoMap.Route) {
    try { longdoMap.Route.clear(); } catch (e) {}
  }

  activeNavigation.isActive = false;
  showToast('สิ้นสุดการนำทางแล้ว', 'info');
}
window.stopInAppNavigation = stopInAppNavigation;

function toggleNavStepsList() {
  const dropdown = document.getElementById('navStepsDropdown');
  const toggleText = document.getElementById('navStepsToggleText');
  if (!dropdown) return;
  if (dropdown.style.display === 'none' || !dropdown.style.display) {
    dropdown.style.display = 'block';
    if (toggleText) toggleText.innerText = 'ซ่อนเส้นทาง';
  } else {
    dropdown.style.display = 'none';
    if (toggleText) toggleText.innerText = 'ดูเส้นทาง';
  }
}
window.toggleNavStepsList = toggleNavStepsList;

// ==============================================================================
// MAP SEARCH ENGINE (Longdo Map Search API + App Destinations + Autocomplete)
// ==============================================================================
let searchDebounceTimer = null;
let currentSearchResults = [];
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function handleSearchMap(query) {
  const clearBtn = document.getElementById('btnClearSearch');
  if (clearBtn) clearBtn.style.display = query && query.length > 0 ? 'block' : 'none';

  if (!query || query.trim().length === 0) {
    hideSearchDropdown();
    return;
  }

  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    executeSearch(query.trim());
  }, 220);
}

async function executeSearch(query) {
  const dropdown = document.getElementById('mapSearchDropdown');
  if (!dropdown) return;

  dropdown.innerHTML = `<div class="search-loading-item"><i class="fa-solid fa-spinner fa-spin"></i> กำลังค้นหา "${escapeHtml(query)}"...</div>`;
  dropdown.classList.add('active');

  const q = query.toLowerCase();
  const results = [];

  // 1. ค้นหาจากสถานที่แนะนำภายในแอป GoThai Explorer ก่อน
  const appMatches = STATE.destinations.filter(d =>
    d.nameTh.toLowerCase().includes(q) || d.province.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)
  );

  appMatches.forEach(d => {
    results.push({
      name: d.nameTh,
      sub: `จุดแนะนำในแอป • ${d.province} (⭐ ${d.rating})`,
      lat: d.lat,
      lon: d.lng,
      isAppDest: true
    });
  });

  // 2. ค้นหาผ่าน Longdo Map Search API ทั่วประเทศไทย (อำเภอ, จังหวัด, ห้าง, วัด, โรงแรม ฯลฯ)
  try {
    const res = await fetch(`https://search.longdo.com/mapsearch/json/search?keyword=${encodeURIComponent(query)}&limit=8&key=${LONGDO_API_KEY}`);
    const data = await res.json();
    if (data && data.data && Array.isArray(data.data)) {
      data.data.forEach(item => {
        const itemLat = parseFloat(item.lat);
        const itemLon = parseFloat(item.lon);
        if (!isNaN(itemLat) && !isNaN(itemLon) && !results.some(r => r.name === item.name)) {
          const detail = item.address || item.type || 'พิกัดในประเทศไทย';
          results.push({
            name: item.name,
            sub: detail,
            lat: itemLat,
            lon: itemLon,
            isAppDest: false
          });
        }
      });
    }
  } catch (err) {
    // Search API request error handled gracefully
  }

  currentSearchResults = results;

  // Render ผลลัพธ์ลงใน Dropdown
  if (results.length === 0) {
    dropdown.innerHTML = `<div class="search-empty-item">ไม่พบสถานที่ที่ตรงกับ "${escapeHtml(query)}"</div>`;
    return;
  }

  dropdown.innerHTML = results.map((item, idx) => `
    <div class="search-result-item" onclick="selectSearchResultByIndex(${idx})">
      <div class="search-item-icon" style="${item.isAppDest ? 'background: rgba(245, 158, 11, 0.2); color: #fbbf24;' : ''}">
        <i class="fa-solid ${item.isAppDest ? 'fa-star' : 'fa-location-dot'}"></i>
      </div>
      <div class="search-item-info">
        <div class="search-item-name">${escapeHtml(item.name)}</div>
        <div class="search-item-sub">${escapeHtml(item.sub)}</div>
      </div>
    </div>
  `).join('');
}

function selectSearchResultByIndex(idx) {
  const item = currentSearchResults[idx];
  if (!item) return;
  selectSearchResult(item.name, item.lat, item.lon, item.sub, item.isAppDest);
}

function selectSearchResult(name, lat, lon, sub = '', isAppDest = false) {
  if (!longdoMap) return;

  const numLat = parseFloat(lat);
  const numLon = parseFloat(lon);
  if (isNaN(numLat) || isNaN(numLon)) {
    return;
  }

  const input = document.getElementById('mapSearchInput');
  if (input) input.value = name;
  hideSearchDropdown();

  const clearBtn = document.getElementById('btnClearSearch');
  if (clearBtn) clearBtn.style.display = 'block';

  // 1. ลบหมุดผลการค้นหาเดิมก่อน
  if (searchResultMarker) {
    try { longdoMap.Overlays.remove(searchResultMarker); } catch (e) {}
    searchResultMarker = null;
  }

  const targetLoc = { lon: numLon, lat: numLat };
  const targetZoom = 16;

  // 2. เคลื่อนย้ายแผนที่ให้จุดค้นหาอยู่กึ่งกลางหน้าจอ (ตรงเป้า Cursor กลางแผนที่ 100%)
  function moveMapCenter() {
    try {
      if (longdoMap.Renderer && typeof longdoMap.Renderer.flyTo === 'function') {
        longdoMap.Renderer.flyTo({
          center: [numLon, numLat],
          zoom: targetZoom,
          essential: true,
          duration: 900
        });
      } else if (longdoMap.Renderer && typeof longdoMap.Renderer.jumpTo === 'function') {
        longdoMap.Renderer.jumpTo({
          center: [numLon, numLat],
          zoom: targetZoom
        });
      }
    } catch (e1) {
      // Map center navigation fallback
    }

    // ซ่อน Crosshair กลางแผนที่ให้ล่องหน
    try {
      if (longdoMap.Ui && longdoMap.Ui.Crosshair) {
        longdoMap.Ui.Crosshair.visible(false);
      }
    } catch (e2) {}
  }

  moveMapCenter();
  setTimeout(moveMapCenter, 100);

  const searchPlaceId = `search_${Date.now()}`;
  const searchPlaceData = {
    id: searchPlaceId,
    name: name,
    lat: numLat,
    lon: numLon,
    address: sub || 'พิกัดในประเทศไทย',
    categoryKey: 'search',
    categoryLabel: isAppDest ? 'จุดแนะนำ' : 'ผลการค้นหา',
    categoryIcon: isAppDest ? 'fa-star' : 'fa-location-dot',
    categoryColor: isAppDest ? '#f59e0b' : '#ef4444'
  };
  window.poiCache[searchPlaceId] = searchPlaceData;

  // 3. ปักหมุดเป้าหมายสีแดงสด พร้อมเรดาร์ระลอกคลื่น (Radar Wave Ping) ณ จุดที่ค้นหา
  try {
    searchResultMarker = new longdo.Marker(
      targetLoc,
      {
        title: name,
        icon: {
          html: `
            <div onclick="event.stopPropagation(); window.showPlaceDetailById('${searchPlaceId}');" style="position: relative; display: flex; align-items: center; justify-content: center; pointer-events: auto; cursor: pointer;">
              <!-- Radar Pulse Waves เพื่อให้ผู้ใช้เห็นชัดเจน 100% ว่าอยู่ตรงไหน -->
              <div style="
                position: absolute; width: 64px; height: 64px; border-radius: 50%;
                border: 2px solid rgba(239, 68, 68, 0.8);
                box-shadow: 0 0 16px rgba(239, 68, 68, 0.5);
                animation: radar-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
                pointer-events: none;
              "></div>
              <!-- หมุดปักปลายแหลมชี้ไปที่กึ่งกลาง Cursor พอดี -->
              <div style="
                width: 38px; height: 38px; border-radius: 50% 50% 50% 0;
                background: linear-gradient(135deg, #ef4444, #b91c1c);
                transform: rotate(-45deg);
                border: 2.5px solid white;
                box-shadow: 0 4px 18px rgba(239, 68, 68, 0.7);
                display: flex; align-items: center; justify-content: center;
              ">
                <i class="fa-solid fa-location-dot" style="transform: rotate(45deg); color: white; font-size: 17px;"></i>
              </div>
            </div>
          `,
          offset: { x: 19, y: 38 }
        },
        popup: {
          html: `
            <div style="max-width: 240px; font-family: 'Prompt', sans-serif; padding: 4px;">
              <div style="font-size: 11px; font-weight: 700; color: #ef4444; margin-bottom: 2px;">
                🎯 พิกัดที่คุณค้นหา (กึ่งกลาง Cursor)
              </div>
              <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${escapeHtml(name)}</h4>
              ${sub ? `<p style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${escapeHtml(sub)}</p>` : ''}
              <div style="font-size: 10px; color: #94a3b8; margin-bottom: 6px;">
                พิกัด: ${numLat.toFixed(4)}, ${numLon.toFixed(4)}
              </div>
              <button onclick="window.showPlaceDetailById('${searchPlaceId}')" style="
                width: 100%; background: #0ea5e9; color: white; border: none; padding: 4px 8px; border-radius: 6px;
                font-size: 11px; font-weight: 700; cursor: pointer;
              ">ดูข้อมูลสถานที่</button>
            </div>
          `
        }
      }
    );
    searchResultMarker.placeData = searchPlaceData;
    longdoMap.Overlays.add(searchResultMarker);
    showPlaceDetail(searchPlaceData);
  } catch (mErr) {
    // Marker add error handled gracefully
  }

  showToast(`🎯 เลื่อนกึ่งกลางแผนที่ไปยัง: ${name}`, 'success');
}

async function submitSearchMap() {
  const input = document.getElementById('mapSearchInput');
  if (!input) return;
  const q = input.value.trim();
  if (!q) return;

  hideSearchDropdown();
  showToast(`🔍 กำลังค้นหา "${q}"...`, 'info');

  // ตรวจสอบในสถานที่แนะนำของแอปก่อน
  const appMatch = STATE.destinations.find(d =>
    d.nameTh.toLowerCase().includes(q.toLowerCase()) || d.province.toLowerCase().includes(q.toLowerCase())
  );
  if (appMatch) {
    selectSearchResult(appMatch.nameTh, appMatch.lat, appMatch.lng, appMatch.province, true);
    return;
  }

  // ถ้ามีรายการจาก Search Autocomplete อยู่แล้ว ให้เลือกอันดับแรกทันที
  if (currentSearchResults && currentSearchResults.length > 0) {
    selectSearchResultByIndex(0);
    return;
  }

  // หากกดค้นหาเร็วยังไม่มีผลลัพธ์ ให้ยิง Longdo Search API ทันที
  try {
    const res = await fetch(`https://search.longdo.com/mapsearch/json/search?keyword=${encodeURIComponent(q)}&limit=5&key=${LONGDO_API_KEY}`);
    const data = await res.json();
    if (data && data.data && data.data.length > 0) {
      const best = data.data.find(it => {
        const lat = parseFloat(it.lat);
        const lon = parseFloat(it.lon);
        return !isNaN(lat) && !isNaN(lon);
      });
      if (best) {
        selectSearchResult(best.name, parseFloat(best.lat), parseFloat(best.lon), best.address || best.type);
      } else {
        showToast(`ไม่พบพิกัดสำหรับสถานที่ "${q}"`, 'warning');
      }
    } else {
      showToast(`ไม่พบสถานที่ "${q}"`, 'warning');
    }
  } catch (err) {
    showToast(`เกิดข้อผิดพลาดในการค้นหา "${q}"`, 'warning');
  }
}

function clearSearchMap() {
  const input = document.getElementById('mapSearchInput');
  if (input) input.value = '';
  const clearBtn = document.getElementById('btnClearSearch');
  if (clearBtn) clearBtn.style.display = 'none';
  hideSearchDropdown();

  if (searchResultMarker && longdoMap) {
    try { longdoMap.Overlays.remove(searchResultMarker); } catch (e) {}
    searchResultMarker = null;
  }
}

function hideSearchDropdown() {
  const dropdown = document.getElementById('mapSearchDropdown');
  if (dropdown) dropdown.classList.remove('active');
}

// ปิด dropdown เมื่อผู้ใช้แตะที่อื่นบนหน้าจอ
document.addEventListener('click', (e) => {
  if (!e.target.closest('.map-search-bar-wrap')) {
    hideSearchDropdown();
  }
});

// 🎯 ปุ่ม Crosshair ดึงตำแหน่งอุปกรณ์จริงของผู้ใช้ (รองรับทั้ง GPS มือถือ และ Wi-Fi/IP บน PC)
async function locateUserGPS() {
  showToast('🛰️ กำลังค้นหาตำแหน่งจริงของอุปกรณ์...', 'info');

  try {
    const pos = await getDeviceRealPosition(4500);
    updateUserRealGPS(pos.lat, pos.lng, pos.accuracy, pos.speed);

    if (longdoMap) {
      try {
        if (longdoMap.Renderer && typeof longdoMap.Renderer.flyTo === 'function') {
          longdoMap.Renderer.flyTo({ center: [pos.lng, pos.lat], zoom: 16, essential: true });
        }
      } catch (e) {}
    }

    showToast(`📍 พบตำแหน่งอุปกรณ์ของคุณ: ${pos.locationName ? pos.locationName + ' ' : ''}(${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}) [${pos.source}]`, 'success');
  } catch (err) {
    // GPS locate error
    showToast('⚠️ ไม่สามารถระบุตำแหน่งอุปกรณ์ได้', 'warning');
    if (longdoMap) {
      try {
        if (longdoMap.Renderer && typeof longdoMap.Renderer.flyTo === 'function') {
          longdoMap.Renderer.flyTo({ center: [STATE.gps.lng || DEFAULT_LNG, STATE.gps.lat || DEFAULT_LAT], zoom: 14, essential: true });
        }
      } catch (e) {}
    }
  }
}

// SPEEDOMETER & TRIP SIMULATION (ตรงตามภาพร่าง: "ความเร็ว km/h")
function setSpeedSimulation(speed, modeName, btnEl) {
  STATE.gps.targetSpeed = speed;
  STATE.gps.mode = modeName;
  document.getElementById('travelModeTitle').innerText = modeName;

  document.querySelectorAll('.btn-speed-sim').forEach(b => b.classList.remove('sim-active'));
  if (btnEl && speed > 0) btnEl.classList.add('sim-active');

  if (STATE.gps.simTimer) clearInterval(STATE.gps.simTimer);

  if (speed > 0) {
    STATE.gps.simTimer = setInterval(() => {
      const jitter = (Math.random() * 4 - 2);
      const curSpeed = Math.max(1, Math.round(speed + jitter));
      STATE.gps.speedKmH = curSpeed;
      document.getElementById('liveSpeedNumber').innerText = curSpeed;

      const addedKm = parseFloat((curSpeed / 3600 * 3).toFixed(2));
      STATE.gps.tripDistanceKm = parseFloat((STATE.gps.tripDistanceKm + addedKm).toFixed(2));
      STATE.user.totalDistanceKm = parseFloat((STATE.user.totalDistanceKm + addedKm).toFixed(2));

      document.getElementById('tripDistText').innerText = STATE.gps.tripDistanceKm.toFixed(1);

      advanceActivityQuest(modeName, addedKm);
    }, 1500);
  } else {
    STATE.gps.speedKmH = 0;
    document.getElementById('liveSpeedNumber').innerText = 0;
  }
}

function advanceActivityQuest(modeName, addedKm) {
  let matchedAct = null;
  if (modeName.includes('เดิน')) matchedAct = STATE.activities[0];
  else if (modeName.includes('ปั่น')) matchedAct = STATE.activities[1];
  else if (modeName.includes('ขับรถ')) matchedAct = STATE.activities[2];

  if (matchedAct && !matchedAct.isClaimed) {
    matchedAct.currentKm = Math.min(matchedAct.targetKm, parseFloat((matchedAct.currentKm + addedKm).toFixed(2)));
    renderActivities();
  }
}

// ==============================================================================
// SCREEN 2: กิจกรรม & เควส (เดิน, ปั่น, รถ, มอเตอร์ไซค์ ตามภาพร่าง)
// ==============================================================================
function renderActivities() {
  const container = document.getElementById('questListContainer');
  if (!container) return;

  container.innerHTML = STATE.activities.map(act => {
    const percent = Math.min(100, Math.round((act.currentKm / act.targetKm) * 100));
    const isCompleted = act.currentKm >= act.targetKm;

    return `
      <div class="quest-card">
        <div class="quest-icon-circle ${act.colorClass}">
          <i class="fa-solid ${act.icon}"></i>
        </div>
        <div class="quest-details">
          <div class="quest-title-row">
            <h4>${act.title}</h4>
            <span class="quest-target-km">${act.currentKm.toFixed(1)} / ${act.targetKm} km</span>
          </div>

          <div class="quest-progress-track">
            <div class="quest-progress-fill" style="width: ${percent}%;"></div>
          </div>

          <div class="quest-footer-row">
            <span class="quest-reward-pill">
              <i class="fa-solid fa-gift"></i> ${act.rewardVoucher}
            </span>
            ${act.isClaimed
              ? `<span style="color: var(--primary-light); font-weight: 700;"><i class="fa-solid fa-check"></i> รับแล้ว</span>`
              : isCompleted
                ? `<button class="btn-claim-reward" onclick="claimQuestReward('${act.id}')">🎉 แลกรับ ฿</button>`
                : `<span style="color: var(--text-dim); font-size: 11px;">อีก ${(act.targetKm - act.currentKm).toFixed(1)} km</span>`
            }
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function claimQuestReward(actId) {
  const act = STATE.activities.find(a => a.id === actId);
  if (!act || act.isClaimed) return;

  act.isClaimed = true;
  STATE.user.coins += act.rewardCoins;
  STATE.user.savingsThb += 100;
  persistState();
  updateUserUI();
  renderActivities();

  triggerConfetti();
  showToast(`สำเร็จ! ได้รับ ${act.rewardCoins} Coins และบันทึกคูปองเข้าบัญชีแล้ว`, 'success');
}

// ==============================================================================
// SCREEN 3: ลีดเดอร์บอร์ด (โพเดียม 1, 2, 3 และลิสต์ 4, 5, 6 ตามภาพร่าง)
// ==============================================================================
function renderLeaderboard() {
  const listWrap = document.getElementById('leaderboardListWrap');
  if (!listWrap) return;

  const ranksFrom4 = STATE.leaderboard.slice(3);

  listWrap.innerHTML = ranksFrom4.map(item => `
    <div class="leaderboard-row">
      <div class="rank-number">${item.rank}</div>
      <img src="${item.avatar}" alt="${item.name}" class="rank-avatar">
      <div class="rank-info">
        <div class="rank-name">${item.name}</div>
        <div class="rank-badge-tag">${item.badge}</div>
      </div>
      <div class="rank-km-val">${item.km.toFixed(1)} km</div>
    </div>
  `).join('') + `
    <!-- User's own ranking badge at bottom -->
    <div class="leaderboard-row" style="border-color: var(--accent-gold); background: rgba(245, 158, 11, 0.08); margin-top: 0.5rem;">
      <div class="rank-number" style="color: var(--accent-gold);">7</div>
      <img src="${STATE.user.avatar}" alt="You" class="rank-avatar" style="border: 2px solid var(--accent-gold);">
      <div class="rank-info">
        <div class="rank-name" style="color: var(--accent-gold);">คุณ (${STATE.user.username})</div>
        <div class="rank-badge-tag">${STATE.user.tier.toUpperCase()} Member</div>
      </div>
      <div class="rank-km-val">${STATE.user.totalDistanceKm.toFixed(1)} km</div>
    </div>
  `;
}

// ==============================================================================
// SCREEN 4: บัญชี (ACCOUNT & PROFILE MANAGEMENT)
// ==============================================================================
function updateUserUI() {
  const accountPill = document.getElementById('accountStatusPill');
  const accountStatusText = document.getElementById('accountStatusText');
  const accountBadgeIcon = document.getElementById('accountBadgeIcon');
  const accountName = document.getElementById('accountName');
  const accountEmail = document.getElementById('accountEmail');
  const accountAvatar = document.getElementById('accountAvatar');
  const accountAuthActionWrap = document.getElementById('accountAuthActionWrap');
  const accountLogoutBtn = document.getElementById('accountLogoutBtn');
  const headerUpgradeBtn = document.getElementById('headerUpgradeBtn');
  const mapVipBanner = document.getElementById('mapVipBanner');
  const islandText = document.getElementById('islandText');
  const authStatusDot = document.getElementById('authStatusDot');

  const tier = STATE.user.tier;
  const isVip = tier === 'vip';
  const isPro = tier === 'pro';
  const isLoggedIn = STATE.user.isLoggedIn;

  // Account Information
  if (accountName) {
    accountName.innerText = isLoggedIn ? `${STATE.user.username} (${STATE.user.fullName})` : 'ผู้เยี่ยมชม (Guest)';
  }
  if (accountEmail) {
    accountEmail.innerText = isLoggedIn ? STATE.user.email : 'ยังไม่ได้เข้าสู่ระบบ เข้าสู่ระบบเพื่อซิงค์ข้อมูล';
  }
  if (accountAvatar) {
    accountAvatar.src = STATE.user.avatar;
  }

  // Auth Button visibility on Account screen
  if (accountAuthActionWrap) {
    accountAuthActionWrap.style.display = isLoggedIn ? 'none' : 'block';
  }
  if (accountLogoutBtn) {
    accountLogoutBtn.style.display = isLoggedIn ? 'flex' : 'none';
  }

  // Header dot
  if (authStatusDot) {
    authStatusDot.className = isLoggedIn ? 'auth-dot' : 'auth-dot offline';
  }

  // Status Pill
  if (accountPill) {
    accountPill.className = `account-status-pill tier-${tier}`;
  }

  if (accountStatusText) {
    if (isVip) accountStatusText.innerText = 'VIP Elite Voyager 👑';
    else if (isPro) accountStatusText.innerText = 'Pro Traveler 🔥';
    else accountStatusText.innerText = 'Free Explorer';
  }

  if (accountBadgeIcon) {
    if (isVip) {
      accountBadgeIcon.innerHTML = '<i class="fa-solid fa-crown" style="color: #1e1b4b;"></i>';
      accountBadgeIcon.style.background = '#f59e0b';
    } else if (isPro) {
      accountBadgeIcon.innerHTML = '<i class="fa-solid fa-bolt" style="color: white;"></i>';
      accountBadgeIcon.style.background = '#0ea5e9';
    } else {
      accountBadgeIcon.innerHTML = '<i class="fa-solid fa-user"></i>';
      accountBadgeIcon.style.background = '#64748b';
    }
  }

  // Mobile Top Header Upgrade Button status
  if (headerUpgradeBtn) {
    if (isVip) {
      headerUpgradeBtn.innerHTML = '<i class="fa-solid fa-crown"></i> <span>VIP Member</span>';
      headerUpgradeBtn.classList.remove('pulse-badge');
      headerUpgradeBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      headerUpgradeBtn.style.color = '#ffffff';
    } else if (isPro) {
      headerUpgradeBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> <span>Pro Member</span>';
      headerUpgradeBtn.classList.remove('pulse-badge');
      headerUpgradeBtn.style.background = 'linear-gradient(135deg, #0ea5e9, #0284c7)';
      headerUpgradeBtn.style.color = '#ffffff';
    } else {
      headerUpgradeBtn.innerHTML = '<i class="fa-solid fa-crown"></i> <span>อัปเกรด VIP</span>';
      headerUpgradeBtn.classList.add('pulse-badge');
      headerUpgradeBtn.style.background = 'linear-gradient(135deg, #fbbf24, #d97706)';
      headerUpgradeBtn.style.color = '#1e1b4b';
    }
  }

  // Floating banner on map
  if (mapVipBanner) {
    if (isVip) {
      mapVipBanner.style.display = 'none';
    } else {
      mapVipBanner.style.display = 'flex';
    }
  }

  // Dynamic Island status
  if (islandText) {
    islandText.innerText = isVip ? 'GoThai • VIP Explorer' : 'GoThai GPS Active';
  }

  const savingsEl = document.getElementById('mySavingsVal');
  const coinsEl = document.getElementById('myCoinsVal');
  if (savingsEl) savingsEl.innerText = `฿${STATE.user.savingsThb.toLocaleString()}`;
  if (coinsEl) coinsEl.innerText = STATE.user.coins.toLocaleString();

  renderMapMarkers();
}

function openSubscriptionPaywall() {
  const modal = document.getElementById('paywallModal');
  if (modal) modal.classList.add('active');
}

function closeSubscriptionPaywall() {
  const modal = document.getElementById('paywallModal');
  if (modal) modal.classList.remove('active');
}

// ==============================================================================
// PAYMENT GATEWAY & "MAKE ME MONEY" ENGINE
// ==============================================================================
function openPaymentGateway(planId, planName, priceThb) {
  closeSubscriptionPaywall();

  STATE.pendingOrder = {
    planId,
    planName,
    priceThb,
    method: 'promptpay'
  };

  document.getElementById('modalPlanName').innerText = planName;
  document.getElementById('modalPlanPrice').innerText = `฿${priceThb}`;
  document.getElementById('payBtnAmount').innerText = `฿${priceThb}`;

  const qrImg = document.getElementById('promptPayQrImg');
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://promptpay.io/0812345678/${priceThb}`;
  }

  const modal = document.getElementById('paymentModal');
  modal.classList.add('active');
}

function closePaymentModal() {
  document.getElementById('paymentModal').classList.remove('active');
}

function switchPaymentTab(tabName, btn) {
  STATE.pendingOrder.method = tabName;
  document.querySelectorAll('.pay-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.pay-tab-pane').forEach(p => p.classList.remove('active'));

  if (btn) btn.classList.add('active');
  const pane = document.getElementById(`tab-${tabName}`);
  if (pane) pane.classList.add('active');
}

function processPaymentSimulation() {
  const btn = document.getElementById('confirmPaymentBtn');
  const origText = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังตรวจสอบการชำระเงิน...';
  btn.disabled = true;

  setTimeout(async () => {
    btn.innerHTML = origText;
    btn.disabled = false;
    closePaymentModal();

    const txnRef = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
    const orderData = {
      ref: txnRef,
      planId: STATE.pendingOrder.planId,
      planName: STATE.pendingOrder.planName,
      amountThb: STATE.pendingOrder.priceThb,
      method: STATE.pendingOrder.method === 'promptpay' ? 'พร้อมเพย์ (QR PromptPay)' : 'บัตรเครดิต/เดบิต',
      timestamp: new Date().toISOString()
    };

    STATE.user.tier = STATE.pendingOrder.planId;
    STATE.user.status = 'active';
    STATE.user.savingsThb += 1500;
    STATE.user.coins += 500;

    STATE.transactions.unshift(orderData);
    persistState();
    updateUserUI();

    // Push transaction to Supabase
    await recordTransactionToSupabase(orderData);

    // If logged in, update tier in Supabase profiles table
    if (STATE.authUser && STATE.supabase) {
      try {
        await STATE.supabase
          .from('profiles')
          .update({
            subscription_tier: STATE.user.tier,
            savings_thb: STATE.user.savingsThb,
            reward_coins: STATE.user.coins,
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', STATE.authUser.id);
      } catch (e) {
        // Profile tier update handled gracefully
      }
    }

    document.getElementById('receiptRef').innerText = txnRef;
    document.getElementById('receiptPlan').innerText = STATE.pendingOrder.planName;
    document.getElementById('receiptMethod').innerText = orderData.method;
    document.getElementById('receiptAmount').innerText = `฿${STATE.pendingOrder.priceThb}.00`;

    const successModal = document.getElementById('successModal');
    successModal.classList.add('active');

    triggerConfetti();
  }, 1200);
}

async function recordTransactionToSupabase(orderData) {
  if (!STATE.supabase) return;
  try {
    await STATE.supabase
      .from('transactions')
      .insert({
        auth_user_id: STATE.authUser ? STATE.authUser.id : null,
        transaction_ref: orderData.ref,
        plan_id: orderData.planId,
        plan_name: orderData.planName,
        amount_thb: orderData.amountThb,
        payment_method: orderData.method,
        status: 'completed',
        created_at: orderData.timestamp
      });
  } catch (err) {
    // Transaction recording handled gracefully
  }
}

function dismissSuccessAndOpenApp() {
  document.getElementById('successModal').classList.remove('active');
  closeSubscriptionPaywall();
  switchAppScreen('map');
  showToast('สิทธิประโยชน์สมาชิกเปิดใช้งานแล้ว ยินดีต้อนรับ!', 'success');
}

function selectPlan(planId) {
  if (planId === 'free') {
    STATE.user.tier = 'free';
    persistState();
    updateUserUI();
    showToast('เปลี่ยนเป็นแพ็กเกจฟรีแล้ว', 'info');
  }
}

// ==============================================================================
// MODAL: ORDER HISTORY
// ==============================================================================
function openOrderHistoryModal() {
  const listEl = document.getElementById('orderHistoryList');
  if (STATE.transactions.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
        <i class="fa-solid fa-receipt" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
        <p>ยังไม่มีประวัติการชำระเงิน</p>
      </div>
    `;
  } else {
    listEl.innerHTML = STATE.transactions.map(t => `
      <div style="background: rgba(255,255,255,0.04); border: 1px solid var(--border-glass); border-radius: 8px; padding: 0.85rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <strong style="color: white;">${t.planName}</strong>
          <span style="color: var(--accent-gold); font-weight: 700;">฿${t.amountThb}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);">
          <span>${t.ref} • ${t.method}</span>
          <span style="color: var(--primary-light);"><i class="fa-solid fa-check"></i> สำเร็จ</span>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('orderHistoryModal').classList.add('active');
}

function closeOrderHistoryModal() {
  document.getElementById('orderHistoryModal').classList.remove('active');
}

function resetDemoData() {
  if (confirm('ต้องการรีเซ็ตข้อมูลตัวอย่างทั้งหมดกลับสู่ค่าเริ่มต้นหรือไม่?')) {
    localStorage.removeItem('gothai_user');
    localStorage.removeItem('gothai_transactions');
    location.reload();
  }
}

// ==============================================================================
// LOCAL STORAGE & STATE PERSISTENCE
// ==============================================================================
function persistState() {
  try {
    localStorage.setItem('gothai_user', JSON.stringify(STATE.user));
    localStorage.setItem('gothai_transactions', JSON.stringify(STATE.transactions));
  } catch (e) {
    // LocalStorage save unavailable
  }
}

function loadStoredState() {
  try {
    const savedUser = localStorage.getItem('gothai_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      Object.assign(STATE.user, parsed);
    }
    const savedTxns = localStorage.getItem('gothai_transactions');
    if (savedTxns) {
      STATE.transactions = JSON.parse(savedTxns);
    }
  } catch (e) {
    // LocalStorage load unavailable
  }
}

// ==============================================================================
// UTILITIES: CLOCK, CONFETTI, TOAST
// ==============================================================================
function startClock() {
  const clockEl = document.getElementById('liveClock');
  if (!clockEl) return;
  setInterval(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    clockEl.innerText = `${h}:${m}`;
  }, 1000);
}

function startQrCountdown() {
  let seconds = 299;
  const timerEl = document.getElementById('qrTimer');
  setInterval(() => {
    if (seconds <= 0) seconds = 299;
    seconds--;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    if (timerEl) timerEl.innerText = `${m}:${s}`;
  }, 1000);
}

function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 250);
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'warning') icon = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${icon}" style="color: ${type === 'success' ? 'var(--primary-light)' : 'var(--accent-gold)'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==============================================================================
// APPLICATION BOOTSTRAP
// ==============================================================================
window.addEventListener('DOMContentLoaded', () => {
  loadStoredState();
  initSupabaseClient();
  startClock();
  startQrCountdown();
  updateUserUI();

  // If user was already logged in, enter main app directly
  if (STATE.user && STATE.user.isLoggedIn) {
    showMainApp();
  }
});
