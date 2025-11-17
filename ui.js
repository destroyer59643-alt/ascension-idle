// ============================================================================
// UI UPDATE & RENDERING
// ============================================================================

// ========================================
// HIDDEN CHEAT COMMANDS (no visible hints)
// ========================================
// Cheat helpers are defined but do not print instructions to the console.
window.godmode = function() {
    if (!game) return;
    game.xp = game.xpForNextLevel * 100;
    game.level = 100;
    game.currency = 1000000;
    game.clickXp = 500;
    game.passiveXp = 1000;
    game.rebirthMultiplier = 5;
    UPGRADES.forEach(u => { game.upgrades[u.id] = { level: 50, purchased: true }; });
    Object.keys(game.skills).forEach(skillName => {
        game.skillCooldowns[skillName] = 0;
        game.skills[skillName].isReady = true;
        game.skills[skillName].power *= 10;
    });
    game.save();
    updateUI();
};

window.ascend = function() { if (!game) return; game.rebirthCount += 10; game.rebirthMultiplier = game.getRebirthMultiplier(); game.save(); };
window.richman = function() { if (!game) return; game.currency = 999999999; game.save(); updateUI(); };
window.speedrun = function() { if (!game) return; game.level = 1000; game.xp = 0; game.xpForNextLevel = 100 * Math.pow(1.1, 999); game.currency = 100000000; game.clickXp = 10000; game.passiveXp = 10000; game.skillMultiplier = 50; game.cooldownMultiplier = 50; game.rebirthMultiplier = 20; game.rebirthCount = 200; UPGRADES.forEach(u => { game.upgrades[u.id] = { level: 100, purchased: true }; }); game.save(); updateUI(); };

// A short console message (as requested)
console.log("You know Ethan doesn't like cheaters");

// Hidden wipe function: call `wipeSave()` in the console to remove save and reload.
window.wipeSave = function() {
    try {
        if (!confirm('Wipe all save data? This cannot be undone.')) return;
        localStorage.removeItem('idleGameSave');
        // also gracefully reset in-memory game if present
        if (window.game) {
            // attempt to clear current game state then reload
            window.game = null;
        }
        location.reload();
    } catch (e) {
        console.error('Failed to wipe save:', e);
    }
};
function updateUI() {
    if (!game) return;

    // Update stats display
    updateStatsDisplay();

    // Update class display
    updateClassDisplay();

    // Update passive XP display
    updatePassiveDisplay();

    // Update tabs
    updateSkillsTab();
    updateUpgradesTab();
    updateShopTab();
    updateRebirthTab();
    updateQuestsTab();
}

// ========================================
// QUESTS TAB
// ========================================

function updateQuestsTab() {
    const questsList = document.getElementById('questsList');
    if (!questsList || !game.quests) return;
    questsList.innerHTML = '';

    Object.values(game.quests).forEach(q => {
        const percent = Math.min(100, (q.progress / q.target) * 100);
        const canClaim = q.progress >= q.target;

        const questCard = document.createElement('div');
        questCard.className = 'skill-card';

        questCard.innerHTML = `
            <div class="card-content">
                <div class="card-title">${q.name}</div>
                <div class="card-desc">${q.description.replace('{target}', q.target)}</div>
                <div style="margin-top:8px; font-size:12px; color:var(--text-light);">Progress: ${formatNumber(Math.floor(q.progress))} / ${formatNumber(q.target)}</div>
                <div style="height:8px; background:var(--bg-secondary); border-radius:8px; overflow:hidden; margin-top:8px;">
                    <div style="width:${percent}%; height:100%; background:linear-gradient(90deg,var(--primary),var(--secondary));"></div>
                </div>
            </div>
            <div class="card-action">
                <div style="text-align:right; font-size:12px; color:var(--text-light);">Reward: ${q.reward.xp || 0} XP • ${q.reward.currency || 0}$</div>
                <button class="skill-btn" ${!canClaim ? 'disabled' : ''} onclick="if(game.claimQuest('${q.id}')){ updateUI(); showNotification('Quest claimed!', 'success'); } else { showNotification('Quest not ready', 'warning'); }">${canClaim ? 'Claim' : 'Locked'}</button>
            </div>
        `;

        questsList.appendChild(questCard);
    });
}

// ========================================
// STATS DISPLAY
// ========================================

