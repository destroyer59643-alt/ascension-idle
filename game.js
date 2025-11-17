// ============================================================================
// GAME STATE & DATA
// ============================================================================

const CLASSES = {
    warrior: {
        name: 'Warrior',
        description: 'Master of melee combat',
        perk: '+10% click XP',
        clickMultiplier: 1.1,
        passiveMultiplier: 1,
        skillName: 'Smash',
        skillDesc: 'Deal massive damage burst',
        skillPower: 2,
        skillCooldown: 8,
    },
    mage: {
        name: 'Mage',
        description: 'Master of arcane magic',
        perk: '+5% passive XP/sec',
        clickMultiplier: 1,
        passiveMultiplier: 1.05,
        skillName: 'Arcane Surge',
        skillDesc: 'Boost all XP by 3x for 5 sec',
        skillPower: 3,
        skillCooldown: 15,
    },
    rogue: {
        name: 'Rogue',
        description: 'Master of precision strikes',
        perk: '+15% crit chance on clicks',
        clickMultiplier: 1,
        passiveMultiplier: 1,
        skillName: 'Shadow Strike',
        skillDesc: 'Double XP on next 5 clicks',
        skillPower: 2,
        skillCooldown: 12,
    },
    engineer: {
        name: 'Engineer',
        description: 'Master of automation',
        perk: '-20% upgrade cost, +3% passive XP/sec',
        clickMultiplier: 1,
        passiveMultiplier: 1.03,
        skillName: 'Automation',
        skillDesc: 'Double passive XP for 10 sec',
        skillPower: 2,
        skillCooldown: 20,
    },
};

const UPGRADES = [
    {
        id: 'clickXp1',
        name: 'Click Mastery I',
        description: 'Increase XP per click by 5',
        cost: 100,
        effect: { clickXp: 5 },
        maxLevel: Infinity,
    },
    {
        id: 'clickXp2',
        name: 'Click Mastery II',
        description: 'Increase XP per click by 10',
        cost: 500,
        effect: { clickXp: 10 },
        maxLevel: Infinity,
    },
    {
        id: 'passiveXp1',
        name: 'Passive Generation I',
        description: 'Gain 0.5 XP per second',
        cost: 200,
        effect: { passiveXp: 0.5 },
        maxLevel: Infinity,
    },
    {
        id: 'passiveXp2',
        name: 'Passive Generation II',
        description: 'Gain 2 XP per second',
        cost: 1000,
        effect: { passiveXp: 2 },
        maxLevel: Infinity,
    },
    {
        id: 'skillPower1',
        name: 'Skill Enhancement I',
        description: 'Increase skill potency by 20%',
        cost: 300,
        effect: { skillMultiplier: 0.2 },
        maxLevel: Infinity,
    },
    {
        id: 'skillCooldown1',
        name: 'Skill Cooldown Reduction I',
        description: 'Reduce skill cooldown by 10%',
        cost: 400,
        effect: { cooldownMultiplier: 0.1 },
        maxLevel: Infinity,
    },
];

const SHOP_ITEMS = [
    {
        id: 'xpBoost1h',
        name: 'XP Booster (1 hour)',
        description: '2x XP for 1 hour',
        cost: 150,
        effect: { xpMultiplier: 2, duration: 3600 },
    },
    {
        id: 'currencyBoost1h',
        name: 'Currency Multiplier (30 min)',
        description: '3x currency earned for 30 min',
        cost: 200,
        effect: { currencyMultiplier: 3, duration: 1800 },
    },
    {
        id: 'skillReset',
        name: 'Instant Skill Reset',
        description: 'Reset all skill cooldowns now',
        cost: 250,
        effect: { resetSkills: true },
    },
];

const QUEST_TEMPLATES = [
    {
        id: 'earnXp',
        name: 'Earn XP',
        description: 'Earn {target} XP',
        condition: 'xp',
        baseTarget: 100,
        reward: { currency: 10, xp: 50 },
        multiplier: 1.5,
    },
    {
        id: 'clicks',
        name: 'Click Mastery',
        description: 'Click {target} times',
        condition: 'clicks',
        baseTarget: 50,
        reward: { currency: 20, xp: 20 },
        multiplier: 1.6,
    },
    {
        id: 'reachLevel',
        name: 'Ascend to Level',
        description: 'Reach level {target}',
        condition: 'level',
        baseTarget: 5,
        reward: { currency: 50, xp: 200 },
        multiplier: 2,
    },
];

