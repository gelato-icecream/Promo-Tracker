// Data Management
let shops = JSON.parse(localStorage.getItem('promo_shops')) || [];
let wallets = JSON.parse(localStorage.getItem('promo_wallets')) || [];
let currentShopId = null;
let currentTab = 'to-buy';

const saveToLocal = () => {
    localStorage.setItem('promo_shops', JSON.stringify(shops));
    localStorage.setItem('promo_wallets', JSON.stringify(wallets));
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const formatMoney = (amount) => {
    return '$' + parseFloat(amount).toFixed(2);
};

// UI Controller
const ui = {
    showScreen: (screenId) => {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        
        // Update Bottom Nav
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const navItem = document.getElementById('nav-' + screenId);
        if (navItem) navItem.classList.add('active');

        if (screenId === 'dashboard-screen') {
            app.renderDashboard();
            currentShopId = null;
        } else if (screenId === 'wallet-screen') {
            app.renderWallet();
        }
    },
    
    showModal: (modalId) => {
        document.getElementById(modalId).classList.add('active');
    },
    
    hideModal: (modalId) => {
        document.getElementById(modalId).classList.remove('active');
    },

    switchTab: (tabId) => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        const selectedTab = document.getElementById(`tab-${tabId}`);
        if (selectedTab) selectedTab.classList.add('active');
        currentTab = tabId;
        app.renderItems();
    }
};

