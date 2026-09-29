class FrameExtractor {
    constructor() {
        this.currentFile = null;
        this.fileType = null;
        this.frames = [];
        this.isExtracting = false;
        this.shouldCancel = false;
        this.activeFilter = 'all';
        this.currentLightboxIndex = null;

        this.initDomElements();
        this.bindEvents();
    }

    initDomElements() {
        this.dropZone = document.getElementById('extractorDropZone');
        this.fileInput = document.getElementById('extractorFileInput');
        this.fileInfoBanner = document.getElementById('extractorFileInfo');
        this.fileNameEl = document.getElementById('extractorFileName');
        this.fileDetailsEl = document.getElementById('extractorFileDetails');
        this.changeFileBtn = document.getElementById('extractorChangeFileBtn');

        this.optionsSection = document.getElementById('extractorOptionsSection');
        this.videoSettingsEl = document.getElementById('videoExtractorSettings');
        this.gifSettingsEl = document.getElementById('gifExtractorSettings');
        this.videoFpsInput = document.getElementById('extractorVideoFps');
        this.videoMaxFramesInput = document.getElementById('extractorMaxFrames');
        this.videoTimeRangeContainer = document.getElementById('videoTimeRangeContainer');
        this.videoStartTimeInput = document.getElementById('extractorStartTime');
        this.videoEndTimeInput = document.getElementById('extractorEndTime');
        this.videoDurationLabel = document.getElementById('extractorVideoDuration');
        this.gifFrameCountInfo = document.getElementById('gifFrameCountInfo');

        this.autoDetectDupesCheck = document.getElementById('extractorAutoDetectDupes');
        this.dupeSensitivitySelect = document.getElementById('extractorDupeSensitivity');
        this.dupeScopeSelect = document.getElementById('extractorDupeScope');
        this.recalculateDupesBtn = document.getElementById('extractorRecalculateDupesBtn');

        this.startBtn = document.getElementById('extractorStartBtn');
        this.cancelBtn = document.getElementById('extractorCancelBtn');
        this.progressSection = document.getElementById('extractorProgressSection');
        this.progressBar = document.getElementById('extractorProgressBar');
        this.progressText = document.getElementById('extractorProgressText');
        this.progressPreview = document.getElementById('extractorProgressPreview');

        this.resultsSection = document.getElementById('extractorResultsSection');
        this.totalFramesBadge = document.getElementById('extractorTotalCount');
        this.selectedFramesBadge = document.getElementById('extractorSelectedCount');
        this.duplicateFramesBadge = document.getElementById('extractorDuplicateCount');

        this.selectAllBtn = document.getElementById('extractorSelectAllBtn');
        this.deselectAllBtn = document.getElementById('extractorDeselectAllBtn');
        this.invertSelectBtn = document.getElementById('extractorInvertSelectBtn');
        this.deselectDupesBtn = document.getElementById('extractorDeselectDupesBtn');
        this.sampleRateSelect = document.getElementById('extractorSampleRateSelect');

        this.filterTabs = document.querySelectorAll('.extractor-filter-tab');

        this.grid = document.getElementById('extractorGrid');

        this.exportFormatSelect = document.getElementById('extractorExportFormat');
        this.jpegQualityGroup = document.getElementById('extractorJpegQualityGroup');
        this.jpegQualityInput = document.getElementById('extractorJpegQuality');
        this.jpegQualityVal = document.getElementById('extractorJpegQualityVal');
        this.filenamePrefixInput = document.getElementById('extractorFilenamePrefix');
        this.downloadZipBtn = document.getElementById('extractorDownloadZipBtn');
        this.sendToGifMakerBtn = document.getElementById('extractorSendToGifMakerBtn');

        this.lightbox = document.getElementById('extractorLightbox');
        this.lightboxImg = document.getElementById('extractorLightboxImg');
        this.lightboxCompareImg = document.getElementById('extractorLightboxCompareImg');
        this.lightboxCompareWrapper = document.getElementById('extractorLightboxCompareWrapper');
        this.lightboxTitle = document.getElementById('extractorLightboxTitle');
        this.lightboxDetails = document.getElementById('extractorLightboxDetails');
        this.lightboxCloseBtn = document.getElementById('extractorLightboxClose');
        this.lightboxPrevBtn = document.getElementById('extractorLightboxPrev');
        this.lightboxNextBtn = document.getElementById('extractorLightboxNext');
        this.lightboxToggleBtn = document.getElementById('extractorLightboxToggle');
    }

    bindEvents() {
        if (!this.dropZone) return;

        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('dragover');
        });
        this.dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');
        });
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                this.handleFile(e.dataTransfer.files[0]);
            }
        });

        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });

        this.changeFileBtn?.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.startBtn?.addEventListener('click', () => this.startExtraction());
        this.cancelBtn?.addEventListener('click', () => {
            this.shouldCancel = true;
            this.cancelBtn.textContent = 'Cancelando...';
            this.cancelBtn.disabled = true;
        });

        this.recalculateDupesBtn?.addEventListener('click', () => {
            this.recalculateDuplicates();
        });
        this.dupeSensitivitySelect?.addEventListener('change', () => {
            if (this.frames.length > 0) {
                this.recalculateDuplicates();
            }
        });
        this.dupeScopeSelect?.addEventListener('change', () => {
            if (this.frames.length > 0) {
                this.recalculateDuplicates();
            }
        });

        this.selectAllBtn?.addEventListener('click', () => this.setAllSelection(true));
        this.deselectAllBtn?.addEventListener('click', () => this.setAllSelection(false));
        this.invertSelectBtn?.addEventListener('click', () => this.invertSelection());
        this.deselectDupesBtn?.addEventListener('click', () => this.deselectDuplicates());

        this.sampleRateSelect?.addEventListener('change', (e) => {
            const step = parseInt(e.target.value, 10);
            if (!isNaN(step) && step > 1) {
                this.sampleSelect(step);
                e.target.value = '';
            }
        });

        this.filterTabs?.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.filterTabs.forEach(t => t.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                this.activeFilter = target.dataset.filter || 'all';
                this.renderFramesGrid();
            });
        });

        this.exportFormatSelect?.addEventListener('change', (e) => {
            if (this.jpegQualityGroup) {
                this.jpegQualityGroup.style.display = e.target.value === 'jpeg' ? 'flex' : 'none';
            }
        });
        this.jpegQualityInput?.addEventListener('input', (e) => {
            if (this.jpegQualityVal) {
                this.jpegQualityVal.textContent = `${e.target.value}%`;
            }
        });

        this.downloadZipBtn?.addEventListener('click', () => this.downloadZip());

        this.sendToGifMakerBtn?.addEventListener('click', () => this.sendToGifMaker());

        this.lightboxCloseBtn?.addEventListener('click', () => this.closeLightbox());
        this.lightboxPrevBtn?.addEventListener('click', () => this.navigateLightbox(-1));
        this.lightboxNextBtn?.addEventListener('click', () => this.navigateLightbox(1));
        this.lightboxToggleBtn?.addEventListener('click', () => this.toggleLightboxCurrentFrame());

        this.lightbox?.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.closeLightbox();
            }
        });

        window.addEventListener('keydown', (e) => {
            if (!this.lightbox || this.lightbox.style.display !== 'flex') return;
            if (e.key === 'Escape') this.closeLightbox();
            if (e.key === 'ArrowLeft') this.navigateLightbox(-1);
            if (e.key === 'ArrowRight') this.navigateLightbox(1);
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.toggleLightboxCurrentFrame();
            }
        });
    }

    async handleFile(file) {
        if (!file) return;

        const isGif = file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif');
        const isVideo = file.type.startsWith('video/') ||
            /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(file.name);

        if (!isGif && !isVideo) {
            alert('Por favor subí un archivo de video (MP4, WebM, MOV) o un archivo GIF.');
            return;
        }

        this.currentFile = file;
        this.fileType = isGif ? 'gif' : 'video';
        this.frames = [];
        this.resultsSection.style.display = 'none';

        this.fileInfoBanner.style.display = 'flex';
        this.fileNameEl.textContent = file.name;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        this.optionsSection.style.display = 'block';

        if (this.fileType === 'gif') {
            this.videoSettingsEl.style.display = 'none';
            this.gifSettingsEl.style.display = 'block';
            this.fileDetailsEl.textContent = `GIF animado • ${sizeMb} MB`;
            this.inspectGif(file);
        } else {
            this.gifSettingsEl.style.display = 'none';
            this.videoSettingsEl.style.display = 'block';
            this.fileDetailsEl.textContent = `Video • ${sizeMb} MB`;
            this.inspectVideo(file);
        }
    }

    async inspectGif(file) {
        try {
            const buffer = await file.arrayBuffer();
            this.gifBuffer = new Uint8Array(buffer);
            const reader = new window.GifReader(this.gifBuffer);
            const count = reader.numFrames();
            this.gifFrameCount = count;
            this.gifWidth = reader.width;
            this.gifHeight = reader.height;

            let totalDurationMs = 0;
            for (let i = 0; i < count; i++) {
                const info = reader.frameInfo(i);
                totalDurationMs += (info.delay || 10) * 10;
            }

            const sec = (totalDurationMs / 1000).toFixed(2);
            this.fileDetailsEl.textContent = `GIF animado • ${this.gifWidth}x${this.gifHeight} px • ${count} frames • ~${sec}s (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
            this.gifFrameCountInfo.textContent = `Se detectaron ${count} frames originales en el GIF (${this.gifWidth}x${this.gifHeight} px). Todos serán extraídos.`;
            this.startBtn.disabled = false;
        } catch (err) {
            console.error('Error al analizar GIF:', err);
            this.fileDetailsEl.textContent += ` (Error al leer estructura: ${err.message})`;
        }
    }

    async inspectVideo(file) {
        const url = URL.createObjectURL(file);
        const tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        tempVideo.muted = true;
        tempVideo.playsInline = true;

        tempVideo.onloadedmetadata = () => {
            this.videoDuration = tempVideo.duration;
            this.videoWidth = tempVideo.videoWidth;
            this.videoHeight = tempVideo.videoHeight;
            URL.revokeObjectURL(url);

            const durationSec = Math.floor(tempVideo.duration);
            const durationMin = Math.floor(durationSec / 60);
            const durationRemainSec = durationSec % 60;
            const timeStr = `${durationMin}:${durationRemainSec.toString().padStart(2, '0')}`;

            this.fileDetailsEl.textContent = `Video • ${this.videoWidth}x${this.videoHeight} px • Duración: ${timeStr} (${tempVideo.duration.toFixed(2)}s) • ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
            this.videoDurationLabel.textContent = `(Duración total: ${tempVideo.duration.toFixed(2)}s)`;

            if (this.videoStartTimeInput) this.videoStartTimeInput.value = '0';
            if (this.videoEndTimeInput) {
                this.videoEndTimeInput.value = tempVideo.duration.toFixed(2);
                this.videoEndTimeInput.max = tempVideo.duration.toFixed(2);
            }

            this.startBtn.disabled = false;
        };

        tempVideo.onerror = (e) => {
            console.error('Error cargando video:', e);
            URL.revokeObjectURL(url);
            alert('No se pudo decodificar el video. Verifica que el formato sea soportado por el navegador.');
        };

        tempVideo.src = url;
    }

    async startExtraction() {
        if (!this.currentFile || this.isExtracting) return;

        this.isExtracting = true;
        this.shouldCancel = false;
        this.frames = [];

        this.startBtn.disabled = true;
        this.cancelBtn.disabled = false;
        this.cancelBtn.innerHTML = '<i data-lucide="square"></i> Cancelar';
        if (window.lucide) window.lucide.createIcons();
        this.optionsSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.progressSection.style.display = 'block';
        this.progressBar.style.width = '0%';
        this.progressText.textContent = 'Iniciando extracción...';

        try {
            if (this.fileType === 'gif') {
                await this.extractGifFrames();
            } else {
                await this.extractVideoFrames();
            }

            if (this.shouldCancel) {
                this.progressText.textContent = 'Extracción cancelada por el usuario.';
                setTimeout(() => {
                    this.progressSection.style.display = 'none';
                    this.optionsSection.style.display = 'block';
                    this.startBtn.disabled = false;
                    this.isExtracting = false;
                }, 1000);
                return;
            }

            if (this.autoDetectDupesCheck && this.autoDetectDupesCheck.checked) {
                this.progressText.textContent = 'Analizando y detectando frames duplicados...';
                await this.runDuplicateDetection();
            }
            this.progressBar.style.width = '100%';
            this.progressText.textContent = `¡Listo! Se extrajeron ${this.frames.length} frames.`;

            setTimeout(() => {
                this.progressSection.style.display = 'none';
                this.resultsSection.style.display = 'block';
                this.optionsSection.style.display = 'block';
                this.startBtn.disabled = false;
                this.isExtracting = false;
                this.renderFramesGrid();
                this.updateStats();
            }, 600);

        } catch (error) {
            console.error('Error durante la extracción:', error);
            alert('Ocurrió un error al extraer los frames: ' + error.message);
            this.progressSection.style.display = 'none';
            this.optionsSection.style.display = 'block';
            this.startBtn.disabled = false;
            this.isExtracting = false;
        }
    }

    async extractGifFrames() {
        const reader = new window.GifReader(this.gifBuffer);
        const numFrames = reader.numFrames();
        const width = reader.width;
        const height = reader.height;

        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = width;
        compositeCanvas.height = height;
        const compCtx = compositeCanvas.getContext('2d', { willReadFrequently: true });

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

        const framePixels = new Uint8ClampedArray(width * height * 4);
        let previousCompositeSnapshot = null;
        let elapsedMs = 0;

        for (let i = 0; i < numFrames; i++) {
            if (this.shouldCancel) break;

            const frameInfo = reader.frameInfo(i);

            if (frameInfo.disposal === 3) {
                previousCompositeSnapshot = compCtx.getImageData(0, 0, width, height);
            }

            framePixels.fill(0);
            reader.decodeAndBlitFrameRGBA(i, framePixels);

            const imgData = new ImageData(framePixels, width, height);
            tempCtx.putImageData(imgData, 0, 0);

            compCtx.drawImage(tempCanvas, 0, 0);

            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = width;
            frameCanvas.height = height;
            const fCtx = frameCanvas.getContext('2d', { willReadFrequently: true });
            fCtx.drawImage(compositeCanvas, 0, 0);

            const dataUrl = frameCanvas.toDataURL('image/png');
            const thumbData = this.createFrameThumbSignature(frameCanvas);
            const delayMs = (frameInfo.delay || 10) * 10;

            this.frames.push({
                id: `gif-frame-${i}-${Date.now()}`,
                index: i,
                canvas: frameCanvas,
                dataUrl: dataUrl,
                width: width,
                height: height,
                timestampStr: `${elapsedMs}ms`,
                delay: delayMs,
                thumbData: thumbData,
                selected: true,
                isDuplicate: false,
                duplicateOf: null,
                similarity: 0
            });

            elapsedMs += delayMs;

            if (frameInfo.disposal === 2) {
                compCtx.clearRect(frameInfo.x, frameInfo.y, frameInfo.width, frameInfo.height);
            } else if (frameInfo.disposal === 3 && previousCompositeSnapshot) {
                compCtx.putImageData(previousCompositeSnapshot, 0, 0);
            }

            const pct = Math.round(((i + 1) / numFrames) * 100);
            this.progressBar.style.width = `${pct}%`;
            this.progressText.textContent = `Extrayendo frame ${i + 1} de ${numFrames} (${pct}%)...`;
            if (this.progressPreview) this.progressPreview.src = dataUrl;

            if (i % 5 === 0) {
                await new Promise(r => setTimeout(r, 0));
            }
        }
    }

    async extractVideoFrames() {
        const fileUrl = URL.createObjectURL(this.currentFile);
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';

        await new Promise((resolve, reject) => {
            video.onloadedmetadata = () => resolve();
            video.onerror = (e) => reject(new Error('Error al cargar video para extracción'));
            video.src = fileUrl;
        });

        const duration = video.duration;
        const width = video.videoWidth;
        const height = video.videoHeight;

        const requestedFps = Math.max(1, Math.min(60, parseInt(this.videoFpsInput?.value || '15', 10)));
        const maxFramesLimit = parseInt(this.videoMaxFramesInput?.value || '300', 10) || 300;

        let startTime = Math.max(0, parseFloat(this.videoStartTimeInput?.value || '0'));
        let endTime = Math.min(duration, parseFloat(this.videoEndTimeInput?.value || duration.toString()));
        if (endTime <= startTime) endTime = duration;

        const effectiveDuration = endTime - startTime;
        let step = 1 / requestedFps;
        let estimatedFrames = Math.floor(effectiveDuration * requestedFps);

        if (maxFramesLimit > 0 && estimatedFrames > maxFramesLimit) {
            step = effectiveDuration / maxFramesLimit;
            estimatedFrames = maxFramesLimit;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        let frameIdx = 0;
        let currentTime = startTime;

        while (currentTime <= endTime + 0.001 && frameIdx < estimatedFrames) {
            if (this.shouldCancel) break;

            await this.seekVideoTo(video, currentTime);

            ctx.drawImage(video, 0, 0, width, height);

            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = width;
            frameCanvas.height = height;
            const fCtx = frameCanvas.getContext('2d', { willReadFrequently: true });
            fCtx.drawImage(canvas, 0, 0);

            const dataUrl = frameCanvas.toDataURL('image/png');
            const thumbData = this.createFrameThumbSignature(frameCanvas);

            const min = Math.floor(currentTime / 60);
            const sec = (currentTime % 60).toFixed(2);
            const timestampStr = `${min.toString().padStart(2, '0')}:${sec.padStart(5, '0')}`;

            this.frames.push({
                id: `video-frame-${frameIdx}-${Date.now()}`,
                index: frameIdx,
                canvas: frameCanvas,
                dataUrl: dataUrl,
                width: width,
                height: height,
                timestamp: currentTime,
                timestampStr: timestampStr,
                delay: Math.round(step * 1000),
                thumbData: thumbData,
                selected: true,
                isDuplicate: false,
                duplicateOf: null,
                similarity: 0
            });

            const pct = Math.min(100, Math.round(((frameIdx + 1) / estimatedFrames) * 100));
            this.progressBar.style.width = `${pct}%`;
            this.progressText.textContent = `Extrayendo frame ${frameIdx + 1} de ~${estimatedFrames} (${pct}%)...`;
            if (this.progressPreview) this.progressPreview.src = dataUrl;

            frameIdx++;
            currentTime += step;

            if (frameIdx % 4 === 0) {
                await new Promise(r => setTimeout(r, 0));
            }
        }

        URL.revokeObjectURL(fileUrl);
    }

    seekVideoTo(video, targetTime) {
        return new Promise((resolve) => {
            const timeToSeek = Math.min(Math.max(0, targetTime), video.duration);
            if (Math.abs(video.currentTime - timeToSeek) < 0.001 && video.readyState >= 2) {
                resolve();
                return;
            }

            let timeoutId;
            const onSeeked = () => {
                clearTimeout(timeoutId);
                video.removeEventListener('seeked', onSeeked);
                resolve();
            };

            video.addEventListener('seeked', onSeeked, { once: true });
            timeoutId = setTimeout(() => {
                video.removeEventListener('seeked', onSeeked);
                resolve();
            }, 1200);

            video.currentTime = timeToSeek;
        });
    }

    createFrameThumbSignature(canvas) {
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 32;
        thumbCanvas.height = 32;
        const thumbCtx = thumbCanvas.getContext('2d', { willReadFrequently: true });
        thumbCtx.drawImage(canvas, 0, 0, 32, 32);
        return thumbCtx.getImageData(0, 0, 32, 32).data;
    }

    async runDuplicateDetection() {
        if (!this.frames || this.frames.length < 2) return;

        const sensitivity = parseFloat(this.dupeSensitivitySelect?.value || '99');
        const scope = this.dupeScopeSelect?.value || 'all';

        for (const frame of this.frames) {
            frame.isDuplicate = false;
            frame.duplicateOf = null;
            frame.similarity = 0;
        }

        const total = this.frames.length;

        for (let i = 1; i < total; i++) {
            const current = this.frames[i];

            const startCheck = scope === 'consecutive' ? i - 1 : 0;
            const endCheck = i;

            let bestMatch = null;
            let highestSimilarity = 0;

            for (let j = startCheck; j < endCheck; j++) {
                const candidate = this.frames[j];
                if (scope === 'all' && candidate.isDuplicate) continue;

                const similarity = this.calculateSimilarity(current.thumbData, candidate.thumbData);

                if (similarity >= sensitivity && similarity > highestSimilarity) {
                    highestSimilarity = similarity;
                    bestMatch = candidate;

                    if (highestSimilarity >= 99.99) break;
                }
            }

            if (bestMatch) {
                current.isDuplicate = true;
                current.duplicateOf = bestMatch.index;
                current.similarity = highestSimilarity;
            }

            if (i % 25 === 0) {
                const pct = Math.round((i / total) * 100);
                this.progressText.textContent = `Analizando duplicados: frame ${i}/${total} (${pct}%)...`;
                await new Promise(r => setTimeout(r, 0));
            }
        }
    }

    calculateSimilarity(thumbA, thumbB) {
        let diffSum = 0;
        const len = thumbA.length;

        for (let i = 0; i < len; i += 4) {
            diffSum += Math.abs(thumbA[i] - thumbB[i]) +
                Math.abs(thumbA[i + 1] - thumbB[i + 1]) +
                Math.abs(thumbA[i + 2] - thumbB[i + 2]);
        }

        const maxDiff = (len / 4) * 765;
        const similarity = (1 - (diffSum / maxDiff)) * 100;
        return similarity;
    }

    async recalculateDuplicates() {
        if (!this.frames || this.frames.length < 2) return;

        if (this.recalculateDupesBtn) {
            this.recalculateDupesBtn.disabled = true;
            this.recalculateDupesBtn.textContent = 'Calculando...';
        }

        await this.runDuplicateDetection();

        if (this.recalculateDupesBtn) {
            this.recalculateDupesBtn.disabled = false;
            this.recalculateDupesBtn.innerHTML = '<i data-lucide="refresh-cw"></i> Recalcular';
            if (window.lucide) window.lucide.createIcons();
        }

        this.renderFramesGrid();
        this.updateStats();
    }

    renderFramesGrid() {
        if (!this.grid) return;

        let filteredFrames = this.frames;
        if (this.activeFilter === 'selected') {
            filteredFrames = this.frames.filter(f => f.selected);
        } else if (this.activeFilter === 'duplicates') {
            filteredFrames = this.frames.filter(f => f.isDuplicate);
        } else if (this.activeFilter === 'unique') {
            filteredFrames = this.frames.filter(f => !f.isDuplicate);
        }

        if (filteredFrames.length === 0) {
            this.grid.innerHTML = `
                <div class="empty-state-notice">
                    <p>No hay frames para mostrar con el filtro actual ("${this.activeFilter}").</p>
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();

        filteredFrames.forEach((frame) => {
            const card = document.createElement('div');
            card.className = `extractor-frame-card ${frame.selected ? 'selected' : ''} ${frame.isDuplicate ? 'is-duplicate' : ''}`;
            card.dataset.index = frame.index;

            const numStr = (frame.index + 1).toString().padStart(3, '0');

            let dupeBadgeHtml = '';
            if (frame.isDuplicate) {
                const targetNum = (frame.duplicateOf + 1).toString().padStart(3, '0');
                const simStr = frame.similarity ? `${frame.similarity.toFixed(1)}%` : '100%';
                dupeBadgeHtml = `
                    <div class="frame-duplicate-badge" title="Frame duplicado del #${targetNum} con ${simStr} de similitud">
                        <i data-lucide="copy"></i> Igual a #${targetNum} (${simStr})
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="frame-card-header">
                    <label class="frame-checkbox-label">
                        <input type="checkbox" class="frame-select-check" ${frame.selected ? 'checked' : ''}>
                        <span class="frame-badge-num">#${numStr}</span>
                    </label>
                    <span class="frame-time-tag">${frame.timestampStr}</span>
                </div>
                <div class="frame-thumb-container">
                    <img src="${frame.dataUrl}" alt="Frame ${numStr}" loading="lazy">
                    <button class="frame-zoom-btn" title="Ampliar frame"><i data-lucide="maximize-2"></i></button>
                    ${dupeBadgeHtml}
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (e.target.closest('.frame-zoom-btn')) {
                    e.stopPropagation();
                    this.openLightbox(frame.index);
                    return;
                }

                if (e.target.classList.contains('frame-select-check')) {
                    frame.selected = e.target.checked;
                } else {
                    frame.selected = !frame.selected;
                    const chk = card.querySelector('.frame-select-check');
                    if (chk) chk.checked = frame.selected;
                }

                card.classList.toggle('selected', frame.selected);
                this.updateStats();
            });

            fragment.appendChild(card);
        });

        this.grid.innerHTML = '';
        this.grid.appendChild(fragment);
        if (window.lucide) window.lucide.createIcons();
    }

    updateStats() {
        const total = this.frames.length;
        const selected = this.frames.filter(f => f.selected).length;
        const duplicates = this.frames.filter(f => f.isDuplicate).length;

        if (this.totalFramesBadge) this.totalFramesBadge.textContent = total;
        if (this.selectedFramesBadge) this.selectedFramesBadge.textContent = `${selected} / ${total}`;
        if (this.duplicateFramesBadge) this.duplicateFramesBadge.textContent = duplicates;

        if (this.deselectDupesBtn) {
            this.deselectDupesBtn.disabled = duplicates === 0;
            this.deselectDupesBtn.innerHTML = `<i data-lucide="sparkles"></i> Deseleccionar duplicados (${duplicates})`;
        }

        if (this.downloadZipBtn) {
            this.downloadZipBtn.disabled = selected === 0;
            this.downloadZipBtn.innerHTML = `<i data-lucide="download"></i> Descargar ZIP (${selected} frames)`;
        }

        if (this.sendToGifMakerBtn) {
            this.sendToGifMakerBtn.disabled = selected < 2;
            this.sendToGifMakerBtn.innerHTML = `<i data-lucide="wand-2"></i> Enviar al Creador de GIF (${selected})`;
        }
        if (window.lucide) window.lucide.createIcons();
    }

    setAllSelection(selectedState) {
        this.frames.forEach(f => f.selected = selectedState);
        this.renderFramesGrid();
        this.updateStats();
    }

    invertSelection() {
        this.frames.forEach(f => f.selected = !f.selected);
        this.renderFramesGrid();
        this.updateStats();
    }

    deselectDuplicates() {
        let countUnchecked = 0;
        this.frames.forEach(f => {
            if (f.isDuplicate && f.selected) {
                f.selected = false;
                countUnchecked++;
            }
        });

        this.renderFramesGrid();
        this.updateStats();
    }

    sampleSelect(step) {
        this.frames.forEach((f, idx) => {
            f.selected = (idx % step === 0);
        });
        this.renderFramesGrid();
        this.updateStats();
    }

    async downloadZip() {
        const selectedFrames = this.frames.filter(f => f.selected);
        if (selectedFrames.length === 0) {
            alert('Por favor seleccioná al menos un frame para descargar.');
            return;
        }

        if (typeof window.JSZip === 'undefined') {
            alert('La librería JSZip no está disponible. Verificá que jszip.min.js esté cargada.');
            return;
        }

        const format = this.exportFormatSelect?.value || 'png';
        const quality = format === 'jpeg' ? (parseInt(this.jpegQualityInput?.value || '90', 10) / 100) : 1.0;
        const prefix = (this.filenamePrefixInput?.value || 'frame_').trim();

        const originalBtnText = this.downloadZipBtn.innerHTML;
        this.downloadZipBtn.disabled = true;
        this.downloadZipBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Preparando imágenes...`;
        if (window.lucide) window.lucide.createIcons();

        try {
            const zip = new window.JSZip();
            const total = selectedFrames.length;
            const padLen = Math.max(3, total.toString().length);

            for (let i = 0; i < total; i++) {
                const frame = selectedFrames[i];
                const frameNum = (i + 1).toString().padStart(padLen, '0');
                const filename = `${prefix}${frameNum}.${format}`;

                let blob;
                if (format === 'png') {
                    blob = await new Promise(res => frame.canvas.toBlob(res, 'image/png'));
                } else {
                    blob = await new Promise(res => frame.canvas.toBlob(res, 'image/jpeg', quality));
                }

                zip.file(filename, blob);

                if (i % 10 === 0 || i === total - 1) {
                    const pct = Math.round(((i + 1) / total) * 50);
                    this.downloadZipBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Procesando ${i + 1}/${total} (${pct}%)...`;
                    if (window.lucide) window.lucide.createIcons();
                    await new Promise(r => setTimeout(r, 0));
                }
            }

            this.downloadZipBtn.innerHTML = `<i data-lucide="archive"></i> Comprimiendo ZIP...`;
            if (window.lucide) window.lucide.createIcons();

            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            }, (metadata) => {
                const pct = 50 + Math.round(metadata.percent * 0.5);
                this.downloadZipBtn.innerHTML = `<i data-lucide="archive"></i> Comprimiendo ZIP (${pct}%)...`;
                if (window.lucide) window.lucide.createIcons();
            });

            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            const baseFileName = this.currentFile.name.replace(/\.[^/.]+$/, '');
            a.download = `${baseFileName}_frames_${format}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 2000);

            this.downloadZipBtn.innerHTML = `<i data-lucide="check"></i> ¡ZIP Descargado!`;
            if (window.lucide) window.lucide.createIcons();
            setTimeout(() => {
                this.downloadZipBtn.disabled = false;
                this.updateStats();
            }, 2000);

        } catch (error) {
            console.error('Error al generar ZIP:', error);
            alert('Error generando el archivo ZIP: ' + error.message);
            this.downloadZipBtn.disabled = false;
            this.downloadZipBtn.innerHTML = originalBtnText;
        }
    }

    sendToGifMaker() {
        const selectedFrames = this.frames.filter(f => f.selected);
        if (selectedFrames.length < 2) {
            alert('Seleccioná al menos dos frames para crear un GIF.');
            return;
        }

        if (typeof window.gifMaker === 'undefined') {
            alert('Creador de GIF no disponible.');
            return;
        }

        const gifTab = document.getElementById('tabGifMaker');
        if (gifTab) gifTab.click();

        window.gifMaker.loadFramesFromExtractor(selectedFrames);
    }

    openLightbox(index) {
        if (!this.lightbox || !this.frames[index]) return;
        this.currentLightboxIndex = index;
        const frame = this.frames[index];

        const numStr = (frame.index + 1).toString().padStart(3, '0');
        this.lightboxTitle.textContent = `Frame #${numStr} (${frame.timestampStr})`;
        this.lightboxImg.src = frame.dataUrl;

        let details = `Resolución: ${frame.width}x${frame.height}px`;
        if (frame.delay) details += ` • Delay: ${frame.delay}ms`;

        if (frame.isDuplicate) {
            const masterNum = (frame.duplicateOf + 1).toString().padStart(3, '0');
            const sim = frame.similarity ? `${frame.similarity.toFixed(1)}%` : '100%';
            details += ` • <i data-lucide="copy"></i> Duplicado del Frame #${masterNum} (${sim} similar)`;

            const masterFrame = this.frames[frame.duplicateOf];
            if (masterFrame && this.lightboxCompareImg && this.lightboxCompareWrapper) {
                this.lightboxCompareImg.src = masterFrame.dataUrl;
                this.lightboxCompareWrapper.style.display = 'block';
                const compTitle = document.getElementById('extractorLightboxCompareTitle');
                if (compTitle) compTitle.textContent = `Original: Frame #${masterNum}`;
            }
        } else {
            if (this.lightboxCompareWrapper) {
                this.lightboxCompareWrapper.style.display = 'none';
            }
        }

        this.lightboxDetails.innerHTML = details;
        this.updateLightboxToggleBtn();
        this.lightbox.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons();
    }

    closeLightbox() {
        if (this.lightbox) {
            this.lightbox.style.display = 'none';
        }
        this.currentLightboxIndex = null;
    }

    navigateLightbox(direction) {
        if (this.currentLightboxIndex === null) return;
        let newIdx = this.currentLightboxIndex + direction;
        if (newIdx < 0) newIdx = this.frames.length - 1;
        if (newIdx >= this.frames.length) newIdx = 0;
        this.openLightbox(newIdx);
    }

    toggleLightboxCurrentFrame() {
        if (this.currentLightboxIndex === null) return;
        const frame = this.frames[this.currentLightboxIndex];
        frame.selected = !frame.selected;
        this.updateLightboxToggleBtn();
        this.renderFramesGrid();
        this.updateStats();
    }

    updateLightboxToggleBtn() {
        if (this.currentLightboxIndex === null || !this.lightboxToggleBtn) return;
        const frame = this.frames[this.currentLightboxIndex];
        if (frame.selected) {
            this.lightboxToggleBtn.innerHTML = '<i data-lucide="check"></i> Frame Seleccionado (Click para deseleccionar)';
            this.lightboxToggleBtn.classList.add('selected');
        } else {
            this.lightboxToggleBtn.innerHTML = '<i data-lucide="square"></i> Frame No seleccionado (Click para seleccionar)';
            this.lightboxToggleBtn.classList.remove('selected');
        }
        if (window.lucide) window.lucide.createIcons();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.frameExtractor = new FrameExtractor();
});