// ============================================================================
// MAIN GAME CLASS
// ============================================================================

class IdleGame {
    constructor() {
        // Core stats
        this.level = 1;
        this.xp = 0;
        this.xpForNextLevel = 100;
        this.currency = 0;

        // Class & progression
        this.selectedClass = null;
        this.rebirthCount = 0;
        this.rebirthMultiplier = 1;

        // Gameplay values
        this.clickXp = 10;
        this.passiveXp = 0;
        this.skillMultiplier = 1;
        this.cooldownMultiplier = 1;
        this.xpMultiplier = 1;
        this.currencyMultiplier = 1;

        // Upgrades tracking
        this.upgrades = {};
        UPGRADES.forEach(u => {
            this.upgrades[u.id] = { level: 0, purchased: false };
        });

        // Skills
        this.skills = {};
        this.skillCooldowns = {};
        this.skillDurations = {};

        // Boosters
        this.boosters = [];

        // Click tracking
        this.clickCount = 0;

        // Quests
        this.quests = {};

        // Load from storage
        this.load();

        // Initialize quests if needed
        this.initQuests();

        // Show class selection if needed
        if (!this.selectedClass) {
            this.showClassSelection();
        }

        // Initialize game loop
        this.startGameLoop();
    }

    // ========================================
    // QUESTS
    // ========================================

    initQuests() {
        if (!this.quests || Object.keys(this.quests).length === 0) {
            this.quests = {};
            QUEST_TEMPLATES.forEach(t => {
                this.quests[t.id] = {
                    id: t.id,
                    name: t.name,
                    description: t.description,
                    condition: t.condition,
                    target: t.baseTarget,
                    progress: 0,
                    reward: Object.assign({}, t.reward),
                    multiplier: t.multiplier,
                    completed: 0,
                };
            });
            this.save();
        }
    }

    updateQuests(type, amount) {
        Object.values(this.quests).forEach(q => {
            if (q.condition === 'xp' && type === 'xp') {
                q.progress += amount;
            }
            if (q.condition === 'clicks' && type === 'click') {
                q.progress += amount;
            }
            if (q.condition === 'level' && type === 'level') {
                // for level quests, progress stores the current reached level
                q.progress = Math.max(q.progress, this.level);
            }
        });
        this.save();
    }

    claimQuest(questId) {
        const q = this.quests[questId];
        if (!q) return false;
        if (q.progress < q.target) return false;

        // Give rewards
        if (q.reward.currency) this.currency += q.reward.currency;
        if (q.reward.xp) this.addXp(q.reward.xp);

        q.completed++;

        // Multiply target and reward for next iteration
        q.target = Math.ceil(q.target * q.multiplier);
        q.reward.currency = Math.ceil((q.reward.currency || 0) * q.multiplier);
        q.reward.xp = Math.ceil((q.reward.xp || 0) * q.multiplier);

        // Reset progress
        q.progress = 0;
        this.save();
        return true;
    }

    // ========================================
    // CLASS MANAGEMENT
    // ========================================

    selectClass(classKey) {
        if (!CLASSES[classKey]) return;

        this.selectedClass = classKey;
        this.initializeClassSkills();
        this.save();
        this.closeClassModal();
        showNotification(`Selected class: ${CLASSES[classKey].name}`, 'success');
    }

    initializeClassSkills() {
        const classData = CLASSES[this.selectedClass];
        this.skills[classData.skillName] = {
            name: classData.skillName,
            description: classData.skillDesc,
            power: classData.skillPower * this.skillMultiplier,
            cooldown: classData.skillCooldown * (1 - 0.1 * this.cooldownMultiplier),
            maxCooldown: classData.skillCooldown * (1 - 0.1 * this.cooldownMultiplier),
            isReady: true,
        };
        this.skillCooldowns[classData.skillName] = 0;
        this.skillDurations[classData.skillName] = 0;
    }

