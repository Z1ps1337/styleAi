// app.js
class StyleAI {
    constructor() {
        this.currentStep = 1;
        this.selectedOccasion = null;
        this.userWardrobe = [];
        this.generatedOutfits = [];
        this.favorites = [];
        this.calendar = {};
        this.accountId = 'c6a9228489d872280b991ce0474577af';
        this.apiToken = 'BUC4CT0OYFfUmvEeLXiv5qjAyOP8npiBBezUa9Lc';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadFromStorage();
        this.updateSetupSteps();
        this.displayWardrobeItems();
    }

    bindEvents() {
        // Навигация по шагам
        document.getElementById('nextBtn')?.addEventListener('click', () => this.nextStep());
        document.getElementById('prevBtn')?.addEventListener('click', () => this.prevStep());
        
        // Выбор мероприятия
        document.querySelectorAll('.occasion-card').forEach(card => {
            card.addEventListener('click', (e) => this.selectOccasion(e.currentTarget));
        });

        // Кнопка начала
        document.getElementById('startBtn')?.addEventListener('click', () => {
            document.getElementById('quickSetup').scrollIntoView({ behavior: 'smooth' });
        });

        // Фильтры гардероба
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterWardrobe(e.currentTarget));
        });

        // Модальное окно
        document.querySelector('.close-modal')?.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('outfitModal')) {
                this.closeModal();
            }
        });

        // Кнопки управления
        document.getElementById('regenerateBtn')?.addEventListener('click', () => {
            this.generateOutfits();
            this.showNotification('Генерируем новые образы...');
        });

        document.getElementById('findAlternativesBtn')?.addEventListener('click', () => {
            this.showShoppingSuggestions();
            document.getElementById('aiSuggestions').style.display = 'block';
            this.showNotification('Ищем альтернативы в магазинах...');
        });

        // Кнопки авторизации
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            this.showNotification('Функция входа будет доступна скоро');
        });

        document.getElementById('registerBtn')?.addEventListener('click', () => {
            this.showNotification('Функция регистрации будет доступна скоро');
        });
    }

    nextStep() {
        if (this.currentStep === 1) {
            if (this.userWardrobe.length === 0) {
                this.showNotification('Сначала загрузите несколько вещей в гардероб');
                return;
            }
            if (!this.selectedOccasion) {
                this.selectedOccasion = 'casual';
                document.querySelector('[data-occasion="casual"]').classList.add('selected');
            }
        }

        if (this.currentStep === 2 && !this.selectedOccasion) {
            this.showNotification('Пожалуйста, выберите мероприятие');
            return;
        }

        if (this.currentStep < 3) {
            this.currentStep++;
            this.updateSetupSteps();
            
            if (this.currentStep === 3) {
                this.generateOutfits();
            }
        } else {
            this.showNotification('Отлично! Ваши образы готовы');
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateSetupSteps();
        }
    }

    updateSetupSteps() {
        document.querySelectorAll('.setup-step').forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.step) === this.currentStep) {
                step.classList.add('active');
            }
        });

        document.querySelectorAll('.setup-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`step${this.currentStep}-content`).classList.add('active');

        document.getElementById('prevBtn').disabled = this.currentStep === 1;
        
        if (this.currentStep === 3) {
            document.getElementById('nextBtn').textContent = 'Завершить';
        } else {
            document.getElementById('nextBtn').textContent = 'Далее';
        }

        if (this.currentStep === 1 && this.userWardrobe.length > 0) {
            document.getElementById('nextBtn').disabled = false;
        }
    }

    selectOccasion(card) {
        document.querySelectorAll('.occasion-card').forEach(c => {
            c.classList.remove('selected');
        });
        
        card.classList.add('selected');
        this.selectedOccasion = card.dataset.occasion;
        
        document.getElementById('nextBtn').disabled = false;
    }

    generateOutfits() {
        const outfitsGrid = document.getElementById('outfitsGrid');
        const suggestionsSection = document.getElementById('aiSuggestions');
        
        outfitsGrid.innerHTML = '';
        
        if (this.userWardrobe.length === 0) {
            outfitsGrid.innerHTML = `
                <div class="no-outfits" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <h4 style="margin-bottom: 1rem; color: var(--gray-700);">Добавьте вещи в гардероб</h4>
                    <p style="margin-bottom: 2rem; color: var(--gray-600);">Загрузите фотографии своей одежды, чтобы ИИ мог подобрать образы</p>
                    <button class="btn-primary" onclick="styleAI.scrollToStep(1)">Загрузить одежду</button>
                </div>
            `;
            return;
        }

        this.generatedOutfits = this.createSmartOutfits();
        
        if (this.generatedOutfits.length === 0) {
            outfitsGrid.innerHTML = `
                <div class="no-outfits" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <h4 style="margin-bottom: 1rem; color: var(--gray-700);">Недостаточно вещей для создания образов</h4>
                    <p style="margin-bottom: 2rem; color: var(--gray-600);">Добавьте больше вещей разных категорий для лучших комбинаций</p>
                    <button class="btn-primary" onclick="styleAI.scrollToStep(1)">Добавить одежду</button>
                </div>
            `;
            return;
        }

        outfitsGrid.innerHTML = this.generatedOutfits.map((outfit, index) => `
            <div class="outfit-result" data-outfit-index="${index}">
                <div class="outfit-image ${outfit.previewImage ? 'has-preview' : 'combined-preview'}" 
                     style="${outfit.previewImage ? `background-image: url('${outfit.previewImage}')` : ''}">
                    ${!outfit.previewImage ? this.generateCombinedPreview(outfit) : ''}
                </div>
                <div class="outfit-items">
                    <h4>${outfit.name}</h4>
                    <div class="outfit-item-list">
                        ${outfit.items.map(item => `
                            <div class="item-with-image" data-item-id="${item.id}">
                                <div class="item-image-preview ${item.image ? 'has-photo' : 'no-image'}" 
                                     style="${item.image ? `background-image: url('${item.image}')` : ''}">
                                    ${!item.image ? 'Фото' : ''}
                                </div>
                                <span>${item.name}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="outfit-actions">
                    <button class="btn-outline small" onclick="styleAI.addToFavorites(${index})">В избранное</button>
                    <button class="btn-primary small" onclick="styleAI.viewOutfitDetails(${index})">Посмотреть образ</button>
                </div>
            </div>
        `).join('');

        this.addItemViewHandlers();

        this.showShoppingSuggestions();
        suggestionsSection.style.display = 'block';
    }

    createSmartOutfits() {
        const tops = this.userWardrobe.filter(item => item.category === 'tops');
        const bottoms = this.userWardrobe.filter(item => item.category === 'bottoms');
        const shoes = this.userWardrobe.filter(item => item.category === 'shoes');
        const accessories = this.userWardrobe.filter(item => item.category === 'accessories');

        const outfits = [];
        
        if (tops.length > 0 && bottoms.length > 0) {
            const maxCombinations = Math.min(3, tops.length, bottoms.length);
            
            for (let i = 0; i < maxCombinations; i++) {
                const top = tops[i % tops.length];
                const bottom = bottoms[i % bottoms.length];
                
                const outfitItems = [top, bottom];
                
                if (shoes.length > 0) {
                    const shoe = shoes[i % shoes.length];
                    outfitItems.push(shoe);
                }
                
                if (accessories.length > 0) {
                    const accessory = accessories[i % accessories.length];
                    outfitItems.push(accessory);
                }

                outfits.push({
                    name: this.generateOutfitName(top, bottom, this.selectedOccasion),
                    items: outfitItems,
                    occasion: this.selectedOccasion,
                    rating: Math.floor(Math.random() * 2) + 4,
                    previewImage: top.image || bottom.image || (shoes.length > 0 ? shoes[0].image : null)
                });
            }
        }

        if (outfits.length === 0) {
            if (tops.length > 0) {
                tops.slice(0, 2).forEach(top => {
                    outfits.push({
                        name: 'Образ с ' + top.name,
                        items: [top],
                        occasion: this.selectedOccasion,
                        rating: 4,
                        previewImage: top.image
                    });
                });
            } else if (bottoms.length > 0) {
                bottoms.slice(0, 2).forEach(bottom => {
                    outfits.push({
                        name: 'Образ с ' + bottom.name,
                        items: [bottom],
                        occasion: this.selectedOccasion,
                        rating: 4,
                        previewImage: bottom.image
                    });
                });
            }
        }

        return outfits;
    }

    generateOutfitName(top, bottom, occasion) {
        const occasionNames = {
            office: 'Деловой',
            casual: 'Повседневный',
            date: 'Романтический',
            event: 'Торжественный',
            sport: 'Спортивный',
            travel: 'Для путешествия'
        };

        return `${occasionNames[occasion] || 'Универсальный'} образ: ${top.name} + ${bottom.name}`;
    }

    generateCombinedPreview(outfit) {
        return outfit.items.map(item => `
            <div class="preview-layer" style="background-image: url('${item.image || ''}'); background-size: contain; background-position: center; width: 100%; height: 100%; position: absolute; opacity: 0.8;">
            </div>
        `).join('');
    }

    addItemViewHandlers() {
        document.querySelectorAll('.item-with-image').forEach(item => {
            item.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.itemId;
                this.viewItemDetails(itemId);
            });
        });
    }

    viewOutfitDetails(outfitIndex) {
        const outfit = this.generatedOutfits[outfitIndex];
        const today = new Date().toISOString().split('T')[0];
        const calendar = JSON.parse(localStorage.getItem('styleai-calendar') || '{}');
        
        calendar[today] = outfit;
        localStorage.setItem('styleai-calendar', JSON.stringify(calendar));
        
        this.showNotification('Отлично! Запомнили ваш выбор на сегодня');
        this.closeModal();
    }

    removeItem(itemId) {
        this.userWardrobe = this.userWardrobe.filter(item => item.id !== itemId);
        this.saveWardrobeToStorage();
        this.displayWardrobeItems();
        this.closeModal();
        this.showNotification('Вещь удалена из гардероба');
        
        if (this.currentStep === 3) {
            this.generateOutfits();
        }
    }

    filterWardrobe(button) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const category = button.dataset.category;
        this.displayWardrobeItems(category);
    }

    displayWardrobeItems(category = 'all') {
        const wardrobeGrid = document.getElementById('wardrobeGrid');
        const filteredItems = category === 'all' 
            ? this.userWardrobe 
            : this.userWardrobe.filter(item => item.category === category);

        if (filteredItems.length === 0) {
            wardrobeGrid.innerHTML = `
                <div class="no-items" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--gray-600);">
                    <p>${category === 'all' ? 'Пока нет вещей в гардеробе' : 'Пока нет вещей в этой категории'}</p>
                    ${category === 'all' ? '<button class="btn-primary" onclick="styleAI.scrollToStep(1)" style="margin-top: 1rem;">Добавить одежду</button>' : ''}
                </div>
            `;
            return;
        }

        wardrobeGrid.innerHTML = filteredItems.map(item => `
            <div class="wardrobe-item" onclick="styleAI.viewItemDetails('${item.id}')">
                <div class="wardrobe-item-image ${item.image ? 'has-photo' : ''}" 
                     style="${item.image ? `background-image: url('${item.image}')` : ''}">
                </div>
                <div class="wardrobe-item-info">
                    <h4>${item.name}</h4>
                    <div class="wardrobe-item-type">${item.category}</div>
                </div>
            </div>
        `).join('');
    }

    showShoppingSuggestions() {
        const suggestionsGrid = document.getElementById('suggestionsGrid');
        
        const missingCategories = this.analyzeMissingCategories();
        
        const suggestions = this.generateSmartSuggestions(missingCategories);

        suggestionsGrid.innerHTML = suggestions.map(item => `
            <div class="suggestion-item">
                <div class="suggestion-image" style="background-image: url('${item.image}')"></div>
                <div class="suggestion-info">
                    <h5>${item.name}</h5>
                    <div class="suggestion-price">${item.price}</div>
                    <div class="suggestion-store">${item.store}</div>
                    <a href="${item.link}" class="suggestion-link" target="_blank" onclick="event.preventDefault(); styleAI.showNotification('Переход в магазин: ${item.store}')">Посмотреть в магазине</a>
                </div>
            </div>
        `).join('');
    }

    analyzeMissingCategories() {
        const categories = {
            tops: this.userWardrobe.filter(item => item.category === 'tops').length,
            bottoms: this.userWardrobe.filter(item => item.category === 'bottoms').length,
            shoes: this.userWardrobe.filter(item => item.category === 'shoes').length,
            accessories: this.userWardrobe.filter(item => item.category === 'accessories').length
        };

        const missing = [];
        if (categories.tops === 0) missing.push('tops');
        if (categories.bottoms === 0) missing.push('bottoms');
        if (categories.shoes === 0) missing.push('shoes');
        if (categories.accessories === 0) missing.push('accessories');

        if (categories.tops > 0 && categories.bottoms > 0 && missing.length === 0) {
            missing.push('shoes', 'accessories');
        }

        return missing;
    }

    generateSmartSuggestions(missingCategories) {
        const stores = [
            { name: 'Wildberries', baseUrl: 'https://www.wildberries.ru/catalog/0/search.aspx?search=' },
            { name: 'Ozon', baseUrl: 'https://www.ozon.ru/search/?text=' },
            { name: 'Bershka', baseUrl: 'https://www.bershka.com/ru/poisk?q=' },
            { name: 'TVOE', baseUrl: 'https://tvoe.ru/search/?q=' },
            { name: 'ECRU', baseUrl: 'https://ecru.ru/search/?q=' }
        ];

        const allSuggestions = {
            tops: [
                { 
                    name: 'Универсальная белая футболка', 
                    price: '1 299 ₽', 
                    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop'
                },
                { 
                    name: 'Классическая рубашка', 
                    price: '2 499 ₽', 
                    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=300&fit=crop'
                }
            ],
            bottoms: [
                { 
                    name: 'Синие джинсы скинни', 
                    price: '3 999 ₽', 
                    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop'
                },
                { 
                    name: 'Классические брюки чинос', 
                    price: '2 799 ₽', 
                    image: 'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=300&h=300&fit=crop'
                }
            ],
            shoes: [
                { 
                    name: 'Белые кожаные кроссовки', 
                    price: '5 999 ₽', 
                    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=300&fit=crop'
                },
                { 
                    name: 'Коричневые лоферы', 
                    price: '4 499 ₽', 
                    image: 'https://images.unsplash.com/photo-1560769684-5507c57a2bd4?w=300&h=300&fit=crop'
                }
            ],
            accessories: [
                { 
                    name: 'Кожаный ремень', 
                    price: '1 599 ₽', 
                    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop'
                },
                { 
                    name: 'Шерстяной шарф', 
                    price: '2 299 ₽', 
                    image: 'https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=300&h=300&fit=crop'
                }
            ]
        };

        if (missingCategories.length === 0) {
            missingCategories = ['tops', 'bottoms', 'shoes'];
        }

        const suggestions = [];
        missingCategories.forEach(category => {
            if (allSuggestions[category]) {
                suggestions.push(...allSuggestions[category].slice(0, 1));
            }
        });

        while (suggestions.length < 4) {
            const randomCategory = Object.keys(allSuggestions)[Math.floor(Math.random() * Object.keys(allSuggestions).length)];
            const randomSuggestion = allSuggestions[randomCategory][Math.floor(Math.random() * allSuggestions[randomCategory].length)];
            if (!suggestions.find(s => s.name === randomSuggestion.name)) {
                suggestions.push(randomSuggestion);
            }
        }

        return suggestions.map(suggestion => {
            const store = stores[Math.floor(Math.random() * stores.length)];
            suggestion.store = store.name;
            suggestion.link = store.baseUrl + encodeURIComponent(suggestion.name);
            return suggestion;
        });
    }

    loadFromStorage() {
        const saved = localStorage.getItem('styleai-wardrobe');
        if (saved) {
            this.userWardrobe = JSON.parse(saved);
        }
    }

    saveToStorage() {
        localStorage.setItem('styleai-wardrobe', JSON.stringify(this.userWardrobe));
    }

    closeModal() {
        document.getElementById('outfitModal').style.display = 'none';
    }

    scrollToStep(step) {
        this.currentStep = step;
        this.updateSetupSteps();
        document.getElementById('quickSetup').scrollIntoView({ behavior: 'smooth' });
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

    addToWardrobe(newItems) {
        this.userWardrobe.push(...newItems);
        this.saveToStorage();
        this.displayWardrobeItems();
        
        if (this.currentStep === 1) {
            document.getElementById('nextBtn').disabled = false;
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.styleAI = new StyleAI();
    
    // Плавная прокрутка для навигации
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});