// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyDR6UDBF1aUC27WRsceSsAUoiJ57JQBgio",
    authDomain: "khedmet-el-nahda.firebaseapp.com",
    databaseURL: "https://khedmet-el-nahda-default-rtdb.firebaseio.com",
    projectId: "khedmet-el-nahda",
    storageBucket: "khedmet-el-nahda.firebasestorage.app",
    messagingSenderId: "1055413365579",
    appId: "1:1055413365579:web:0af8c76fa7ec7d1c2116ce",
    measurementId: "G-F3YWEDZMJE"
};

let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
} catch (e) {
    console.warn("Firebase config is pending or offline mode.");
}

// ==========================================
// 2. STATE MANAGEMENT
// ==========================================
const startDate = new Date('2026-08-07');
const totalDays = 15;
let currentFamily = null;
let currentSelectedDateStr = null;
let localCache = {};
let saveDebounceTimer = null;

const familyNames = {
    'family1': 'أسرة أولى وثانية',
    'family2': 'أسرة ثالثة ورابعة',
    'family3': 'أسرة خامسة وسادسة'
};

// ==========================================
// 3. UI SWITCHING & INITIALIZATION
// ==========================================
function selectFamily(familyKey) {
    currentFamily = familyKey;
    document.getElementById('family-selector').classList.add('hidden');
    document.getElementById('calendar-view').classList.remove('hidden');
    document.getElementById('back-btn').classList.remove('hidden');
    document.getElementById('print-btn').classList.remove('hidden');
    document.getElementById('page-title').innerText = familyNames[familyKey];

    listenToDatabase();
}

document.getElementById('back-btn').addEventListener('click', () => {
    document.getElementById('family-selector').classList.remove('hidden');
    document.getElementById('calendar-view').classList.add('hidden');
    document.getElementById('back-btn').classList.add('hidden');
    document.getElementById('print-btn').classList.add('hidden');
    document.getElementById('page-title').innerText = "جدول الخدمة التفاعلي";
});

// ==========================================
// 4. REAL-TIME DATABASE SYNC
// ==========================================
function listenToDatabase() {
    if (!db || !currentFamily) {
        renderCalendar();
        return;
    }

    showStatus('syncing');
    const familyRef = db.ref(`schedules/${currentFamily}`);

    familyRef.on('value', (snapshot) => {
        localCache = snapshot.val() || {};
        renderCalendar();
        showStatus('saved');

        if (currentSelectedDateStr && !document.getElementById('day-modal').classList.contains('hidden')) {
            updateModalUI(currentSelectedDateStr);
        }
    });
}

// ==========================================
// 5. CALENDAR RENDERER & STATS
// ==========================================
function renderCalendar() {
    const grid = document.getElementById('days-grid');
    grid.innerHTML = '';

    const searchQuery = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    const filterVal = document.getElementById('filter-select')?.value || 'all';

    const today = new Date();
    today.setHours(0,0,0,0);

    let totalIdeasCount = 0;
    let totalServantsCount = 0;
    let missingIdeasCount = 0;
    let missingServantsCount = 0;

    for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        currentDate.setHours(0,0,0,0);

        const dateStr = currentDate.toISOString().split('T')[0];
        const dayData = localCache[dateStr] || { idea: '', servants: [] };
        const servantsList = dayData.servants || [];

        const isPast = currentDate < today;
        const hasIdea = dayData.idea && dayData.idea.trim() !== '';

        // Calculate Stats
        if (hasIdea) totalIdeasCount++; else missingIdeasCount++;
        totalServantsCount += servantsList.length;
        if (servantsList.length === 0) missingServantsCount++;

        // Filter Logic
        if (filterVal === 'has-idea' && !hasIdea) continue;
        if (filterVal === 'no-idea' && hasIdea) continue;

        // Search Logic
        if (searchQuery) {
            const matchesIdea = (dayData.idea || '').toLowerCase().includes(searchQuery);
            const matchesServant = servantsList.some(s => s.toLowerCase().includes(searchQuery));
            if (!matchesIdea && !matchesServant) continue;
        }

        // Color Styles
        let cardStyle = "";
        let statusBadge = "";

        if (isPast) {
            cardStyle = "bg-slate-900/40 border-slate-800/80 opacity-60 print-card";
            statusBadge = `<span class="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded">منتهي</span>`;
        } else if (hasIdea) {
            cardStyle = "bg-cyan-950/20 border-cyan-500/50 shadow-lg shadow-cyan-950/20 print-card";
            statusBadge = `<span class="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] px-2 py-0.5 rounded">فيه فكرة</span>`;
        } else {
            cardStyle = "bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-950/20 print-card";
            statusBadge = `<span class="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded">بدون فكرة</span>`;
        }

        const dayName = currentDate.toLocaleDateString('ar-EG', { weekday: 'long', month: 'short', day: 'numeric' });

        const card = document.createElement('div');
        card.className = `border rounded-2xl p-4 flex flex-col justify-between transition-all cursor-pointer hover:scale-[1.02] ${cardStyle}`;
        card.onclick = () => openDayModal(dateStr, dayName, i + 1, isPast);

        card.innerHTML = `
            <div>
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-slate-300">اليوم ${i + 1}</span>
                    ${statusBadge}
                </div>
                <div class="text-sm font-bold text-slate-100 mb-2">${dayName}</div>
                <p class="text-xs text-slate-400 line-clamp-2 mb-3 h-8">${dayData.idea || 'لا توجد فكرة مسجلة حتى الآن...'}</p>
            </div>
            <div class="pt-3 border-t border-slate-800/60 flex justify-between items-center text-xs text-slate-400">
                <span>الخدام: <strong class="text-slate-200">${servantsList.length}</strong>/7</span>
                <span class="text-cyan-400 text-[11px] font-semibold no-print">${isPast ? 'عرض' : 'تعديل/عرض'} ←</span>
            </div>
        `;

        grid.appendChild(card);
    }

    // Update Dashboard Indicators
    document.getElementById('stat-ideas-count').innerText = `${totalIdeasCount} / ${totalDays}`;
    document.getElementById('stat-servants-count').innerText = totalServantsCount;
    document.getElementById('stat-missing-ideas').innerText = missingIdeasCount;
    document.getElementById('stat-missing-servants').innerText = missingServantsCount;
}