    getClassMultipliers() {
        if (!this.selectedClass) return { click: 1, passive: 1 };
        const classData = CLASSES[this.selectedClass];
        return {
            click: classData.clickMultiplier,
            passive: classData.passiveMultiplier,
        };
    }

    // ========================================
    // CLICKING & XP
    // ========================================

    handleClick() {
        let baseXp = this.clickXp;

        // Apply class multiplier
        const classMultipliers = this.getClassMultipliers();
        baseXp *= classMultipliers.click;

        // Apply rebirth multiplier
        baseXp *= this.rebirthMultiplier;

        // Apply crit chance (Rogue class)
        if (this.selectedClass === 'rogue') {
            const critChance = 0.15;
            if (Math.random() < critChance) {
                baseXp *= 2;
                showNotification('CRITICAL HIT! 💥', 'success');
            }
        }

        // Apply active boosters
        baseXp *= this.xpMultiplier;

        this.addXp(baseXp);
        // Track clicks for quests
        this.clickCount = (this.clickCount || 0) + 1;
        this.updateQuests('click', 1);
        return baseXp;
    }

    addXp(amount) {
        this.xp += amount;

        // Check for level up
        while (this.xp >= this.xpForNextLevel) {
            this.levelUp();
        }

        // Update XP quests
        this.updateQuests('xp', amount);

        this.save();
    }

    levelUp() {
        this.xp -= this.xpForNextLevel;
        this.level++;

        // Increase XP required for next level
        this.xpForNextLevel = Math.floor(100 * Math.pow(1.1, this.level - 1));

        // Give currency
        const currencyGain = Math.floor(10 * Math.pow(1.2, this.level - 1)) * this.currencyMultiplier;
        this.currency += currencyGain;

        showNotification(`Level ${this.level}! +${currencyGain} currency`, 'success');
        // Update level quests
        this.updateQuests('level', this.level);
        this.save();
    }

    // ========================================
    // PASSIVE XP GENERATION
    // ========================================

    updatePassiveXp(deltaTime) {
        if (this.passiveXp <= 0) return;

        const classMultipliers = this.getClassMultipliers();
        let passiveGain = (this.passiveXp / 1000) * deltaTime;
        passiveGain *= classMultipliers.passive;
        passiveGain *= this.rebirthMultiplier;
        passiveGain *= this.xpMultiplier;

        this.addXp(passiveGain);
    }

    // ========================================
    // UPGRADES
    // ========================================

    canAffordUpgrade(upgrade) {
        let cost = upgrade.cost;

        // Apply engineer discount
        if (this.selectedClass === 'engineer') {
            cost *= 0.8;
        }

        return this.currency >= cost;
    }

    purchaseUpgrade(upgradeId) {
        const upgrade = UPGRADES.find(u => u.id === upgradeId);
        if (!upgrade) return;

        let cost = upgrade.cost;
        if (this.selectedClass === 'engineer') {
            cost *= 0.8;
        }

        if (this.currency < cost) {
            showNotification('Not enough currency!', 'error');
            return;
        }

        this.currency -= cost;
        this.upgrades[upgradeId].level++;
        this.upgrades[upgradeId].purchased = true;

        // Apply upgrade effect
        if (upgrade.effect.clickXp) {
            this.clickXp += upgrade.effect.clickXp;
        }
        if (upgrade.effect.passiveXp) {
            this.passiveXp += upgrade.effect.passiveXp;
        }
        if (upgrade.effect.skillMultiplier) {
            this.skillMultiplier += upgrade.effect.skillMultiplier;
            this.recalculateSkills();
        }
        if (upgrade.effect.cooldownMultiplier) {
            this.cooldownMultiplier += upgrade.effect.cooldownMultiplier;
            this.recalculateSkills();
        }

        showNotification(`Upgraded: ${upgrade.name}`, 'success');
        this.save();
    }

