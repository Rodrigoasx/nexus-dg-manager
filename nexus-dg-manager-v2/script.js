/**
 * Nexus DG Manager v2.0
 * Sistema completo para gerenciamento de DGs
 */

// ===== DOM ELEMENTS =====
const DOM = {
    tamer: document.getElementById('tamer'),
    date: document.getElementById('date'),
    time: document.getElementById('time'),
    checkboxes: document.querySelectorAll('.dg-item input[type="checkbox"]'),
    dgItems: document.querySelectorAll('.dg-item'),
    completedCount: document.getElementById('completed-count'),
    pendingCount: document.getElementById('pending-count'),
    completedProgress: document.getElementById('completed-progress'),
    pendingProgress: document.getElementById('pending-progress'),
    submitBtn: document.getElementById('submit-btn'),
    resetBtn: document.getElementById('reset-btn'),
    message: document.getElementById('message'),
    connectionStatus: document.getElementById('connection-status'),
    
    // Card elements
    cardTamer: document.getElementById('card-tamer'),
    cardDate: document.getElementById('card-date'),
    cardTime: document.getElementById('card-time'),
    cardCompleted: document.getElementById('card-completed-list'),
    cardPending: document.getElementById('card-pending-list'),
    cardDoneCount: document.getElementById('card-done-count'),
    cardPendingCount: document.getElementById('card-pending-count'),
    cardProgress: document.getElementById('card-progress')
};

// ===== CONSTANTS =====
const ALL_DGS = ['RBH', 'SDGHE', 'MDG', 'DW', 'CDGNE', 'NEVERLAND'];
const DG_ICONS = {
    'RBH': '🔥',
    'SDGHE': '⚡',
    'MDG': '🌊',
    'DW': '🗡️',
    'CDGNE': '🌀',
    'NEVERLAND': '✨'
};

// ===== UTILITY FUNCTIONS =====
function updateDateTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit'
    };
    DOM.date.textContent = now.toLocaleDateString('pt-BR', options);
    DOM.time.textContent = now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function showMessage(text, type = 'success') {
    DOM.message.textContent = text;
    DOM.message.className = `message ${type}`;
    DOM.message.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        DOM.message.style.display = 'none';
    }, 5000);
}

function setLoading(isLoading) {
    DOM.submitBtn.disabled = isLoading;
    const btnText = DOM.submitBtn.querySelector('.btn-text');
    const btnLoader = DOM.submitBtn.querySelector('.btn-loader');
    const btnIcon = DOM.submitBtn.querySelector('.btn-icon');
    
    if (isLoading) {
        btnText.style.display = 'none';
        btnIcon.style.display = 'none';
        btnLoader.style.display = 'block';
    } else {
        btnText.style.display = 'inline';
        btnIcon.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

// ===== STATS MANAGEMENT =====
function updateStats() {
    const checked = document.querySelectorAll('.dg-item input[type="checkbox"]:checked');
    const total = ALL_DGS.length;
    const completed = checked.length;
    const pending = total - completed;
    
    // Update numbers
    DOM.completedCount.textContent = completed;
    DOM.pendingCount.textContent = pending;
    
    // Update progress bars
    const completedPercent = (completed / total) * 100;
    const pendingPercent = (pending / total) * 100;
    DOM.completedProgress.style.width = `${completedPercent}%`;
    DOM.pendingProgress.style.width = `${pendingPercent}%`;
    
    // Update item styles
    DOM.dgItems.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox.checked) {
            item.classList.add('checked');
        } else {
            item.classList.remove('checked');
        }
    });
}

// ===== CARD GENERATION =====
function updateCardPreview(data) {
    DOM.cardTamer.textContent = data.tamer;
    DOM.cardDate.textContent = data.date;
    DOM.cardTime.textContent = data.time;
    
    // Update completed list
    if (data.selected.length > 0) {
        DOM.cardCompleted.innerHTML = data.selected
            .map(dg => `<span>${DG_ICONS[dg] || '✓'} ${dg}</span>`)
            .join('');
    } else {
        DOM.cardCompleted.innerHTML = '<span class="card-empty">Nenhuma DG concluída</span>';
    }
    
    // Update pending list
    if (data.pending.length > 0) {
        DOM.cardPending.innerHTML = data.pending
            .map(dg => `<span>${DG_ICONS[dg] || '✗'} ${dg}</span>`)
            .join('');
    } else {
        DOM.cardPending.innerHTML = '<span class="card-empty">🎉 Todas concluídas!</span>';
    }
    
    // Update stats
    DOM.cardDoneCount.textContent = data.completed;
    DOM.cardPendingCount.textContent = data.pendingCount;
    const progress = Math.round((data.completed / data.total) * 100);
    DOM.cardProgress.textContent = `${progress}%`;
}

