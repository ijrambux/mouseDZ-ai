// ================================================================
// 🐭 mouseDZ-ai - توليد فيديوهات بالذكاء الاصطناعي
// المفتاح: r8_FAkCDVNQr3V0CRhyL7XxfhdwlZ8Ah1b2RjC2i
// ================================================================

// ====== 🔑 المفتاح ======
const REPLICATE_API_TOKEN = 'r8_FAkCDVNQr3V0CRhyL7XxfhdwlZ8Ah1b2RjC2i';

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
// 🎯 توليد الفيديو بالذكاء الاصطناعي (Replicate)
// ================================================================

async function uploadImageToReplicate(imageBase64) {
    const response = await fetch('https://api.replicate.com/v1/files', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file: imageBase64 }),
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`فشل رفع الصورة: ${error}`);
    }
    
    const data = await response.json();
    return data.url;
}

async function generateVideoWithAI(prompt, imageUrl = null) {
    const input = {
        prompt: prompt,
        fps: 30,
        motion_bucket_id: 127,
        noise_aug_strength: 0.02,
        frames: parseInt(state.selectedDuration) * 30,
    };
    
    if (imageUrl) {
        input.input_image = imageUrl;
    }
    
    const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
            'Authorization': `Token ${REPLICATE_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            version: 'stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438',
            input: input,
        }),
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`فشل إنشاء المهمة: ${error}`);
    }
    
    const prediction = await response.json();
    const predictionId = prediction.id;
    
    let videoUrl = null;
    for (let i = 0; i < 60; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        updateProgress((i / 60) * 100, `⏳ جارٍ التوليد... ${Math.round((i / 60) * 100)}%`);
        
        const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
            headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` },
        });
        
        if (!statusResponse.ok) continue;
        
        const statusData = await statusResponse.json();
        
        if (statusData.status === 'succeeded') {
            videoUrl = statusData.output;
            break;
        } else if (statusData.status === 'failed') {
            throw new Error('فشل توليد الفيديو');
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
            'text2video': 'فيديو من نص',
            'image2video': 'فيديو من صورة'
        };
        addLog(`🚀 بدء توليد ${modeNames[state.currentTab]} بالذكاء الاصطناعي...`, 'info');
        addLog(`📝 البرومبت: ${prompt.substring(0, 60)}...`, 'info');
        
        let imageUrl = null;
        if (state.uploadedImage) {
            addLog('⏳ جارٍ رفع الصورة...', 'info');
            imageUrl = await uploadImageToReplicate(state.uploadedImage);
            addLog('✅ تم رفع الصورة', 'success');
        }
        
        addLog('⏳ جارٍ توليد الفيديو بالذكاء الاصطناعي (قد يستغرق 1-3 دقائق)...', 'info');
        const videoUrl = await generateVideoWithAI(prompt, imageUrl);
        
        showResult(videoUrl);
        addLog(`✅ تم التوليد بنجاح!`, 'success');

    } catch (error) {
        console.error('خطأ:', error);
        if (error.message.includes('401') || error.message.includes('token')) {
            addLog('❌ مفتاح API غير صالح. تأكد من المفتاح', 'error');
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
    addLog('🐭 mouseDZ-ai - ذكاء اصطناعي حقيقي', 'success');
    addLog('🔑 مفتاح Replicate جاهز', 'success');
    addLog(`⏱️ المدة: ${state.selectedDuration} ثوان | 📐 النسبة: ${state.selectedAspect}`, 'info');
    addLog('💡 اضغط Ctrl+Enter للتوليد السريع', 'info');
}

init();