    recalculateSkills() {
        const classData = CLASSES[this.selectedClass];
        if (!classData) return;

        const skill = this.skills[classData.skillName];
        if (skill) {
            skill.power = classData.skillPower * this.skillMultiplier;
            skill.cooldown = classData.skillCooldown * (1 - Math.min(0.8, 0.1 * this.cooldownMultiplier));
            skill.maxCooldown = skill.cooldown;
        }
    }

    // ========================================
    // SKILLS
    // ========================================

    useSkill(skillName) {
        if (!this.skills[skillName]) return;

        const skill = this.skills[skillName];
        if (!skill.isReady) {
            showNotification(`${skillName} is on cooldown!`, 'warning');
            return;
        }

        // Execute skill based on class
        switch (this.selectedClass) {
            case 'warrior':
                this.executeSmash(skill);
                break;
            case 'mage':
                this.executeArcaneSurge(skill);
                break;
            case 'rogue':
                this.executeShadowStrike(skill);
                break;
            case 'engineer':
                this.executeAutomation(skill);
                break;
        }

        // Start cooldown
        skill.isReady = false;
        this.skillCooldowns[skillName] = skill.cooldown;
        this.save();
    }

    executeSmash(skill) {
        const xpGain = this.clickXp * skill.power * this.rebirthMultiplier;
        this.addXp(xpGain);
        showNotification(`SMASH! +${Math.floor(xpGain)} XP`, 'success');
    }

    executeArcaneSurge(skill) {
        this.xpMultiplier = skill.power;
        this.skillDurations['arcaneSurge'] = 5000; // 5 seconds
        showNotification('Arcane Surge active! 3x XP for 5 seconds', 'success');
    }

    executeShadowStrike(skill) {
        this.skillDurations['shadowStrike'] = 5000; // 5 clicks
        showNotification('Shadow Strike active! Next 5 clicks are doubled', 'success');
    }

    executeAutomation(skill) {
        this.skillDurations['automation'] = 10000; // 10 seconds
        showNotification('Automation active! 2x passive XP for 10 seconds', 'success');
    }

    updateSkillCooldowns(deltaTime) {
        Object.keys(this.skillCooldowns).forEach(skillName => {
            if (this.skillCooldowns[skillName] > 0) {
                this.skillCooldowns[skillName] -= deltaTime;
                if (this.skillCooldowns[skillName] <= 0) {
                    this.skillCooldowns[skillName] = 0;
                    this.skills[skillName].isReady = true;
                    showNotification(`${skillName} is ready!`, 'success');
                }
            }
        });

        // Update skill durations
        Object.keys(this.skillDurations).forEach(skillName => {
            if (this.skillDurations[skillName] > 0) {
                this.skillDurations[skillName] -= deltaTime;
                if (this.skillDurations[skillName] <= 0) {
                    this.skillDurations[skillName] = 0;
                    // Reset multipliers
                    if (skillName === 'arcaneSurge') {
                        this.xpMultiplier = 1;
                    }
                }
            }
        });
    }

    // ========================================
    // SHOP
    // ========================================

    purchaseShopItem(itemId) {
        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return;

        if (this.currency < item.cost) {
            showNotification('Not enough currency!', 'error');
            return;
        }

        this.currency -= item.cost;

        if (item.effect.xpMultiplier) {
            this.xpMultiplier = item.effect.xpMultiplier;
            setTimeout(() => {
                this.xpMultiplier = 1;
                showNotification('XP Booster expired', 'warning');
                this.save();
            }, item.effect.duration * 1000);
            showNotification(`${item.name} activated!`, 'success');
        }

        if (item.effect.currencyMultiplier) {
            this.currencyMultiplier = item.effect.currencyMultiplier;
            setTimeout(() => {
                this.currencyMultiplier = 1;
                showNotification('Currency Multiplier expired', 'warning');
                this.save();
            }, item.effect.duration * 1000);
            showNotification(`${item.name} activated!`, 'success');
        }

        if (item.effect.resetSkills) {
            Object.keys(this.skills).forEach(skillName => {
                this.skillCooldowns[skillName] = 0;
                this.skills[skillName].isReady = true;
            });
            showNotification('All skill cooldowns reset!', 'success');
        }

        this.save();
    }

