// ================================================================
// 🐭 mouseDZ-ai - التطبيق الكامل
// يعمل باستخدام Puter.js (نموذج المستخدم يدفع)
// مجاني بالكامل - يعمل للجميع - بدون مفتاح API
// ================================================================

// ====== STATE ======
const state = {
    currentTab: 'text2video',
    isGenerating: false,
    selectedDuration: '10',
    selectedAspect: '16:9',
    selectedQuality: 'high',
    uploadedImage: null,
    currentVideoUrl: null,
    gallery: [],
    isPuterReady: false,
    isUserLoggedIn: false,
};

// ====== DOM REFS ======
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
    prompt: $('#promptInput'),
    promptImage: $('#promptInputImage'),
    generateBtn: $('#generateBtn'),
    logBox: $('#logBox'),
    tabBtns: $$('.tab-btn'),
    tabContents: $$('.tab-content'),
    durationBtns: $$('#durationGroup .opt-btn'),
    aspectBtns: $$('#aspectGroup .opt-btn'),
    qualityBtns: $$('#qualityGroup .opt-btn'),
    resultWrapper: $('#resultWrapper'),
    videoPlayer: $('#videoPlayer'),
    downloadBtn: $('#downloadBtn'),
    shareBtn: $('#shareBtn'),
    saveGalleryBtn: $('#saveGalleryBtn'),
    resultDuration: $('#resultDuration'),
    imageUploadArea: $('#imageUploadArea'),
    uploadBox: $('#uploadBox'),
    imageInput: $('#imageInput'),
    imagePreview: $('#imagePreview'),
    previewImg: $('#previewImg'),
    removeImageBtn: $('#removeImageBtn'),
    imageInfo: $('#imageInfo'),
    progressWrapper: $('#progressWrapper'),
    progressFill: $('#progressFill'),
    progressText: $('#progressText'),
    charCount: $('#charCount'),
    statusPuter: $('#statusPuter'),
    statusUser: $('#statusUser'),
    galleryGrid: $('#galleryGrid'),
    resultOverlay: $('#resultOverlay'),
};

// ====== LOGGING ======
function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    entry.innerHTML = `
        <span class="time">[${time}]</span>
        <span class="message">${message}</span>
    `;
    dom.logBox.appendChild(entry);
    dom.logBox.scrollTop = dom.logBox.scrollHeight;
}

// ====== STATUS UPDATE ======
function updateStatus(element, icon, text, type = '') {
    const iconEl = element.querySelector('.status-icon');
    const textEl = element.querySelector('.status-text');
    if (iconEl) iconEl.textContent = icon;
    if (textEl) textEl.textContent = text;
    element.className = `status-item ${type}`;
}

// ====== BUTTON STATE ======
function setLoading(isLoading) {
    state.isGenerating = isLoading;
    dom.generateBtn.classList.toggle('loading', isLoading);
    dom.generateBtn.disabled = isLoading;
    
    if (isLoading) {
        dom.progressWrapper.style.display = 'block';
        dom.progressFill.style.width = '0%';
        dom.progressText.textContent = '⏳ جارٍ التوليد...';
    } else {
        dom.progressWrapper.style.display = 'none';
    }
}

function updateProgress(value, text) {
    dom.progressFill.style.width = `${Math.min(value, 100)}%`;
    if (text) dom.progressText.textContent = text;
}

// ====== RESULT ======
function showResult(url, duration = '10') {
    state.currentVideoUrl = url;
    dom.videoPlayer.src = url;
    dom.resultWrapper.classList.add('show');
    dom.resultDuration.textContent = `⏱️ ${duration} ث`;
    dom.videoPlayer.play().catch(() => {});
    addLog('🎬 تم توليد الفيديو بنجاح!', 'success');
}

function hideResult() {
    dom.resultWrapper.classList.remove('show');
    dom.videoPlayer.src = '';
    state.currentVideoUrl = null;
}

