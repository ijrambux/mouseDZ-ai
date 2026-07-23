// ================================================================
// 🐭 mouseDZ-ai - توليد فيديوهات عبر Together AI
// المفتاح: key_CdK43e1sfVRnMboRMucoF
// ================================================================

// ====== 🔑 المفتاح ======
const TOGETHER_API_KEY = 'key_CdK43e1sfVRnMboRMucoF';

// ====== STATE ======
const state = {
    currentTab: 'text2video',
    isGenerating: false,
    selectedDuration: '5',
    selectedAspect: '16:9',
    uploadedImage: null,
    currentVideoUrl: null,
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
    resultWrapper: $('#resultWrapper'),
    videoPlayer: $('#videoPlayer'),
    downloadBtn: $('#downloadBtn'),
    uploadBox: $('#uploadBox'),
    imageInput: $('#imageInput'),
    imagePreview: $('#imagePreview'),
    previewImg: $('#previewImg'),
    removeImageBtn: $('#removeImageBtn'),
    progressWrapper: $('#progressWrapper'),
    progressFill: $('#progressFill'),
    progressText: $('#progressText'),
};

// ====== LOGGING ======
function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    entry.innerHTML = `<span class="time">[${time}]</span> <span class="message">${message}</span>`;
    dom.logBox.appendChild(entry);
    dom.logBox.scrollTop = dom.logBox.scrollHeight;
}

// ====== BUTTON STATE ======
function setLoading(isLoading) {
    state.isGenerating = isLoading;
    dom.generateBtn.classList.toggle('loading', isLoading);
    dom.generateBtn.disabled = isLoading;
    dom.progressWrapper.style.display = isLoading ? 'block' : 'none';
    
    const socialLink = document.querySelector('.social-link');
    if (socialLink) {
        socialLink.style.opacity = isLoading ? '0.3' : '1';
        socialLink.style.pointerEvents = isLoading ? 'none' : 'auto';
    }

    if (!isLoading) {
        dom.progressFill.style.width = '0%';
    }
}

function updateProgress(value, text) {
    dom.progressFill.style.width = `${Math.min(value, 100)}%`;
    if (text) dom.progressText.textContent = text;
}

// ====== RESULT ======
function showResult(url) {
    state.currentVideoUrl = url;
    dom.videoPlayer.src = url;
    dom.resultWrapper.classList.add('show');
    dom.videoPlayer.play().catch(() => {});
    addLog('🎬 تم توليد الفيديو بنجاح!', 'success');
}

// ====== DOWNLOAD ======
dom.downloadBtn.addEventListener('click', () => {
    if (!state.currentVideoUrl) {
        addLog('❌ لا يوجد فيديو للتحميل', 'error');
        return;
    }
    const a = document.createElement('a');
    a.href = state.currentVideoUrl;
    a.download = `mouseDZ_ai_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    addLog('⬇️ جارٍ تحميل الفيديو...', 'info');
});

// ====== IMAGE UPLOAD ======
dom.uploadBox.addEventListener('click', () => dom.imageInput.click());
dom.uploadBox.addEventListener('dragover', (e) => { e.preventDefault(); dom.uploadBox.classList.add('dragover'); });
dom.uploadBox.addEventListener('dragleave', () => { dom.uploadBox.classList.remove('dragover'); });
dom.uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.uploadBox.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]);
});

dom.imageInput.addEventListener('change', function() {
    if (this.files && this.files[0]) handleImageFile(this.files[0]);
});

function handleImageFile(file) {
    if (file.size > 5 * 1024 * 1024) {
        addLog('❌ حجم الصورة كبير جداً (الحد 5 ميجابايت)', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        state.uploadedImage = e.target.result;
        dom.previewImg.src = state.uploadedImage;
        dom.imagePreview.style.display = 'block';
        dom.uploadBox.style.display = 'none';
        addLog(`✅ تم رفع الصورة: ${file.name}`, 'success');
    };
    reader.readAsDataURL(file);
}

dom.removeImageBtn.addEventListener('click', () => {
    state.uploadedImage = null;
    dom.imagePreview.style.display = 'none';
    dom.uploadBox.style.display = 'block';
    dom.imageInput.value = '';
    addLog('🔄 تم إزالة الصورة', 'info');
});

// ====== TABS ======
dom.tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        dom.tabBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        state.currentTab = this.dataset.tab;
        dom.tabContents.forEach(c => c.classList.remove('active'));
        const target = document.getElementById(`tab-${this.dataset.tab}`);
        if (target) target.classList.add('active');
        dom.resultWrapper.classList.remove('show');
        dom.videoPlayer.src = '';
        state.currentVideoUrl = null;
        const labels = {
            'text2video': '🚀 توليد فيديو من نص',
            'image2video': '🖼️ توليد فيديو من صورة'
        };
        dom.generateBtn.querySelector('.btn-text').textContent = labels[state.currentTab] || '🚀 توليد';
        addLog(`🔄 التبديل إلى: ${state.currentTab === 'text2video' ? 'نص إلى فيديو' : 'صورة إلى فيديو'}`, 'info');
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

// ================================================================
// 🎯 توليد الفيديو عبر Together AI
// ================================================================

async function uploadImageToTogether(imageBase64) {
    // Together AI يقبل الصور كـ URL أو base64 مباشرة
    // نعيد base64 كما هو
    return imageBase64;
}

async function generateVideoWithTogether(prompt, imageBase64 = null) {
    // ====== بناء الطلب ======
    // استخدام نموذج Wan 2.7 I2V (يدعم الصور) أو T2V [citation:3][citation:8]
    const model = imageBase64 ? 'Wan-AI/wan2.7-i2v' : 'Wan-AI/wan2.7-t2v';
    
    const payload = {
        model: model,
        prompt: prompt,
        resolution: '720P',
        ratio: state.selectedAspect,
        seconds: state.selectedDuration,
    };
    
    // ====== إضافة الصورة إن وجدت ======
    if (imageBase64) {
        payload.media = {
            frame_images: [
                {
                    input_image: imageBase64,
                    frame: 'first'
                }
            ]
        };
    }
    
    // ====== إرسال الطلب ======
    const response = await fetch('https://api.together.ai/v2/videos', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOGETHER_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`فشل إنشاء المهمة: ${error}`);
    }
    
    const job = await response.json();
    const jobId = job.id;
    addLog(`📋 Job ID: ${jobId}`, 'info');
    
    // ====== انتظار النتيجة (Polling) ======
    let videoUrl = null;
    for (let i = 0; i < 80; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        updateProgress((i / 80) * 100, `⏳ جارٍ التوليد... ${Math.round((i / 80) * 100)}%`);
        
        const statusResponse = await fetch(`https://api.together.ai/v2/videos/${jobId}`, {
            headers: { 'Authorization': `Bearer ${TOGETHER_API_KEY}` },
        });
        
        if (!statusResponse.ok) continue;
        
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'completed') {
            videoUrl = statusData.outputs.video_url;
            break;
        } else if (statusData.status === 'failed') {
            throw new Error(`فشل التوليد: ${statusData.error?.message || 'خطأ غير معروف'}`);
        }
    }
    
    if (!videoUrl) {
        throw new Error('انتهى وقت الانتظار (أكثر من 3 دقائق)');
    }
    
    return videoUrl;
}