async function generateCardImage() {
    const cardElement = document.getElementById('card-content');
    
    try {
        const canvas = await html2canvas(cardElement, {
            scale: 2,
            backgroundColor: '#0a0a1a',
            allowTaint: false,
            useCORS: true,
            logging: false,
            width: 500,
            height: cardElement.scrollHeight,
            windowWidth: 500
        });
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('Error generating card image:', error);
        throw new Error('Falha ao gerar imagem do card. Tente novamente.');
    }
}

// ===== DATA MANAGEMENT =====
function getSelectedDGs() {
    const checked = document.querySelectorAll('.dg-item input[type="checkbox"]:checked');
    return Array.from(checked).map(cb => cb.value);
}

function getPendingDGs(selected) {
    return ALL_DGS.filter(dg => !selected.includes(dg));
}

function buildCardData() {
    const tamer = DOM.tamer.value.trim();
    const selected = getSelectedDGs();
    const pending = getPendingDGs(selected);
    const now = new Date();
    
    return {
        tamer,
        selected,
        pending,
        date: now.toLocaleDateString('pt-BR'),
        time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        completed: selected.length,
        total: ALL_DGS.length,
        pendingCount: pending.length
    };
}

function validateForm() {
    const tamer = DOM.tamer.value.trim();
    if (!tamer) {
        showMessage('⚠️ Por favor, informe o nome do seu Tamer.', 'error');
        DOM.tamer.focus();
        return false;
    }
    
    if (tamer.length < 2) {
        showMessage('⚠️ O nome do Tamer deve ter pelo menos 2 caracteres.', 'error');
        DOM.tamer.focus();
        return false;
    }
    
    const checked = document.querySelectorAll('.dg-item input[type="checkbox"]:checked');
    if (checked.length === 0) {
        showMessage('⚠️ Selecione pelo menos uma DG concluída.', 'error');
        return false;
    }
    
    return true;
}

function resetForm() {
    DOM.tamer.value = '';
    DOM.checkboxes.forEach(cb => cb.checked = false);
    updateStats();
    DOM.message.style.display = 'none';
    DOM.tamer.focus();
}

// ===== DISCORD INTEGRATION =====
async function sendToDiscord(data, imageData) {
    const response = await fetch('/.netlify/functions/discord', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...data,
            image: imageData
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao enviar para o Discord.');
    }
    
    return await response.json();
}

// ===== MAIN SUBMIT HANDLER =====
async function handleSubmit() {
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Set loading state
    setLoading(true);
    
    try {
        // Build data
        const data = buildCardData();
        updateCardPreview(data);
        
        // Generate image
        const imageData = await generateCardImage();
        
        // Send to Discord
        await sendToDiscord(data, imageData);
        
        // Success
        showMessage('✅ Relatório enviado com sucesso para o Discord!', 'success');
        
        // Optional: Reset after success
        // resetForm();
        
    } catch (error) {
        console.error('Error:', error);
        showMessage(`❌ ${error.message}`, 'error');
    } finally {
        setLoading(false);
    }
}

// ===== EVENT LISTENERS =====
// Checkbox changes
DOM.checkboxes.forEach(cb => {
    cb.addEventListener('change', updateStats);
});

// Submit button
DOM.submitBtn.addEventListener('click', handleSubmit);

// Reset button
DOM.resetBtn.addEventListener('click', resetForm);

// Enter key on tamer input
DOM.tamer.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSubmit();
    }
});

// Auto-focus tamer input on load
DOM.tamer.addEventListener('focus', function() {
    this.select();
});

// ===== CONNECTION STATUS =====
async function checkConnection() {
    try {
        const response = await fetch('/.netlify/functions/discord', {
            method: 'HEAD'
        });
        DOM.connectionStatus.textContent = 'Conectado ✅';
        DOM.connectionStatus.style.color = 'var(--success)';
    } catch (error) {
        DOM.connectionStatus.textContent = 'Offline ❌';
        DOM.connectionStatus.style.color = 'var(--danger)';
    }
}

// ===== INITIALIZATION =====
function init() {
    updateDateTime();
    updateStats();
    // checkConnection(); // Uncomment if you want to check connection on load
    
    // Update time every minute
    setInterval(updateDateTime, 60000);
}

// Start the app
init();

console.log('🚀 Nexus DG Manager v2.0 loaded successfully!');
console.log('📊 Manage your DGs with style!');