// App Logic
const app = {
    init: () => {
        const theme = localStorage.getItem('promo_theme');
        if (theme === 'light') {
            document.body.classList.add('light-mode');
            app.updateThemeIcon('light');
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                metaThemeColor.setAttribute('content', '#f1f5f9');
            }
        } else {
            app.updateThemeIcon('dark');
        }
        
        app.renderDashboard();
        app.renderWallet();
    },

    toggleTheme: () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('promo_theme', isLight ? 'light' : 'dark');
        app.updateThemeIcon(isLight ? 'light' : 'dark');
        
        // Update theme color for mobile status bar
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', isLight ? '#f1f5f9' : '#0f172a');
        }
    },

    updateThemeIcon: (theme) => {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        
        if (theme === 'light') {
            // Moon Icon
            btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>`;
        } else {
            // Sun Icon
            btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>`;
        }
    },

    // --- Dashboard ---
    renderDashboard: () => {
        const list = document.getElementById('shops-list');
        list.innerHTML = '';
        
        if (shops.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                    <p>No shops yet. Add one to start tracking!</p>
                </div>`;
            return;
        }

        shops.forEach(shop => {
            const spent = shop.items.filter(i => i.bought).reduce((acc, i) => acc + i.actualPrice, 0);
            
            const card = document.createElement('div');
            card.className = 'card';
            card.onclick = () => app.openShop(shop.id);
            card.innerHTML = `
                <div class="card-info">
                    <h3>${shop.name}</h3>
                    <p>${shop.items.length} items • ${formatMoney(spent)} spent</p>
                </div>
                <div class="card-target">
                    ${formatMoney(shop.target)}
                </div>
            `;
            list.appendChild(card);
        });
    },

    handleAddShop: (e) => {
        e.preventDefault();
        const name = document.getElementById('shop-name').value;
        const target = parseFloat(document.getElementById('shop-target').value);
        
        shops.push({
            id: generateId(),
            name,
            target,
            items: []
        });
        
        saveToLocal();
        e.target.reset();
        ui.hideModal('add-shop-modal');
        app.renderDashboard();
    },

    // --- Shop Detail ---
    openShop: (shopId) => {
        currentShopId = shopId;
        currentTab = 'to-buy';
        // Reset tabs visually
        document.querySelectorAll('.tab').forEach((t) => {
            if (t.id === 'tab-to-buy') t.classList.add('active');
            else t.classList.remove('active');
        });

        ui.showScreen('shop-screen');
        app.updateShopHeader();
        app.renderItems();
        app.updateProgress();
    },

    deleteCurrentShop: () => {
        if (confirm('Are you sure you want to delete this shop?')) {
            shops = shops.filter(s => s.id !== currentShopId);
            saveToLocal();
            ui.showScreen('dashboard-screen');
        }
    },

    resetAll: () => {
        if (confirm('Are you sure you want to delete all shops and items? This action cannot be undone.')) {
            shops = [];
            saveToLocal();
            app.renderDashboard();
        }
    },

    updateShopHeader: () => {
        const shop = shops.find(s => s.id === currentShopId);
        if (!shop) return;
        document.getElementById('current-shop-name').innerText = shop.name;
        document.getElementById('current-shop-target').innerText = `Target: ${formatMoney(shop.target)}`;
    },

    updateProgress: () => {
        const shop = shops.find(s => s.id === currentShopId);
        if (!shop) return;

        const estTotal = shop.items.reduce((acc, i) => acc + (i.bought ? i.actualPrice : i.estPrice), 0);
        const spent = shop.items.filter(i => i.bought).reduce((acc, i) => acc + i.actualPrice, 0);
        const remaining = shop.target - spent;

        document.getElementById('spent-amount').innerText = formatMoney(spent);
        document.getElementById('est-total').innerText = formatMoney(estTotal);
        
        const remEl = document.getElementById('remaining-amount');
        remEl.innerText = remaining < 0 ? `+${formatMoney(Math.abs(remaining))}` : formatMoney(remaining);
        remEl.style.color = remaining < 0 ? 'var(--danger)' : 'var(--accent)';

        // Update Ring
        const ring = document.querySelector('.progress-ring-fill');
        const circumference = 314; // 2 * pi * 50
        const percent = Math.min((spent / shop.target) * 100, 100);
        const offset = circumference - (percent / 100) * circumference;
        ring.style.strokeDashoffset = offset;
    },

    // --- Items ---
    renderItems: () => {
        const shop = shops.find(s => s.id === currentShopId);
        if (!shop) return;

        const list = document.getElementById('items-list');
        list.innerHTML = '';

        let filteredItems = shop.items;
        let tabLabel = 'All Items';
        let tabTotal = shop.items.reduce((acc, i) => acc + (i.bought ? i.actualPrice : i.estPrice), 0);

        if (currentTab === 'to-buy') {
            filteredItems = shop.items.filter(i => !i.bought);
            tabLabel = 'To Buy Items';
            tabTotal = filteredItems.reduce((acc, i) => acc + i.estPrice, 0);
        } else if (currentTab === 'bought') {
            filteredItems = shop.items.filter(i => i.bought);
            tabLabel = 'Bought Items';
            tabTotal = filteredItems.reduce((acc, i) => acc + i.actualPrice, 0);
        }

        const labelEl = document.getElementById('active-tab-label');
        const totalEl = document.getElementById('active-tab-total');
        if (labelEl) labelEl.innerText = tabLabel;
        if (totalEl) totalEl.innerText = formatMoney(tabTotal);

        if (filteredItems.length === 0) {
            list.innerHTML = `<div class="empty-state"><p>No items in this list.</p></div>`;
            return;
        }

        filteredItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'item';
            
            const checkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            
            el.innerHTML = `
                <div class="item-left">
                    <div class="checkbox ${item.bought ? 'checked' : ''}" onclick="app.toggleItemStatus('${item.id}')">
                        ${checkIcon}
                    </div>
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <p>${item.bought ? 'Actual: ' + formatMoney(item.actualPrice) : 'Est: ' + formatMoney(item.estPrice)}</p>
                    </div>
                </div>
                <div class="item-actions">
                    <span class="item-price">${item.bought ? formatMoney(item.actualPrice) : formatMoney(item.estPrice)}</span>
                    <button class="icon-btn text-danger" onclick="app.deleteItem('${item.id}')">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </div>
            `;
            list.appendChild(el);
        });
    },

    openAddItemModal: () => {
        const isBought = currentTab === 'bought';
        document.getElementById('add-item-title').innerText = isBought ? 'Add Bought Item' : 'Add Item to Buy';
        
        const estGroup = document.getElementById('est-price-group');
        const actGroup = document.getElementById('act-price-group');
        const estInput = document.getElementById('item-est-price');
        const actInput = document.getElementById('item-new-actual-price');
        
        if (isBought) {
            estGroup.style.display = 'none';
            actGroup.style.display = 'block';
            estInput.required = false;
            actInput.required = true;
            document.getElementById('item-new-card').value = '';
        } else {
            estGroup.style.display = 'block';
            actGroup.style.display = 'none';
            estInput.required = true;
            actInput.required = false;
        }

        ui.showModal('add-item-modal');
    },

    handleAddItem: (e) => {
        e.preventDefault();
        const shop = shops.find(s => s.id === currentShopId);
        if (!shop) return;

        const name = document.getElementById('item-name').value;
        const isBought = currentTab === 'bought';
        
        let estPrice = 0;
        let actualPrice = 0;

        if (isBought) {
            actualPrice = parseFloat(document.getElementById('item-new-actual-price').value);
            estPrice = actualPrice; // Fallback so estimated calculations still work
            
            // Deduct from card if selected
            const cardId = document.getElementById('item-new-card').value;
            if (cardId) {
                const card = wallets.find(w => w.id === cardId);
                if (card) {
                    card.balance -= actualPrice;
                    app.renderWallet();
                }
            }
        } else {
            estPrice = parseFloat(document.getElementById('item-est-price').value);
        }

        shop.items.push({
            id: generateId(),
            name,
            estPrice,
            bought: isBought,
            actualPrice: actualPrice
        });

        saveToLocal();
        e.target.reset();
        ui.hideModal('add-item-modal');
        app.renderItems();
        app.updateProgress();
    },

    toggleItemStatus: (itemId) => {
        const shop = shops.find(s => s.id === currentShopId);
        const item = shop.items.find(i => i.id === itemId);
        
        if (!item.bought) {
            // Ask for actual price
            document.getElementById('buy-item-id').value = itemId;
            document.getElementById('item-actual-price').value = item.estPrice; // default to est
            document.getElementById('item-actual-card').value = '';
            ui.showModal('actual-price-modal');
        } else {
            // Move back to "To Buy"
            item.bought = false;
            saveToLocal();
            app.renderItems();
            app.updateProgress();
        }
    },

    handleMarkBought: (e) => {
        e.preventDefault();
        const itemId = document.getElementById('buy-item-id').value;
        const actualPrice = parseFloat(document.getElementById('item-actual-price').value);
        
        const shop = shops.find(s => s.id === currentShopId);
        const item = shop.items.find(i => i.id === itemId);
        
        item.bought = true;
        item.actualPrice = actualPrice;
        
        // Deduct from card if selected
        const cardId = document.getElementById('item-actual-card').value;
        if (cardId) {
            const card = wallets.find(w => w.id === cardId);
            if (card) {
                card.balance -= actualPrice;
                app.renderWallet();
            }
        }
        
        saveToLocal();
        ui.hideModal('actual-price-modal');
        app.renderItems();
        app.updateProgress();
    },

    deleteItem: (itemId) => {
        if(confirm('Delete this item?')) {
            const shop = shops.find(s => s.id === currentShopId);
            shop.items = shop.items.filter(i => i.id !== itemId);
            saveToLocal();
            app.renderItems();
            app.updateProgress();
        }
    },

    // --- Wallet ---
    renderWallet: () => {
        const list = document.getElementById('cards-list');
        if(!list) return;
        list.innerHTML = '';
        
        const total = wallets.reduce((acc, w) => acc + w.balance, 0);
        document.getElementById('wallet-total').innerText = formatMoney(total);

        if (wallets.length === 0) {
            list.innerHTML = `<div class="empty-state"><p>No cards yet. Add one!</p></div>`;
            app.updateCardSelects();
            return;
        }

        wallets.forEach(card => {
            const el = document.createElement('div');
            el.className = 'wallet-card';
            el.innerHTML = `
                <div class="wallet-card-info">
                    <h3>${card.name}</h3>
                    <div class="wallet-card-balance">${formatMoney(card.balance)}</div>
                </div>
                <div class="wallet-card-actions">
                    <button class="icon-btn" onclick="app.openAdjustBalance('${card.id}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                    <button class="icon-btn text-danger" onclick="app.deleteCard('${card.id}')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                </div>
            `;
            list.appendChild(el);
        });

        app.updateCardSelects();
    },

    updateCardSelects: () => {
        const selects = ['item-new-card', 'item-actual-card'];
        selects.forEach(id => {
            const sel = document.getElementById(id);
            if (!sel) return;
            const val = sel.value;
            sel.innerHTML = '<option value="">None / Cash</option>';
            wallets.forEach(w => {
                sel.innerHTML += `<option value="${w.id}">${w.name} (${formatMoney(w.balance)})</option>`;
            });
            if (val) sel.value = val;
        });
    },

    handleAddCard: (e) => {
        e.preventDefault();
        const name = document.getElementById('card-name').value;
        const balance = parseFloat(document.getElementById('card-balance').value);
        
        wallets.push({
            id: generateId(),
            name,
            balance
        });
        
        saveToLocal();
        e.target.reset();
        ui.hideModal('add-card-modal');
        app.renderWallet();
    },

    deleteCard: (id) => {
        if(confirm('Delete this card?')) {
            wallets = wallets.filter(w => w.id !== id);
            saveToLocal();
            app.renderWallet();
        }
    },

    openAdjustBalance: (id) => {
        const card = wallets.find(w => w.id === id);
        if(!card) return;
        document.getElementById('adjust-card-id').value = id;
        document.getElementById('card-new-balance').value = card.balance.toFixed(2);
        ui.showModal('adjust-balance-modal');
    },

    handleAdjustBalance: (e) => {
        e.preventDefault();
        const id = document.getElementById('adjust-card-id').value;
        const newBalance = parseFloat(document.getElementById('card-new-balance').value);
        
        const card = wallets.find(w => w.id === id);
        if(card) {
            card.balance = newBalance;
            saveToLocal();
            ui.hideModal('adjust-balance-modal');
            app.renderWallet();
        }
    }
};

// Start
app.init();