// ====== التوليد الرئيسي ======
async function handleGenerate() {
    if (state.isGenerating) return;

    const prompt = state.currentTab === 'text2video'
        ? dom.prompt.value.trim()
        : dom.promptImage.value.trim();

    if (!prompt || prompt.length < 3) {
        addLog('❌ الرجاء إدخال وصف (3 أحرف على الأقل)', 'error');
        return;
    }

    if (state.currentTab === 'image2video' && !state.uploadedImage) {
        addLog('❌ يرجى رفع صورة أولاً', 'error');
        return;
    }

    setLoading(true);
    dom.resultWrapper.classList.remove('show');
    dom.videoPlayer.src = '';
    state.currentVideoUrl = null;

    try {
        const modeNames = {
            'text2video': 'فيديو من نص (Wan 2.7 T2V)',
            'image2video': 'فيديو من صورة (Wan 2.7 I2V)'
        };
        addLog(`🚀 بدء توليد ${modeNames[state.currentTab]}...`, 'info');
        addLog(`📝 البرومبت: ${prompt.substring(0, 60)}...`, 'info');
        addLog(`⏱️ المدة: ${state.selectedDuration} ثوان | 📐 النسبة: ${state.selectedAspect}`, 'info');
        
        let imageData = null;
        if (state.uploadedImage) {
            addLog('📷 جارٍ تجهيز الصورة...', 'info');
            imageData = state.uploadedImage;
            addLog('✅ تم تجهيز الصورة', 'success');
        }
        
        addLog('⏳ جارٍ توليد الفيديو عبر Together AI (قد يستغرق 1-3 دقائق)...', 'info');
        const videoUrl = await generateVideoWithTogether(prompt, imageData);
        
        showResult(videoUrl);
        addLog(`✅ تم التوليد بنجاح!`, 'success');

    } catch (error) {
        console.error('خطأ:', error);
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            addLog('❌ مفتاح API غير صالح. تأكد من المفتاح', 'error');
        } else if (error.message.includes('insufficient')) {
            addLog('❌ رصيد غير كافٍ. يرجى شحن حساب Together AI', 'error');
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

// ====== INIT ======
function init() {
    addLog('🐭 mouseDZ-ai - Together AI', 'success');
    addLog('🔑 مفتاح Together AI جاهز', 'success');
    addLog('🧠 النماذج: Wan 2.7 T2V / I2V', 'info');
    addLog(`⏱️ المدة: ${state.selectedDuration} ثوان | 📐 النسبة: ${state.selectedAspect}`, 'info');
    addLog('💡 اضغط Ctrl+Enter للتوليد السريع', 'info');
}

init();