// ==========================================
// 6. MODAL INTERACTION & LOGIC
// ==========================================
function openDayModal(dateStr, dayName, dayNum, isPast) {
    currentSelectedDateStr = dateStr;
    const modal = document.getElementById('day-modal');

    document.getElementById('modal-day-num').innerText = `اليوم ${dayNum}`;
    document.getElementById('modal-date-title').innerText = dayName;

    const ideaInput = document.getElementById('modal-idea-input');
    const servantInput = document.getElementById('servant-name-input');
    const addBtn = document.getElementById('add-servant-btn');

    ideaInput.disabled = isPast;
    servantInput.disabled = isPast;
    addBtn.disabled = isPast;

    updateModalUI(dateStr);
    modal.classList.remove('hidden');
}

function updateModalUI(dateStr) {
    const dayData = localCache[dateStr] || { idea: '', servants: [] };
    
    const ideaInput = document.getElementById('modal-idea-input');
    if (document.activeElement !== ideaInput) {
        ideaInput.value = dayData.idea || '';
    }

    const servants = dayData.servants || [];
    document.getElementById('servants-count').innerText = `${servants.length} / 7`;

    const servantsList = document.getElementById('servants-list');
    servantsList.innerHTML = '';

    const currentDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    const isPast = currentDate < today;

    servants.forEach((name, index) => {
        const tag = document.createElement('span');
        tag.className = "bg-slate-800 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl flex items-center gap-2";
        
        let removeBtnHtml = isPast ? '' : `<button onclick="removeServant(${index})" class="text-slate-400 hover:text-red-400 font-bold text-sm">✕</button>`;
        tag.innerHTML = `<span>${name}</span>${removeBtnHtml}`;
        servantsList.appendChild(tag);
    });
}

function closeModal() {
    document.getElementById('day-modal').classList.add('hidden');
    currentSelectedDateStr = null;
}

// ==========================================
// 7. DATA MUTATION & NOTIFICATIONS
// ==========================================
function handleIdeaChange() {
    if (!currentSelectedDateStr) return;
    const val = document.getElementById('modal-idea-input').value;

    if (!localCache[currentSelectedDateStr]) {
        localCache[currentSelectedDateStr] = { idea: '', servants: [] };
    }
    localCache[currentSelectedDateStr].idea = val;

    triggerAutoSave();
}

function addServant() {
    if (!currentSelectedDateStr) return;
    const input = document.getElementById('servant-name-input');
    const name = input.value.trim();

    if (!name) return;

    if (!localCache[currentSelectedDateStr]) {
        localCache[currentSelectedDateStr] = { idea: '', servants: [] };
    }

    const currentServants = localCache[currentSelectedDateStr].servants || [];

    if (currentServants.length >= 7) {
        document.getElementById('alert-popup').classList.remove('hidden');
        return;
    }

    currentServants.push(name);
    localCache[currentSelectedDateStr].servants = currentServants;
    input.value = '';

    updateModalUI(currentSelectedDateStr);
    triggerAutoSave();
    showToast(`تم إضافة الخادم (${name}) بنجاح`);
}

function removeServant(index) {
    if (!currentSelectedDateStr || !localCache[currentSelectedDateStr]) return;

    const removedName = localCache[currentSelectedDateStr].servants[index];
    localCache[currentSelectedDateStr].servants.splice(index, 1);
    updateModalUI(currentSelectedDateStr);
    triggerAutoSave();
    showToast(`تم إزالة الخادم (${removedName})`);
}

function closeAlert() {
    document.getElementById('alert-popup').classList.add('hidden');
}

function triggerAutoSave() {
    showStatus('saving');
    clearTimeout(saveDebounceTimer);

    saveDebounceTimer = setTimeout(() => {
        if (db && currentFamily) {
            db.ref(`schedules/${currentFamily}`).set(localCache)
                .then(() => showStatus('saved'))
                .catch(() => showStatus('error'));
        } else {
            showStatus('saved');
            renderCalendar();
        }
    }, 500);
}

function showStatus(type) {
    const el = document.getElementById('save-status');
    if (type === 'saving') {
        el.className = "text-xs px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-2";
        el.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> جاري الحفظ...`;
    } else if (type === 'saved') {
        el.className = "text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2";
        el.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span> تم الحفظ ✓`;
    } else if (type === 'error') {
        el.className = "text-xs px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2";
        el.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-400"></span> خطأ في الحفظ`;
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    toastMsg.innerText = msg;
    toast.classList.remove('opacity-0', 'pointer-events-none');
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none');
    }, 2500);
}