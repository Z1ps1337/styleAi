// upload.js
class FileUploader {
    constructor() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.selectFilesBtn = document.getElementById('selectFilesBtn');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.progressFill = document.querySelector('.progress-fill');
        this.previewGrid = document.getElementById('previewGrid');
        this.uploadedPreview = document.getElementById('uploadedPreview');
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        this.selectFilesBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        this.handleFiles(files);
    }

    handleFiles(files) {
        if (files.length === 0) return;

        this.showProgress();
        this.showPreviews(files);
        this.simulateUpload(files);
    }

    showPreviews(files) {
        this.previewGrid.innerHTML = '';
        
        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <div class="preview-image" style="background-image: url('${e.target.result}')"></div>
                    <div class="preview-name">${file.name}</div>
                `;
                this.previewGrid.appendChild(previewItem);
            };
            
            reader.readAsDataURL(file);
        });
        
        this.uploadedPreview.style.display = 'block';
    }

    showProgress() {
        this.uploadProgress.style.display = 'block';
        this.progressFill.style.width = '0%';
    }

    simulateUpload(files) {
        let progress = 0;
        const totalFiles = files.length;

        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                this.processFiles(files);
            }
            this.progressFill.style.width = `${progress}%`;
        }, 200);
    }

    async processFiles(files) {
        const newItems = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                const item = await this.analyzeImage(file);
                newItems.push(item);
                
            } catch (error) {
                console.error('Error processing file:', error);
            }
        }
        
        this.completeUpload(newItems);
    }

    analyzeImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imageUrl = e.target.result;
                
                setTimeout(() => {
                    const category = this.classifyClothingItem(file.name);
                    const name = this.generateItemName(category, file.name);

                    resolve({
                        id: Date.now() + Math.random(),
                        name: name,
                        category: category,
                        image: imageUrl,
                        filename: file.name,
                        uploadedAt: new Date().toISOString(),
                        rating: Math.floor(Math.random() * 5) + 1,
                        confidence: (Math.random() * 0.3 + 0.7).toFixed(2)
                    });
                }, 800);
            };
            
            reader.readAsDataURL(file);
        });
    }

    classifyClothingItem(filename) {
        const name = filename.toLowerCase();
        
        if (this.isTopClothing(name)) return 'tops';
        if (this.isBottomClothing(name)) return 'bottoms';
        if (this.isShoes(name)) return 'shoes';
        if (this.isAccessory(name)) return 'accessories';
        
        const categories = ['tops', 'bottoms', 'shoes', 'accessories'];
        return categories[Math.floor(Math.random() * categories.length)];
    }

    isTopClothing(name) {
        const topKeywords = [
            'футболка', 'рубашка', 'свитер', 'худи', 'блузка', 'топ', 'кофта',
            'кофточка', 'водолазка', 'толстовка', 'джемпер', 'кардиган',
            'бомбер', 'куртка', 'пальто', 'пиджак', 'жилет', 'майка', 'боди',
            'тенниска', 'лонгслив', 'футбол', 'рубаха', 'свитшот'
        ];
        return topKeywords.some(keyword => name.includes(keyword));
    }

    isBottomClothing(name) {
        const bottomKeywords = [
            'джинсы', 'брюки', 'шорты', 'юбка', 'леггинсы', 'кюлоты',
            'штаны', 'бриджи', 'капри', 'брюкины', 'джинс', 'лосины',
            'бермуды', 'шорты', 'юбка-карандаш', 'юбка-солнце'
        ];
        return bottomKeywords.some(keyword => name.includes(keyword));
    }

    isShoes(name) {
        const shoesKeywords = [
            'кроссовки', 'туфли', 'ботинки', 'сандали', 'кеды', 'лоферы',
            'сапоги', 'босоножки', 'мокасины', 'угги', 'слипоны', 'челси',
            'балетки', 'оксфорды', 'монки', 'эспадрильи'
        ];
        return shoesKeywords.some(keyword => name.includes(keyword));
    }

    isAccessory(name) {
        const accessoryKeywords = [
            'сумка', 'ремень', 'шарф', 'шапка', 'бижутерия', 'очки',
            'колье', 'браслет', 'серьги', 'кольцо', 'перчатки', 'зонт',
            'галстук', 'бабочка', 'платок', 'рюкзак', 'клатч', 'кошелек',
            'колье', 'брошь', 'заколка', 'ободок'
        ];
        return accessoryKeywords.some(keyword => name.includes(keyword));
    }

    generateItemName(category, filename) {
        const names = {
            tops: [
                'Классическая рубашка', 'Уютный свитер', 'Стильная футболка', 
                'Комфортное худи', 'Элегантная блузка', 'Модный топ',
                'Теплая кофта', 'Спортивная майка', 'Деловой пиджак',
                'Универсальная футболка', 'Свитшот с капюшоном'
            ],
            bottoms: [
                'Универсальные джинсы', 'Классические брюки', 'Спортивные шорты',
                'Элегантная юбка', 'Удобные леггинсы', 'Стильные кюлоты',
                'Комфортные штаны', 'Модные бриджи', 'Юбка-карандаш'
            ],
            shoes: [
                'Спортивные кроссовки', 'Классические туфли', 'Утепленные ботинки',
                'Летние сандали', 'Повседневные кеды', 'Элегантные лоферы',
                'Стильные сапоги', 'Удобные босоножки', 'Кожаные кроссовки'
            ],
            accessories: [
                'Стильная сумка', 'Кожаный ремень', 'Теплый шарф',
                'Модная шапка', 'Элегантная бижутерия', 'Солнечные очки',
                'Кожаный рюкзак', 'Вечерний клатч', 'Шерстяной шарф'
            ]
        };

        const categoryNames = names[category];
        return categoryNames[Math.floor(Math.random() * categoryNames.length)];
    }

    completeUpload(newItems) {
        this.uploadProgress.style.display = 'none';
        this.progressFill.style.width = '0%';
        
        if (newItems.length > 0) {
            if (window.styleAI) {
                window.styleAI.addToWardrobe(newItems);
            }
            
            this.showNotification(`Успешно добавлено ${newItems.length} вещей в гардероб`);
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            font-weight: 500;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Инициализация загрузчика
document.addEventListener('DOMContentLoaded', () => {
    new FileUploader();
});