// ====== DOWNLOAD ======
dom.downloadBtn.addEventListener('click', () => {
    if (!state.currentVideoUrl) {
        addLog('❌ لا يوجد فيديو للتحميل', 'error');
        return;
    }
    const a = document.createElement('a');
    a.href = state.currentVideoUrl;
    a.download = `mouseDZ_ai_video_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    addLog('⬇️ جارٍ تحميل الفيديو...', 'info');
});

// ====== SHARE ======
dom.shareBtn.addEventListener('click', async () => {
    if (!state.currentVideoUrl) {
        addLog('❌ لا يوجد فيديو للمشاركة', 'error');
        return;
    }
    try {
        const blob = await fetch(state.currentVideoUrl).then(r => r.blob());
        const file = new File([blob], 'video.mp4', { type: 'video/mp4' });
        if (navigator.share) {
            await navigator.share({
                title: '🐭 mouseDZ-ai',
                text: 'شاهد الفيديو الذي توليته باستخدام mouseDZ-ai!',
                files: [file],
            });
            addLog('📤 تمت المشاركة بنجاح', 'success');
        } else {
            await navigator.clipboard.writeText(state.currentVideoUrl);
            addLog('📋 تم نسخ الرابط للحافظة', 'success');
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            addLog(`❌ فشل المشاركة: ${error.message}`, 'error');
        }
    }
});

// ====== SAVE TO GALLERY ======
dom.saveGalleryBtn.addEventListener('click', () => {
    if (!state.currentVideoUrl) {
        addLog('❌ لا يوجد فيديو للحفظ', 'error');
        return;
    }
    const item = {
        id: Date.now(),
        url: state.currentVideoUrl,
        prompt: dom.prompt.value.trim() || dom.promptImage.value.trim(),
        duration: state.selectedDuration,
        date: new Date().toLocaleDateString('ar-EG'),
    };
    state.gallery.unshift(item);
    renderGallery();
    addLog('💾 تم حفظ الفيديو في المعرض', 'success');
});

// ====== GALLERY ======
function renderGallery() {
    if (state.gallery.length === 0) {
        dom.galleryGrid.innerHTML = `
            <div class="gallery-empty">
                <span>🎬</span>
                <p>لا توجد أعمال بعد. قم بتوليد فيديو وسيظهر هنا!</p>
            </div>
        `;
        return;
    }
    dom.galleryGrid.innerHTML = state.gallery.map(item => `
        <div class="gallery-item" data-id="${item.id}">
            <video src="${item.url}" muted></video>
            <div class="gallery-overlay">
                ${item.prompt ? item.prompt.substring(0, 30) + (item.prompt.length > 30 ? '...' : '') : 'بدون وصف'}
            </div>
        </div>
    `).join('');

    // إضافة حدث النقر لتشغيل الفيديو
    dom.galleryGrid.querySelectorAll('.gallery-item').forEach(el => {
        const video = el.querySelector('video');
        el.addEventListener('click', () => {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        });
        el.addEventListener('mouseenter', () => video.play());
        el.addEventListener('mouseleave', () => video.pause());
    });
}

// ====== IMAGE UPLOAD ======
dom.uploadBox.addEventListener('click', () => dom.imageInput.click());

dom.uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    dom.uploadBox.classList.add('dragover');
});

dom.uploadBox.addEventListener('dragleave', () => {
    dom.uploadBox.classList.remove('dragover');
});

dom.uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.uploadBox.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageFile(e.dataTransfer.files[0]);
    }
});

dom.imageInput.addEventListener('change', function() {
    if (this.files && this.files[0]) {
        handleImageFile(this.files[0]);
    }
});

function handleImageFile(file) {
    if (file.size > 5 * 1024 * 1024) {
        addLog('❌ حجم الصورة كبير جداً (الحد 5 ميجابايت)', 'error');
        return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        addLog('❌ نوع الصورة غير مدعوم (JPG, PNG, WEBP)', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        state.uploadedImage = e.target.result;
        dom.previewImg.src = state.uploadedImage;
        dom.imagePreview.style.display = 'block';
        dom.uploadBox.style.display = 'none';
        dom.imageInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} كيلوبايت)`;
        addLog(`✅ تم رفع الصورة: ${file.name}`, 'success');
    };
    reader.readAsDataURL(file);
}

dom.removeImageBtn.addEventListener('click', () => {
    state.uploadedImage = null;
    dom.imagePreview.style.display = 'none';
    dom.uploadBox.style.display = 'block';
    dom.imageInput.value = '';
    dom.imageInfo.textContent = '';
    addLog('🔄 تم إزالة الصورة', 'info');
});

