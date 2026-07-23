// ================================================================
// 🐭 mouseDZ-ai - توليد فيديوهات محلياً
// بدون أي API خارجي - مجاني بالكامل
// ================================================================

// ====== STATE ======
const state = {
    currentTab: 'text2video',
    isGenerating: false,
    selectedDuration: '5',
    selectedAspect: '16:9',
    selectedStyle: 'cinematic',
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
    styleBtns: $$('#styleGroup .opt-btn'),
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
    a.download = `mouseDZ_ai_${Date.now()}.webm`;
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
setupOptions(dom.styleBtns, 'selectedStyle');

// ================================================================
// 🎯 قلب المشروع: توليد الفيديو باستخدام Canvas
// ================================================================

function getDimensions(aspect) {
    const sizes = {
        '16:9': { width: 854, height: 480 },
        '9:16': { width: 480, height: 854 },
        '1:1': { width: 512, height: 512 },
    };
    return sizes[aspect] || sizes['16:9'];
}

function getStyleColors(style) {
    const styles = {
        cinematic: { bg1: '#0a1628', bg2: '#1a2a4a', accent1: '#00d4ff', accent2: '#a855f7', text: '#ffffff' },
        anime: { bg1: '#1a0a2a', bg2: '#2a1a4a', accent1: '#ff6bff', accent2: '#00ffcc', text: '#ffe6ff' },
        vintage: { bg1: '#2a1a0a', bg2: '#4a2a1a', accent1: '#ffd93d', accent2: '#ff6b6b', text: '#ffeedd' },
    };
    return styles[style] || styles.cinematic;
}

// ====== توليد فيديو من النص ======
async function generateTextVideo(prompt, duration, aspect, style) {
    const dims = getDimensions(aspect);
    const colors = getStyleColors(style);
    const fps = 30;
    const totalFrames = duration * fps;

    const canvas = document.createElement('canvas');
    canvas.width = dims.width;
    canvas.height = dims.height;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
    });

    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    return new Promise((resolve, reject) => {
        recorder.start();

        let frame = 0;
        const interval = setInterval(() => {
            if (frame >= totalFrames) {
                clearInterval(interval);
                recorder.stop();
                return;
            }

            const progress = frame / totalFrames;
            updateProgress((progress) * 100, `⏳ توليد الإطار ${frame + 1}/${totalFrames}`);

            // ====== رسم الخلفية ======
            const gradient = ctx.createLinearGradient(0, 0, dims.width, dims.height);
            const hue1 = (progress * 60 + 220) % 360;
            const hue2 = (progress * 60 + 280) % 360;
            gradient.addColorStop(0, `hsl(${hue1}, 70%, 15%)`);
            gradient.addColorStop(0.5, `hsl(${(hue1 + hue2) / 2}, 60%, 25%)`);
            gradient.addColorStop(1, `hsl(${hue2}, 70%, 15%)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, dims.width, dims.height);

            // ====== رسم دوائر متحركة ======
            for (let i = 0; i < 15; i++) {
                const x = (i * 60 + frame * 2) % dims.width;
                const y = (i * 40 + frame * 1.5) % dims.height;
                const radius = 15 + Math.sin(frame * 0.02 + i) * 8;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${(hue1 + i * 20) % 360}, 80%, 60%, 0.2)`;
                ctx.fill();
            }

            // ====== رسم النص ======
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 20;

            // النص الرئيسي
            const fontSize = Math.min(dims.width, dims.height) / 12;
            ctx.font = `bold ${fontSize}px 'Segoe UI', system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const text = prompt.length > 60 ? prompt.substring(0, 57) + '...' : prompt;
            const words = text.split(' ');
            let lines = [];
            let currentLine = '';
            for (let word of words) {
                if ((currentLine + ' ' + word).length < 40) {
                    currentLine += (currentLine ? ' ' : '') + word;
                } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                }
            }
            if (currentLine) lines.push(currentLine);

            const lineHeight = fontSize * 1.4;
            const startY = dims.height / 2 - (lines.length - 1) * lineHeight / 2;

            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowBlur = 15;

            lines.forEach((line, i) => {
                const y = startY + i * lineHeight;
                // ظل
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillText(line, dims.width / 2 + 2, y + 2);
                // النص الرئيسي
                const gradientText = ctx.createLinearGradient(0, y - fontSize / 2, 0, y + fontSize / 2);
                gradientText.addColorStop(0, colors.accent1);
                gradientText.addColorStop(1, colors.accent2);
                ctx.fillStyle = gradientText;
                ctx.fillText(line, dims.width / 2, y);
            });

            // ====== إطار سينمائي ======
            ctx.shadowBlur = 0;
            ctx.strokeStyle = `rgba(255, 255, 255, 0.05)`;
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, dims.width - 20, dims.height - 20);

            // شريط سفلي
            ctx.fillStyle = `rgba(0, 0, 0, 0.4)`;
            ctx.fillRect(0, dims.height - 40, dims.width, 40);
            ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
            ctx.font = `12px 'Segoe UI', sans-serif`;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`🐭 mouseDZ-ai · ${style} · ${duration}s`, 20, dims.height - 20);

            // رقم الإطار
            ctx.textAlign = 'right';
            ctx.fillText(`#
