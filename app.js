/* ==============================================================================
   THAI TRAVEL & SUBSCRIPTION PLATFORM - CORE JAVASCRIPT LOGIC
   Theme: การท่องเที่ยวไทย x โมเดลสร้างรายได้ (Make Me Money Concept)
   ============================================================================== */

// Global State
const STATE = {
  activeView: 'landing', // 'landing' | 'app'
  activeAppScreen: 'map', // 'map' | 'activities' | 'leaderboard' | 'account'
  activeCategoryFilter: 'all',

  // Supabase Configuration
  supabase: null,
  isSupabaseConnected: false,
  supabaseUrl: localStorage.getItem('gothai_sb_url') || '',
  supabaseKey: localStorage.getItem('gothai_sb_key') || '',

  // Current User Profile (Make Me Money model)
  user: {
    id: 'usr_demo_88',
    fullName: 'กมลชนก นักสำรวจ',
    email: 'kamonchanok.travel@gothai.app',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    tier: 'free', // 'free' | 'pro' | 'vip'
    status: 'active',
    expiresAt: null,
    totalDistanceKm: 18.5,
    savingsThb: 450,
    coins: 120
  },

  // Real-time GPS & Speedometer tracking
  gps: {
    lat: 13.7563,
    lng: 100.5018,
    speedKmH: 0,
    targetSpeed: 0,
    tripDistanceKm: 0.0,
    mode: 'stopped', // 'stopped' | 'walking' | 'cycling' | 'car'
    simTimer: null
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

  // Transaction history
  transactions: []
};

// Leaflet Map Instance
let leafletMap = null;
let mapMarkers = [];
let userLocationMarker = null;

// ==============================================================================
// INITIALIZATION ON DOM READY
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadSavedState();
  initSupabaseClient();
  initLeafletMap();
  renderActivities();
  renderLeaderboard();
  updateUserUI();
  startClock();
  startQrCountdown();
});

// Load user & transaction data from LocalStorage
function loadSavedState() {
  const savedUser = localStorage.getItem('gothai_user');
  if (savedUser) {
    try {
      STATE.user = { ...STATE.user, ...JSON.parse(savedUser) };
    } catch (e) {
      console.warn('Failed to parse saved user', e);
    }
  }

  const savedTxns = localStorage.getItem('gothai_transactions');
  if (savedTxns) {
    try {
      STATE.transactions = JSON.parse(savedTxns);
    } catch (e) {
      console.warn('Failed to parse saved transactions', e);
    }
  }
}

function persistState() {
  localStorage.setItem('gothai_user', JSON.stringify(STATE.user));
  localStorage.setItem('gothai_transactions', JSON.stringify(STATE.transactions));
}

// ==============================================================================
// SUPABASE CLIENT SETUP & DATABASE SYNC
// ==============================================================================
function initSupabaseClient() {
  const statusDot = document.getElementById('dbStatusDot');
  const statusText = document.getElementById('dbStatusText');

  if (STATE.supabaseUrl && STATE.supabaseKey && window.supabase) {
    try {
      STATE.supabase = window.supabase.createClient(STATE.supabaseUrl, STATE.supabaseKey);
      STATE.isSupabaseConnected = true;
      statusDot.className = 'status-dot';
      statusText.innerHTML = '<strong>Supabase Cloud:</strong> เชื่อมต่อสำเร็จ (Live Connected)';
      showToast('เชื่อมต่อ Supabase สำเร็จแล้ว!', 'success');
      syncFromSupabase();
      return;
    } catch (err) {
      console.warn('Supabase init failed:', err);
    }
  }

  // Fallback to local demo storage
  STATE.isSupabaseConnected = false;
  statusDot.className = 'status-dot offline';
  statusText.innerHTML = '<strong>Supabase Mode:</strong> Local Storage Fallback (พร้อมใช้งานทันที)';
}

async function syncFromSupabase() {
  if (!STATE.supabase) return;
  try {
    // Attempt to read tourist destinations from Supabase
    const { data: dests, error: destError } = await STATE.supabase
      .from('tourist_destinations')
      .select('*')
      .limit(10);

    if (!destError && dests && dests.length > 0) {
      console.log('Fetched destinations from Supabase:', dests);
    }
  } catch (e) {
    console.warn('Supabase query exception:', e);
  }
}

