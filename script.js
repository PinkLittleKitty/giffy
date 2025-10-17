class GifMaker {
    constructor() {
        this.frames = [];
        this.frameDuration = 500;
        
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.frameDurationInput = document.getElementById('frameDuration');
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
        
        this.generateBtn.addEventListener('click', () => this.generateGif());
    }

    async processFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        for (const file of imageFiles) {
            try {
                const frame = await this.createFrame(file);
                this.frames.push(frame);
            } catch (error) {
                console.error('Error processing file:', file.name, error);
            }
        }
        
        this.updateUI();
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
            this.timeline.innerHTML = '<p>Añadí imágenes para ver la timeline</p>';
            return;
        }

        const framesHtml = this.frames.map((frame, index) => `
            <div class="timeline-frame">
                <img src="${frame.dataUrl}" alt="${frame.name}">
                <button class="remove-btn" onclick="gifMaker.removeFrame('${frame.id}')">&times;</button>
            </div>
        `).join('');

        this.timeline.innerHTML = framesHtml;
    }

    updateDuration() {
        const totalMs = this.frames.length * this.frameDuration;
        this.totalDurationSpan.textContent = `${totalMs}ms`;
    }

    async generateGif() {
        if (this.frames.length < 2) return;

        this.showLoading();

        try {
            const gif = new GIF({
                workers: 2,
                quality: 10,
                width: 400,
                height: 400,
                transparent: 0x00FF00
            });

            for (const frame of this.frames) {
                const canvas = document.createElement('canvas');
                canvas.width = 400;
                canvas.height = 400;
                const ctx = canvas.getContext('2d');
                
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, 400, 400);
                
                const scale = Math.min(400 / frame.image.width, 400 / frame.image.height);
                const scaledWidth = frame.image.width * scale;
                const scaledHeight = frame.image.height * scale;
                const x = (400 - scaledWidth) / 2;
                const y = (400 - scaledHeight) / 2;
                
                ctx.drawImage(frame.image, x, y, scaledWidth, scaledHeight);
                
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
        info.textContent = `✅ GIF creado correctamente! Tamaño: ${(blob.size / 1024).toFixed(1)}KB`;
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