// ====== TABS ======
dom.tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        dom.tabBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        dom.tabContents.forEach(c => c.classList.remove('active'));
        const target = document.getElementById(`tab-${this.dataset.tab}`);
        if (target) target.classList.add('active');

        state.currentTab = this.dataset.tab;

        // إظهار/إخفاء رفع الصورة
        dom.imageUploadArea.style.display = state.currentTab === 'image2video' ? 'block' : 'none';
        
        // تغيير نص الزر
        const labels = {
            'text2video': '🚀 توليد فيديو من نص',
            'image2video': '🖼️ توليد فيديو من صورة',
            'gallery': '🏆 معرض الأعمال'
        };
        dom.generateBtn.querySelector('.btn-text').textContent = labels[state.currentTab] || '🚀 توليد';

        // إخفاء النتيجة
        hideResult();

        const tabNames = {
            'text2video': 'نص إلى فيديو',
            'image2video': 'صورة إلى فيديو',
            'gallery': 'معرض الأعمال'
        };
        addLog(`🔄 التبديل إلى: ${tabNames[state.currentTab]}`, 'info');
    });
});

// ====== OPTIONS ======
function setupOptions(buttons, stateKey) {
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state[stateKey] = this.dataset.value;
            addLog(`⚙️ ${stateKey}: ${this.textContent.trim()}`, 'info');
        });
    });
}
setupOptions(dom.durationBtns, 'selectedDuration');
setupOptions(dom.aspectBtns, 'selectedAspect');
setupOptions(dom.qualityBtns, 'selectedQuality');

// ====== CHAR COUNTER ======
dom.prompt.addEventListener('input', () => {
    dom.charCount.textContent = dom.prompt.value.length;
});

// ====== PUTER CHECK ======
async function checkPuter() {
    try {
        if (typeof puter === 'undefined') {
            updateStatus(dom.statusPuter, '❌', 'Puter.js غير محمّل', 'error');
            addLog('❌ Puter.js غير محمّل. حاول تحديث الصفحة', 'error');
            return;
        }
        
        updateStatus(dom.statusPuter, '✅', 'Puter.js جاهز', 'success');
        state.isPuterReady = true;
        addLog('✅ Puter.js جاهز للاستخدام', 'success');

        // التحقق من تسجيل الدخول
        try {
            const user = await puter.auth.getUser();
            if (user) {
                state.isUserLoggedIn = true;
                updateStatus(dom.statusUser, '👤', `مرحباً ${user.username || 'المستخدم'}`, 'success');
                addLog(`👤 مرحباً ${user.username || 'المستخدم'}!`, 'success');
            } else {
                updateStatus(dom.statusUser, '🔑', 'غير مسجل (سيُطلب تسجيل الدخول عند التوليد)', '');
                addLog('ℹ️ سيُطلب منك تسجيل الدخول إلى Puter عند التوليد', 'info');
            }
        } catch (e) {
            updateStatus(dom.statusUser, '🔑', 'غير مسجل', '');
        }
    } catch (error) {
        updateStatus(dom.statusPuter, '❌', `خطأ: ${error.message}`, 'error');
        addLog(`⚠️ خطأ في Puter: ${error.message}`, 'error');
    }
}