function updateStatsDisplay() {
    // Level
    document.getElementById('levelDisplay').textContent = game.level;

    // XP
    document.getElementById('xpDisplay').textContent = formatNumber(Math.floor(game.xp));

    // XP Bar
    const xpProgress = (game.xp / game.xpForNextLevel) * 100;
    document.getElementById('xpBar').style.width = xpProgress + '%';

    // XP to next level
    const xpNeeded = game.xpForNextLevel - Math.floor(game.xp);
    document.getElementById('xpToNextLevel').textContent = formatNumber(xpNeeded);

    // Currency
    document.getElementById('currencyDisplay').textContent = formatNumber(game.currency);

    // Rebirth count
    document.getElementById('rebirthCount').textContent = game.rebirthCount;
}

// ========================================
// CLASS DISPLAY
// ========================================

function updateClassDisplay() {
    if (!game.selectedClass) return;

    const classData = CLASSES[game.selectedClass];
    document.getElementById('classDisplay').textContent = classData.name;

    const perksHTML = `
        <div>${classData.perk}</div>
        <div style="margin-top: 8px; font-size: 11px; opacity: 0.8;">
            Skill: ${classData.skillName} - ${classData.skillDesc}
        </div>
    `;
    document.getElementById('classPerks').innerHTML = perksHTML;

    // Update click XP info
    const baseClickXp = 10;
    const clickMultiplier = classData.clickMultiplier;
    const totalClickXp = Math.floor(baseClickXp * clickMultiplier * game.rebirthMultiplier);
    document.getElementById('clickXpDisplay').textContent = `+${totalClickXp} XP`;
    document.getElementById('clickXpInfo').textContent = `+${totalClickXp} XP per click`;
}

// ========================================
// PASSIVE DISPLAY
// ========================================

function updatePassiveDisplay() {
    const passiveValue = game.passiveXp * game.getClassMultipliers().passive * game.rebirthMultiplier;
    document.getElementById('passiveXpDisplay').textContent = passiveValue.toFixed(2);
}

// ========================================
// SKILLS TAB
// ========================================

function updateSkillsTab() {
    const skillsList = document.getElementById('skillsList');
    skillsList.innerHTML = '';

    if (!game.selectedClass) return;

    Object.entries(game.skills).forEach(([skillName, skill]) => {
        const cooldownPercent = 100 - ((game.skillCooldowns[skillName] || 0) / skill.maxCooldown) * 100;
        const cooldownTime = Math.ceil(game.skillCooldowns[skillName] || 0);

        const skillCard = document.createElement('div');
        skillCard.className = 'skill-card';

        let cooldownDisplay = '';
        if (!skill.isReady) {
            cooldownDisplay = `<div class="card-cooldown">Cooldown: ${cooldownTime}s</div>`;
        }

        skillCard.innerHTML = `
            <div class="card-content">
                <div class="card-title">${skillName}</div>
                <div class="card-desc">${skill.description}</div>
                ${cooldownDisplay}
            </div>
            <div class="card-action">
                <button class="skill-btn" ${!skill.isReady ? 'disabled' : ''} onclick="game.useSkill('${skillName}'); updateUI();">
                    ${skill.isReady ? 'Use' : 'Ready in ' + cooldownTime + 's'}
                </button>
            </div>
        `;

        skillsList.appendChild(skillCard);
    });
}

// ========================================
// UPGRADES TAB
// ========================================

function updateUpgradesTab() {
    const upgradesList = document.getElementById('upgradesList');
    upgradesList.innerHTML = '';

    UPGRADES.forEach(upgrade => {
        const upgradeData = game.upgrades[upgrade.id];
        let cost = upgrade.cost;

        if (game.selectedClass === 'engineer') {
            cost = Math.floor(cost * 0.8);
        }

        const canAfford = game.currency >= cost;
        const level = upgradeData.level;

        const upgradeCard = document.createElement('div');
        upgradeCard.className = 'upgrade-card';

        upgradeCard.innerHTML = `
            <div class="card-content">
                <div class="card-title">${upgrade.name}</div>
                <div class="card-desc">${upgrade.description}</div>
                <div class="level-badge">Level: ${level}</div>
            </div>
            <div class="card-action">
                <span class="cost-badge">${formatNumber(cost)}</span>
                <button class="upgrade-btn" ${!canAfford ? 'disabled' : ''} onclick="game.purchaseUpgrade('${upgrade.id}'); updateUI();">
                    ${canAfford ? 'Buy' : 'No $'}
                </button>
            </div>
        `;

        upgradesList.appendChild(upgradeCard);
    });
}