async function recordTransactionToSupabase(txn) {
  if (!STATE.supabase) return false;
  try {
    const { data, error } = await STATE.supabase
      .from('transactions')
      .insert([{
        plan_id: txn.planId,
        amount_thb: txn.amountThb,
        payment_method: txn.method,
        payment_status: 'completed',
        transaction_ref: txn.ref,
        metadata: { client: 'GoThai WebApp', user: STATE.user.email }
      }]);
    if (error) {
      console.warn('Supabase insert transaction error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Supabase insert transaction exception:', e);
    return false;
  }
}

// ==============================================================================
// VIEW SWITCHING (LANDING <-> APP DASHBOARD)
// ==============================================================================
function switchMainView(viewName) {
  STATE.activeView = viewName;
  const landingSection = document.getElementById('landingView');
  const appSection = document.getElementById('appView');
  const toggleBtn = document.getElementById('viewToggleBtn');
  const toggleText = document.getElementById('viewToggleText');

  if (viewName === 'app') {
    landingSection.classList.remove('active');
    appSection.classList.add('active');
    toggleBtn.classList.add('active');
    toggleText.innerText = 'กลับหน้าแรก (Landing)';

    // Invalidate map size so Leaflet renders properly inside container
    setTimeout(() => {
      if (leafletMap) leafletMap.invalidateSize();
    }, 200);
  } else {
    appSection.classList.remove('active');
    landingSection.classList.add('active');
    toggleBtn.classList.remove('active');
    toggleText.innerText = 'เปิดหน้าแอป (App View)';
  }
}

function toggleMainView() {
  if (STATE.activeView === 'landing') {
    switchMainView('app');
  } else {
    switchMainView('landing');
  }
}

// Switch between the 4 Screens in App View (ตามภาพร่าง Wireframe)
function switchAppScreen(screenId) {
  STATE.activeAppScreen = screenId;
  const screens = ['map', 'activities', 'leaderboard', 'account'];

  screens.forEach(s => {
    const el = document.getElementById(`screen-${s}`);
    const navBtn = document.getElementById(`nav-btn-${s}`);
    if (el) el.classList.remove('active');
    if (navBtn) navBtn.classList.remove('active');
  });

  const targetScreen = document.getElementById(`screen-${screenId}`);
  const targetNavBtn = document.getElementById(`nav-btn-${screenId}`);
  if (targetScreen) targetScreen.classList.add('active');
  if (targetNavBtn) targetNavBtn.classList.add('active');

  if (screenId === 'map' && leafletMap) {
    setTimeout(() => leafletMap.invalidateSize(), 200);
  }
}

function toggleWideMode() {
  const frame = document.getElementById('deviceFrame');
  const btn = document.getElementById('wideModeBtn');
  if (frame.style.maxWidth === '100%') {
    frame.style.maxWidth = '480px';
    btn.innerHTML = '<i class="fa-solid fa-expand"></i> ขยายเต็มจอ';
  } else {
    frame.style.maxWidth = '100%';
    btn.innerHTML = '<i class="fa-solid fa-compress"></i> ย่อขนาดมือถือ';
  }
  setTimeout(() => {
    if (leafletMap) leafletMap.invalidateSize();
  }, 200);
}

// ==============================================================================
// LEAFLET MAP & GPS SPEEDOMETER (SCREEN 1 - หน้าหลัก แผนที่ GPS & ความเร็ว)
// ==============================================================================
function initLeafletMap() {
  const mapEl = document.getElementById('leaflet-map');
  if (!mapEl) return;

  // Center on Thailand
  leafletMap = L.map('leaflet-map', {
    zoomControl: false
  }).setView([13.7563, 100.5018], 10);

  // Modern Dark/Navy Map Tiles
  // ตัวอย่าง: ถ้าต้องการเปลี่ยนเป็นภาพถ่ายดาวเทียม (Satellite)
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19
  }).addTo(leafletMap);



  // Add zoom control at bottom right
  L.control.zoom({ position: 'topright' }).addTo(leafletMap);

  // User GPS Pulse Marker
  const userIcon = L.divIcon({
    className: 'custom-user-marker',
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
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  userLocationMarker = L.marker([STATE.gps.lat, STATE.gps.lng], { icon: userIcon }).addTo(leafletMap);
  userLocationMarker.bindTooltip('📍 ตำแหน่งปัจจุบันของคุณ', { permanent: false, direction: 'top' });

  // Render destinations onto map
  renderMapMarkers();
}

function renderMapMarkers() {
  if (!leafletMap) return;

  // Clear existing markers
  mapMarkers.forEach(m => leafletMap.removeLayer(m));
  mapMarkers = [];

  const filtered = STATE.destinations.filter(d => {
    if (STATE.activeCategoryFilter === 'all') return true;
    return d.category === STATE.activeCategoryFilter;
  });

  filtered.forEach(dest => {
    const isVipLocked = dest.isVipOnly && STATE.user.tier === 'free';

    // Choose pin styling
    let pinColor = '#10b981';
    let pinIcon = 'fa-mountain';

    if (dest.category === 'culture') { pinColor = '#38bdf8'; pinIcon = 'fa-gopuram'; }
    else if (dest.category === 'cafe') { pinColor = '#f59e0b'; pinIcon = 'fa-mug-saucer'; }
    else if (dest.category === 'camping') { pinColor = '#ec4899'; pinIcon = 'fa-campground'; }
    else if (dest.category === 'vip_secret') { pinColor = '#fbbf24'; pinIcon = 'fa-crown'; }

    const customMarkerIcon = L.divIcon({
      className: 'dest-marker',
      html: `
        <div style="
          width: 36px; height: 36px; border-radius: 50% 50% 50% 0;
          background: ${isVipLocked ? '#475569' : pinColor};
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        ">
          <i class="fa-solid ${isVipLocked ? 'fa-lock' : pinIcon}" style="
            transform: rotate(45deg);
            color: ${isVipLocked ? '#facc15' : 'white'};
            font-size: 14px;
          "></i>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    });

    const marker = L.marker([dest.lat, dest.lng], { icon: customMarkerIcon }).addTo(leafletMap);

    // Popup Content with monetization CTA if locked
    let popupHtml = '';
    if (isVipLocked) {
      popupHtml = `
        <div style="max-width: 230px; font-family: 'Prompt', sans-serif;">
          <div style="background: #1e293b; color: #fbbf24; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-bottom: 6px;">
            👑 พิกัดลับเฉพาะสมาชิก VIP
          </div>
          <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${dest.nameTh}</h4>
          <p style="font-size: 12px; color: #64748b; margin-bottom: 10px;">
            ปลดล็อกเพื่อดูเส้นทางลัด, จุดชมวิวส่วนตัว และรับสิทธิ์ส่วนลด 50%
          </p>
          <button onclick="openPaymentGateway('vip', 'VIP Elite Voyager', 499)" style="
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
        <div style="max-width: 250px; font-family: 'Prompt', sans-serif;">
          <img src="${dest.image}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">
          <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${dest.nameTh}</h4>
          <p style="font-size: 11px; color: #64748b; margin-bottom: 6px;">📍 ${dest.province} • ⭐ ${dest.rating}</p>
          <p style="font-size: 12px; color: #334155; margin-bottom: 8px;">${dest.description}</p>
          <div style="background: #ecfdf5; border: 1px dashed #10b981; color: #065f46; padding: 5px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">
            🎁 สิทธิพิเศษ: ${dest.perk}
          </div>
        </div>
      `;
    }

    marker.bindPopup(popupHtml);
    mapMarkers.push(marker);
  });
}

function filterMapCategory(cat, btn) {
  STATE.activeCategoryFilter = cat;
  document.querySelectorAll('.tag-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderMapMarkers();
}

function handleSearchMap(query) {
  if (!query || !leafletMap) return;
  const q = query.toLowerCase().trim();
  const matched = STATE.destinations.find(d =>
    d.nameTh.toLowerCase().includes(q) || d.province.toLowerCase().includes(q)
  );

  if (matched) {
    leafletMap.flyTo([matched.lat, matched.lng], 13, { duration: 1.2 });
  }
}

function locateUserGPS() {
  if (!leafletMap) return;
  leafletMap.flyTo([STATE.gps.lat, STATE.gps.lng], 14, { duration: 1.0 });
  showToast('นำทางมายังพิกัดปัจจุบันของคุณ', 'info');
}

// SPEEDOMETER & TRIP SIMULATION (ตามภาพร่าง: "ความเร็ว km/h")
function setSpeedSimulation(speed, modeName, btnEl) {
  STATE.gps.targetSpeed = speed;
  STATE.gps.mode = modeName;
  document.getElementById('travelModeTitle').innerText = modeName;

  document.querySelectorAll('.btn-speed-sim').forEach(b => b.classList.remove('sim-active'));
  if (btnEl && speed > 0) btnEl.classList.add('sim-active');

  if (STATE.gps.simTimer) clearInterval(STATE.gps.simTimer);

  if (speed > 0) {
    STATE.gps.simTimer = setInterval(() => {
      // Add slight jitter for realistic feeling
      const jitter = (Math.random() * 4 - 2);
      const curSpeed = Math.max(1, Math.round(speed + jitter));
      STATE.gps.speedKmH = curSpeed;
      document.getElementById('liveSpeedNumber').innerText = curSpeed;

      // Accumulate distance (approx 0.05 km every tick)
      const addedKm = parseFloat((curSpeed / 3600 * 3).toFixed(2));
      STATE.gps.tripDistanceKm = parseFloat((STATE.gps.tripDistanceKm + addedKm).toFixed(2));
      STATE.user.totalDistanceKm = parseFloat((STATE.user.totalDistanceKm + addedKm).toFixed(2));

      document.getElementById('tripDistText').innerText = STATE.gps.tripDistanceKm.toFixed(1);

      // Advance matching activity
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
// SCREEN 2: กิจกรรม & เควส (เดิน, ปั่น, ขับรถ, มอเตอร์ไซค์ ตามภาพร่าง)
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
  STATE.user.savingsThb += 100; // Instant savings value
  persistState();
  updateUserUI();
  renderActivities();

  // Trigger celebration confetti
  triggerConfetti();
  showToast(`สำเร็จ! ได้รับ ${act.rewardCoins} Coins และบันทึกคูปองเข้าบัญชีแล้ว`, 'success');
}

// ==============================================================================
// SCREEN 3: ลีดเดอร์บอร์ด (โพเดียม 1, 2, 3 และลิสต์ 4, 5, 6 ตามภาพร่าง)
// ==============================================================================
function renderLeaderboard() {
  const listWrap = document.getElementById('leaderboardListWrap');
  if (!listWrap) return;

  // The Top 3 are in the HTML podium. Render ranks 4, 5, 6 onwards
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
        <div class="rank-name" style="color: var(--accent-gold);">คุณ (${STATE.user.fullName})</div>
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
  const headerUpgradeBtn = document.getElementById('headerUpgradeBtn');
  const mapVipBanner = document.getElementById('mapVipBanner');
  const islandText = document.getElementById('islandText');

  const tier = STATE.user.tier;
  const isVip = tier === 'vip';
  const isPro = tier === 'pro';

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

  // Refresh map pins in case VIP secrets need unlocking
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

function openUpgradePrompt() {
  openSubscriptionPaywall();
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

  // Update QR image dynamically
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

  // Simulate payment processing delay (1.2 seconds)
  setTimeout(async () => {
    btn.innerHTML = origText;
    btn.disabled = false;
    closePaymentModal();

    // Generate unique transaction reference
    const txnRef = 'TXN-' + Math.floor(10000000 + Math.random() * 90000000);
    const orderData = {
      ref: txnRef,
      planId: STATE.pendingOrder.planId,
      planName: STATE.pendingOrder.planName,
      amountThb: STATE.pendingOrder.priceThb,
      method: STATE.pendingOrder.method === 'promptpay' ? 'พร้อมเพย์ (QR PromptPay)' : 'บัตรเครดิต/เดบิต',
      timestamp: new Date().toISOString()
    };

    // Update User Tier
    STATE.user.tier = STATE.pendingOrder.planId;
    STATE.user.status = 'active';
    STATE.user.savingsThb += 1500; // Immediate bonus value for upgrading
    STATE.user.coins += 500;

    // Record transaction locally
    STATE.transactions.unshift(orderData);
    persistState();
    updateUserUI();

    // Push to Supabase backend if connected
    await recordTransactionToSupabase(orderData);

    // Populate Success Modal
    document.getElementById('receiptRef').innerText = txnRef;
    document.getElementById('receiptPlan').innerText = STATE.pendingOrder.planName;
    document.getElementById('receiptMethod').innerText = orderData.method;
    document.getElementById('receiptAmount').innerText = `฿${STATE.pendingOrder.priceThb}.00`;

    // Show Celebration Modal
    const successModal = document.getElementById('successModal');
    successModal.classList.add('active');

    // Trigger Confetti
    triggerConfetti();
  }, 1200);
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
// MODALS: ORDER HISTORY & SUPABASE CONFIG
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

function openSupabaseModal() {
  document.getElementById('sbProjectUrl').value = STATE.supabaseUrl;
  document.getElementById('sbAnonKey').value = STATE.supabaseKey;
  document.getElementById('supabaseModal').classList.add('active');
}

function closeSupabaseModal() {
  document.getElementById('supabaseModal').classList.remove('active');
}

function saveSupabaseConfig() {
  const url = document.getElementById('sbProjectUrl').value.trim();
  const key = document.getElementById('sbAnonKey').value.trim();

  STATE.supabaseUrl = url;
  STATE.supabaseKey = key;
  localStorage.setItem('gothai_sb_url', url);
  localStorage.setItem('gothai_sb_key', key);

  closeSupabaseModal();
  initSupabaseClient();
}

function useDemoSupabaseMode() {
  localStorage.removeItem('gothai_sb_url');
  localStorage.removeItem('gothai_sb_key');
  STATE.supabaseUrl = '';
  STATE.supabaseKey = '';
  closeSupabaseModal();
  initSupabaseClient();
  showToast('เปิดใช้งาน Demo LocalStorage Mode', 'info');
}

function resetDemoData() {
  if (confirm('ต้องการรีเซ็ตข้อมูลตัวอย่างทั้งหมดกลับสู่ค่าเริ่มต้นหรือไม่?')) {
    localStorage.removeItem('gothai_user');
    localStorage.removeItem('gothai_transactions');
    location.reload();
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
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