// ====== MAIN GENERATE ======
async function handleGenerate() {
    if (state.isGenerating) return;
    
    // التحقق من وضع المعرض
    if (state.currentTab === 'gallery') {
        addLog('🏆 هذا هو معرض الأعمال', 'info');
        return;
    }

    // الحصول على النص
    const prompt = state.currentTab === 'text2video' 
        ? dom.prompt.value.trim() 
        : dom.promptImage.value.trim();

    if (!prompt || prompt.length < 3) {
        addLog('❌ الرجاء إدخال وصف (3 أحرف على الأقل)', 'error');
        return;
    }

    // التحقق من الصورة
    if (state.currentTab === 'image2video' && !state.uploadedImage) {
        addLog('❌ يرجى رفع صورة أولاً', 'error');
        return;
    }

    // التحقق من Puter
    if (!state.isPuterReady) {
        addLog('❌ Puter.js غير جاهز. حاول تحديث الصفحة', 'error');
        return;
    }

    setLoading(true);
    hideResult();

    try {
        const modeNames = {
            'text2video': 'فيديو من نص',
            'image2video': 'فيديو من صورة'
        };
        addLog(`🚀 بدء توليد ${modeNames[state.currentTab]}...`, 'info');
        addLog(`📝 البرومبت: ${prompt.substring(0, 60)}...`, 'info');

        // تحضير البيانات
        const options = {
            prompt: prompt,
            duration: parseInt(state.selectedDuration),
            aspect_ratio: state.selectedAspect,
        };

        if (state.currentTab === 'image2video' && state.uploadedImage) {
            options.image = state.uploadedImage;
        }

        // محاكاة التقدم
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 8 + 2;
            if (progress > 95) progress = 95;
            updateProgress(progress, `⏳ جارٍ التوليد... ${Math.round(progress)}%`);
        }, 500);

        addLog('⏳ جارٍ التوليد عبر Puter.ai (قد يستغرق 1-3 دقائق)...', 'info');

        // استدعاء Puter.js
        let result;
        if (state.currentTab === 'image2video') {
            result = await puter.ai.img2vid(options);
        } else {
            result = await puter.ai.txt2vid(options);
        }

        clearInterval(progressInterval);
        updateProgress(100, '✅ تم التوليد!');

        // النتيجة
        if (result && result.url) {
            showResult(result.url, state.selectedDuration);
        } else if (result && typeof result === 'string') {
            showResult(result, state.selectedDuration);
        } else {
            throw new Error('لم يتم استلام رابط الفيديو');
        }

    } catch (error) {
        console.error('خطأ:', error);

        if (error.message.includes('login') || error.message.includes('authenticated')) {
            addLog('❌ يرجى تسجيل الدخول إلى Puter', 'error');
            addLog('💡 ستظهر نافذة تسجيل الدخول تلقائياً', 'info');
            try {
                await puter.auth.signIn();
                addLog('✅ تم تسجيل الدخول! حاول مرة أخرى', 'success');
            } catch (e) {
                addLog('⚠️ لم يتم فتح نافذة تسجيل الدخول. حاول تحديث الصفحة', 'error');
            }
        } else if (error.message.includes('insufficient')) {
            addLog('❌ رصيد غير كافٍ. يرجى شحن حساب Puter أو إنشاء حساب جديد', 'error');
        } else {
            addLog(`❌ فشل التوليد: ${error.message}`, 'error');
        }
    } finally {
        setLoading(false);
        addLog('⏳ جاهز لتوليد جديد', 'info');
    }
}

// ====== EVENTS ======
dom.generateBtn.addEventListener('click', handleGenerate);

// Ctrl+Enter
dom.prompt.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (state.currentTab === 'text2video') handleGenerate();
    }
});

dom.promptImage.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (state.currentTab === 'image2video') handleGenerate();
    }
});

// ====== LOAD GALLERY FROM LOCAL STORAGE ======
function loadGallery() {
    try {
        const saved = localStorage.getItem('mouseDZ_gallery');
        if (saved) {
            state.gallery = JSON.parse(saved);
            renderGallery();
        }
    } catch (e) {
        console.warn('Failed to load gallery:', e);
    }
}

function saveGallery() {
    try {
        localStorage.setItem('mouseDZ_gallery', JSON.stringify(state.gallery));
    } catch (e) {
        console.warn('Failed to save gallery:', e);
    }
}

// ====== INIT ======
async function init() {
    addLog('🐭 جارٍ تهيئة mouseDZ-ai...', 'info');
    addLog('🔑 نسخة بدون مفتاح API - تعمل للجميع', 'success');
    addLog(`⏱️ المدة: ${state.selectedDuration} ثوان | 📐 النسبة: ${state.selectedAspect}`, 'info');
    addLog('💡 اضغط Ctrl+Enter للتوليد السريع', 'info');

    // تحميل المعرض
    loadGallery();

    // التحقق من Puter
    setTimeout(checkPuter, 1000);

    // إعداد الـ char counter
    dom.charCount.textContent = dom.prompt.value.length;

    // Auto-save gallery
    setInterval(saveGallery, 10000);

    addLog('✅ التطبيق جاهز!', 'success');
}

// تشغيل
init();