// ========================================
// SHOP TAB
// ========================================

function updateShopTab() {
    const shopList = document.getElementById('shopList');
    shopList.innerHTML = '';

    SHOP_ITEMS.forEach(item => {
        const canAfford = game.currency >= item.cost;

        const shopItem = document.createElement('div');
        shopItem.className = 'shop-item';

        shopItem.innerHTML = `
            <div class="card-content">
                <div class="card-title">${item.name}</div>
                <div class="card-desc">${item.description}</div>
            </div>
            <div class="card-action">
                <span class="cost-badge">${formatNumber(item.cost)}</span>
                <button class="shop-btn" ${!canAfford ? 'disabled' : ''} onclick="game.purchaseShopItem('${item.id}'); updateUI();">
                    ${canAfford ? 'Buy' : 'No $'}
                </button>
            </div>
        `;

        shopList.appendChild(shopItem);
    });
}

// ========================================
// REBIRTH TAB
// ========================================

function updateRebirthTab() {
    const multiplier = game.getRebirthMultiplier();
    document.getElementById('rebirthMultiplier').textContent = multiplier.toFixed(2) + 'x';
}

// ========================================
// CLASS MODAL
// ========================================

let selectedClassTemp = null;

function initializeClassModal() {
    const classOptions = document.getElementById('classOptions');
    classOptions.innerHTML = '';

    Object.entries(CLASSES).forEach(([key, classData]) => {
        const option = document.createElement('div');
        option.className = 'class-option';
        option.id = `class-${key}`;

        option.innerHTML = `
            <div class="class-option-name">${classData.name}</div>
            <div class="class-option-perk">${classData.perk}</div>
        `;

        option.addEventListener('click', () => {
            // Remove selected from all options
            document.querySelectorAll('.class-option').forEach(el => el.classList.remove('selected'));
            // Add selected to clicked option
            option.classList.add('selected');
            // Store temp selection
            selectedClassTemp = key;
            // Show confirm button
            document.getElementById('selectedClassName').textContent = classData.name;
            document.getElementById('confirmSection').style.display = 'block';
        });

        classOptions.appendChild(option);
    });
}

function confirmClassSelection() {
    if (selectedClassTemp) {
        game.selectClass(selectedClassTemp);
        selectedClassTemp = null;
        document.getElementById('confirmSection').style.display = 'none';
    }
}

// ========================================
// TAB SWITCHING
// ========================================

function initializeTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Remove active class from all buttons and contents
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// ========================================
// EVENT LISTENERS
// ========================================

function initializeEventListeners() {
    // Click button
    const clickBtn = document.getElementById('clickBtn');
    if (clickBtn) {
        clickBtn.addEventListener('click', () => {
            const xpGain = game.handleClick();

            // Floating XP animation
            const rect = clickBtn.getBoundingClientRect();
            const floatingXp = document.createElement('div');
            floatingXp.className = 'floating-xp';
            floatingXp.textContent = `+${Math.floor(xpGain)}`;
            floatingXp.style.left = rect.left + rect.width / 2 + 'px';
            floatingXp.style.top = rect.top + 'px';
            document.body.appendChild(floatingXp);

            setTimeout(() => floatingXp.remove(), 1000);

            updateUI();
        });
    }

    // Rebirth button
    const rebirthBtn = document.getElementById('rebirthBtn');
    if (rebirthBtn) {
        rebirthBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to rebirth? This will reset your progress but give you permanent multipliers.')) {
                game.executeRebirth();
                updateUI();
            }
        });
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatNumber(num) {
    if (num < 1000) return Math.floor(num).toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
    return (num / 1000000000000).toFixed(1) + 'T';
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeClassModal();
    initializeTabSwitching();
    initializeEventListeners();

    // Confirm class button
    const confirmClassBtn = document.getElementById('confirmClassBtn');
    if (confirmClassBtn) {
        confirmClassBtn.addEventListener('click', confirmClassSelection);
    }

    // Initial UI update
    setTimeout(() => {
        if (game) {
            updateUI();
        }
    }, 100);

    // Update UI frequently
    setInterval(() => {
        if (game) {
            updateUI();
        }
    }, 100);
});