    // ========================================
    // REBIRTH / PRESTIGE
    // ========================================

    getRebirthMultiplier() {
        return 1 + (this.rebirthCount * 0.1);
    }

    executeRebirth() {
        // Store multiplier before reset
        this.rebirthCount++;
        this.rebirthMultiplier = this.getRebirthMultiplier();

        // Reset level & XP
        this.level = 1;
        this.xp = 0;
        this.xpForNextLevel = 100;

        // Reset upgrades
        this.upgrades = {};
        UPGRADES.forEach(u => {
            this.upgrades[u.id] = { level: 0, purchased: false };
        });

        // Reset gameplay values
        this.clickXp = 10;
        this.passiveXp = 0;
        this.skillMultiplier = 1;
        this.cooldownMultiplier = 1;
        this.xpMultiplier = 1;
        this.currencyMultiplier = 1;

        // Clear boosters
        this.boosters = [];

        // Show class selection
        this.showClassSelection();

        showNotification(`Rebirth #${this.rebirthCount}! New multiplier: ${this.rebirthMultiplier.toFixed(2)}x`, 'success');
        this.save();
    }

    showClassSelection() {
        const modal = document.getElementById('classModal');
        modal.classList.add('active');
    }

    // ========================================
    // SAVE & LOAD
    // ========================================

    save() {
        const data = {
            level: this.level,
            xp: this.xp,
            xpForNextLevel: this.xpForNextLevel,
            currency: this.currency,
            selectedClass: this.selectedClass,
            rebirthCount: this.rebirthCount,
            rebirthMultiplier: this.rebirthMultiplier,
            clickXp: this.clickXp,
            passiveXp: this.passiveXp,
            skillMultiplier: this.skillMultiplier,
            cooldownMultiplier: this.cooldownMultiplier,
            upgrades: this.upgrades,
            skills: this.skills,
            skillCooldowns: this.skillCooldowns,
            clickCount: this.clickCount,
            quests: this.quests,
            boosters: this.boosters,
        };
        localStorage.setItem('idleGameSave', JSON.stringify(data));
    }

    load() {
        const saved = localStorage.getItem('idleGameSave');
        if (!saved) return;

        const data = JSON.parse(saved);
        this.level = data.level;
        this.xp = data.xp;
        this.xpForNextLevel = data.xpForNextLevel;
        this.currency = data.currency;
        this.selectedClass = data.selectedClass;
        this.rebirthCount = data.rebirthCount;
        this.rebirthMultiplier = data.rebirthMultiplier;
        this.clickXp = data.clickXp;
        this.passiveXp = data.passiveXp;
        this.skillMultiplier = data.skillMultiplier;
        this.cooldownMultiplier = data.cooldownMultiplier;
        this.upgrades = data.upgrades;
        this.skills = data.skills || {};
        this.skillCooldowns = data.skillCooldowns || {};
        this.clickCount = data.clickCount || 0;
        this.quests = data.quests || {};
        this.boosters = data.boosters || [];

        // Re-initialize skills if class is selected
        if (this.selectedClass && Object.keys(this.skills).length === 0) {
            this.initializeClassSkills();
        }
    }

    // ========================================
    // GAME LOOP
    // ========================================

    startGameLoop() {
        let lastTime = Date.now();

        const gameLoop = () => {
            const now = Date.now();
            const deltaTime = (now - lastTime) / 1000; // Convert to seconds
            lastTime = now;

            // Update passive XP
            this.updatePassiveXp(deltaTime);

            // Update skill cooldowns
            this.updateSkillCooldowns(deltaTime);

            // Update UI every 200ms
            if (now % 200 < deltaTime * 1000) {
                updateUI();
            }

            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
    }
}

// ============================================================================
// GLOBAL GAME INSTANCE & UTILITIES
// ============================================================================

let game;

function initGame() {
    game = new IdleGame();
}

function closeClassModal() {
    document.getElementById('classModal').classList.remove('active');
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    container.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', initGame);
