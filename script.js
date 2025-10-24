class GifMaker {
    constructor() {
        this.frames = [];
        this.frameDuration = 500;
        this.transparentGreen = false;
        this.gifWidth = 400;
        this.gifHeight = 400;

        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.frameDurationInput = document.getElementById('frameDuration');
        this.transparentGreenInput = document.getElementById('transparentGreen');
        this.customWidthInput = document.getElementById('customWidth');
        this.customHeightInput = document.getElementById('customHeight');
        this.sizeInfo = document.getElementById('sizeInfo');
        this.totalDurationSpan = document.getElementById('totalDuration');
        this.generateBtn = document.getElementById('generateBtn');
        this.timeline = document.getElementById('timeline');
        this.previewContainer = document.getElementById('previewContainer');
        this.themeToggle = document.getElementById('themeToggle');

        this.bindEvents();
        this.updateUI();
        this.initTheme();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }

    bindEvents() {
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

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
            this.processFiles(Array.from(e.dataTransfer.files));
        });

        this.fileInput.addEventListener('change', (e) => {
            this.processFiles(Array.from(e.target.files));
        });

        this.frameDurationInput.addEventListener('input', (e) => {
            this.frameDuration = parseInt(e.target.value);
            this.updateUI();
        });

        this.transparentGreenInput.addEventListener('change', (e) => {
            this.transparentGreen = e.target.checked;
        });

        this.customWidthInput.addEventListener('input', (e) => {
            this.gifWidth = parseInt(e.target.value);
        });

        this.customHeightInput.addEventListener('input', (e) => {
            this.gifHeight = parseInt(e.target.value);
        });

        this.generateBtn.addEventListener('click', () => this.generateGif());
    }

    async processFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        for (const file of imageFiles) {
            try {
                const frame = await this.createFrame(file);
                this.frames.push(frame);

                // Auto-detect size from first image
                if (this.frames.length === 1) {
                    this.autoDetectSize(frame.image);
                }
            } catch (error) {
                console.error('Error processing file:', file.name, error);
            }
        }

        this.updateUI();
    }

    autoDetectSize(firstImage) {
        this.gifWidth = firstImage.width;
        this.gifHeight = firstImage.height;

        // Update the input fields
        this.customWidthInput.value = this.gifWidth;
        this.customHeightInput.value = this.gifHeight;

        // Update the info text
        this.sizeInfo.textContent = `Tamaño detectado automáticamente: ${this.gifWidth}x${this.gifHeight}px (de la primera imagen)`;
        this.sizeInfo.style.color = 'var(--success-bg)';
    }

    createFrame(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        id: Date.now() + Math.random(),
                        file: file,
                        image: img,
                        dataUrl: e.target.result,
                        name: file.name
                    });
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    removeFrame(frameId) {
        this.frames = this.frames.filter(frame => frame.id !== frameId);
        this.updateUI();
    }

    updateUI() {
        this.updateTimeline();
        this.updateDuration();
        this.generateBtn.disabled = this.frames.length < 2;
    }

    updateTimeline() {
        if (this.frames.length === 0) {
            this.timeline.innerHTML = `
                <p>Añadí imágenes para ver la timeline</p>
            `;
            return;
        }

        const framesHtml = this.frames.map((frame, index) => `
            <div class="timeline-frame" 
                 draggable="true" 
                 data-frame-id="${frame.id}"
                 data-frame-index="${index}">
                <div class="frame-number">${index + 1}</div>
                <img src="${frame.dataUrl}" alt="${frame.name}">
                <button class="remove-btn" onclick="gifMaker.removeFrame('${frame.id}')">&times;</button>
            </div>
        `).join('');

        const controlsHtml = `
            <div class="timeline-controls">
                <button class="timeline-btn" onclick="gifMaker.reverseFrames()" ${this.frames.length < 2 ? 'disabled' : ''}>
                    🔄 Invertir orden
                </button>
                <button class="timeline-btn" onclick="gifMaker.clearAllFrames()" ${this.frames.length === 0 ? 'disabled' : ''}>
                    🗑️ Limpiar todo
                </button>
            </div>
        `;

        this.timeline.innerHTML = `
            <div class="timeline-frames">${framesHtml}</div>
            ${controlsHtml}
        `;

        // Add drag and drop event listeners
        this.addDragAndDropListeners();
    }

    addDragAndDropListeners() {
        const timelineFrames = this.timeline.querySelectorAll('.timeline-frame');

        timelineFrames.forEach(frame => {
            frame.addEventListener('dragstart', this.handleDragStart.bind(this));
            frame.addEventListener('dragover', this.handleDragOver.bind(this));
            frame.addEventListener('dragenter', this.handleDragEnter.bind(this));
            frame.addEventListener('dragleave', this.handleDragLeave.bind(this));
            frame.addEventListener('drop', this.handleDrop.bind(this));
            frame.addEventListener('dragend', this.handleDragEnd.bind(this));
        });
    }

    handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.frameId);
        e.target.classList.add('dragging');
        this.draggedFrameId = e.target.dataset.frameId;
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDragEnter(e) {
        e.preventDefault();
        if (e.target.classList.contains('timeline-frame') &&
            e.target.dataset.frameId !== this.draggedFrameId) {
            e.target.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        if (e.target.classList.contains('timeline-frame')) {
            e.target.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        const targetId = e.target.closest('.timeline-frame')?.dataset.frameId;

        if (draggedId && targetId && draggedId !== targetId) {
            this.reorderFrames(draggedId, targetId);
        }

        // Clean up drag states
        this.timeline.querySelectorAll('.timeline-frame').forEach(frame => {
            frame.classList.remove('drag-over', 'dragging');
        });
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.timeline.querySelectorAll('.timeline-frame').forEach(frame => {
            frame.classList.remove('drag-over');
        });
    }

    reorderFrames(draggedId, targetId) {
        const draggedIndex = this.frames.findIndex(frame => frame.id === draggedId);
        const targetIndex = this.frames.findIndex(frame => frame.id === targetId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
            // Remove dragged frame and insert at target position
            const [draggedFrame] = this.frames.splice(draggedIndex, 1);
            this.frames.splice(targetIndex, 0, draggedFrame);

            this.updateUI();
        }
    }

    reverseFrames() {
        this.frames.reverse();
        this.updateUI();
    }

    clearAllFrames() {
        if (confirm('¿Estás seguro de que querés eliminar todas las imágenes?')) {
            this.frames = [];
            this.updateUI();
            // Reset size info
            this.sizeInfo.textContent = 'Subí imágenes para detectar el tamaño automáticamente';
            this.sizeInfo.style.color = 'var(--text-muted)';
            this.customWidthInput.value = 400;
            this.customHeightInput.value = 400;
            this.gifWidth = 400;
            this.gifHeight = 400;
        }
    }

    updateDuration() {
        const totalMs = this.frames.length * this.frameDuration;
        this.totalDurationSpan.textContent = `${totalMs}ms`;
    }



    async generateGif() {
        if (this.frames.length < 2) return;

        this.showLoading();

        try {
            // Create GIF with balanced quality settings
            const gifOptions = {
                workers: 2,
                quality: 5, // Balanced quality (not too aggressive)
                width: this.gifWidth,
                height: this.gifHeight,
                dither: 'FloydSteinberg', // Use proper dithering for better colors
                repeat: 0 // Loop forever
            };

            // Only add transparency if the checkbox is checked
            if (this.transparentGreen) {
                gifOptions.transparent = 0x00FF00; // Green transparency
            }

            const gif = new GIF(gifOptions);

            for (const frame of this.frames) {
                const canvas = document.createElement('canvas');
                canvas.width = this.gifWidth;
                canvas.height = this.gifHeight;
                const ctx = canvas.getContext('2d');

                // Enable image smoothing for better color rendering
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Fill with white background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, this.gifWidth, this.gifHeight);

                const scale = Math.min(this.gifWidth / frame.image.width, this.gifHeight / frame.image.height);
                const scaledWidth = frame.image.width * scale;
                const scaledHeight = frame.image.height * scale;
                const x = (this.gifWidth - scaledWidth) / 2;
                const y = (this.gifHeight - scaledHeight) / 2;

                ctx.drawImage(frame.image, x, y, scaledWidth, scaledHeight);

                // Add frame with proper delay
                gif.addFrame(canvas, { delay: this.frameDuration });
            }

            gif.on('finished', (blob) => {
                this.showGifPreview(blob);
            });

            gif.on('progress', (p) => {
                this.updateProgress(Math.round(p * 100));
            });

            gif.render();

        } catch (error) {
            console.error('Error generando GIF:', error);
            this.showError('Error generando GIF. Asegurate de tener al menos dos imágenes..');
        }
    }

    updateProgress(percent) {
        this.previewContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <span>GenerandoGIF... ${percent}%</span>
                <div style="width: 200px; height: 10px; background: var(--border-color); border-radius: 5px; margin-top: 10px;">
                    <div style="width: ${percent}%; height: 100%; background: var(--button-bg); border-radius: 5px; transition: width 0.3s;"></div>
                </div>
            </div>
        `;
    }

    showGifPreview(blob) {
        const url = URL.createObjectURL(blob);

        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Generated GIF';
        img.style.cssText = `
            max-width: 100%;
            max-height: 400px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            display: block;
            margin: 0 auto;
        `;

        const downloadBtn = document.createElement('a');
        downloadBtn.href = url;
        downloadBtn.download = 'gifChoto.gif';
        downloadBtn.textContent = '⬇️ Descargar GIF';
        downloadBtn.style.cssText = `
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: var(--success-bg);
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            font-size: 16px;
        `;

        const info = document.createElement('p');
        info.textContent = `✅ GIF creado correctamente! Dimensiones: ${this.gifWidth}x${this.gifHeight}px | Tamaño: ${(blob.size / 1024).toFixed(1)}KB`;
        info.style.cssText = `
            margin-top: 15px;
            color: var(--success-bg);
            font-weight: bold;
            text-align: center;
        `;

        const newBtn = document.createElement('button');
        newBtn.textContent = '🔄 Hacer otro GIF';
        newBtn.style.cssText = `
            display: inline-block;
            margin: 15px 0 0 15px;
            padding: 12px 24px;
            background: var(--button-bg);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        `;
        newBtn.onclick = () => {
            this.frames = [];
            this.updateUI();
            this.previewContainer.innerHTML = '<p>Tu GIF va a aparecer acá.</p>';
            // Reset size info
            this.sizeInfo.textContent = 'Subí imágenes para detectar el tamaño automáticamente';
            this.sizeInfo.style.color = 'var(--text-muted)';
            this.customWidthInput.value = 400;
            this.customHeightInput.value = 400;
            this.gifWidth = 400;
            this.gifHeight = 400;
        };

        this.previewContainer.innerHTML = '';
        this.previewContainer.appendChild(img);

        const buttonContainer = document.createElement('div');
        buttonContainer.style.textAlign = 'center';
        buttonContainer.appendChild(downloadBtn);
        buttonContainer.appendChild(newBtn);

        this.previewContainer.appendChild(buttonContainer);
        this.previewContainer.appendChild(info);
    }

    showLoading() {
        this.previewContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <span>Preparando para generar GIF...</span>
            </div>
        `;
    }

    showError(message) {
        this.previewContainer.innerHTML = `
            <p style="color: var(--error-color); text-align: center; padding: 20px;">
                ❌ ${message}
            </p>
        `;
    }
}

const gifMaker = new GifMaker();