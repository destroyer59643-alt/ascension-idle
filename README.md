# ⚔️ Idle Incremental Game

A complete browser-based idle/incremental game with levels, classes, skills, upgrades, and a prestige system!

## 🎮 Features

### Core Gameplay
- **Clicking & Passive XP**: Click buttons to earn XP or let passive generation work for you
- **Levels & XP**: Gain XP to level up and earn currency
- **Leveling System**: XP required scales exponentially as you progress
- **Passive Generation**: Earn XP per second without clicking

### Class System
Choose from 4 unique classes, each with special perks and abilities:

1. **⚔️ Warrior**
   - +10% click XP
   - Skill: "Smash" - Deal massive XP burst
   
2. **🔮 Mage**
   - +5% passive XP/sec
   - Skill: "Arcane Surge" - 3x XP multiplier for 5 seconds
   
3. **🗡️ Rogue**
   - +15% crit chance on clicks (double XP on crit)
   - Skill: "Shadow Strike" - Double next 5 clicks
   
4. **⚙️ Engineer**
   - -20% upgrade cost, +3% passive XP/sec
   - Skill: "Automation" - 2x passive XP for 10 seconds

### Progression Systems

**Upgrades**: Permanent improvements to your gameplay
- Click Mastery I & II: Increase XP per click
- Passive Generation I & II: Gain XP per second
- Skill Enhancement: Boost skill potency
- Skill Cooldown Reduction: Faster skill usage

**Shop**: Buy temporary boosts and consumables
- XP Booster: 2x XP for 1 hour
- Currency Multiplier: 3x earned currency for 30 min
- Instant Skill Reset: Reset all skill cooldowns

**Skills**: Active abilities with cooldowns
- Each class has a unique skill with strategic applications
- Skills have cooldowns that must recharge between uses
- Some skills have duration effects

### Rebirth / Prestige System
Rebirth to reset your progress but gain permanent multipliers:
- Resets Level, XP, and Upgrades
- Gives +10% permanent XP multiplier per rebirth
- Unlocks new class choices
- Keeps your rebirth count and multiplier

### Save System
Your progress is automatically saved to browser localStorage:
- XP, Level, and Currency
- All upgrades and skill states
- Class selection and rebirth count
- Restores instantly on page reload

## 🚀 How to Play

1. **Open** `index.html` in any modern web browser
2. **Select a Class** from the modal on startup
3. **Click the Green Button** to earn XP or let passive generation work
4. **Level Up** to earn currency and increase your XP requirements
5. **Buy Upgrades** to increase your XP generation rates
6. **Use Skills** strategically when their cooldowns are ready
7. **Purchase Boosters** from the shop for temporary multipliers
8. **Rebirth** when you want to reset and gain permanent multipliers

## 📁 File Structure

- `index.html` - Main HTML structure and UI layout
- `styles.css` - Complete styling with responsive design
- `game.js` - Core game logic, state management, and mechanics
- `ui.js` - UI updates, event listeners, and rendering

## 🛠️ Game Balance

The game is designed with progressive scaling:
- Early game: Quick level-ups and currency gain
- Mid game: Upgrading becomes important for progression
- Late game: Rebirth multipliers provide exponential growth
- End game: Min-maxing class choice and upgrade order

## 💾 Save Data

Game automatically saves to localStorage. To clear progress:
1. Open browser DevTools (F12)
2. Go to Application → Local Storage
3. Delete the `idleGameSave` entry
4. Refresh the page

## 🎨 Visual Features

- Smooth animations for clicks, level-ups, and skill usage
- Floating XP text on clicks
- Color-coded UI elements (primary, success, warning, danger)
- Responsive design works on mobile and desktop
- Shimmer effect on XP bar
- Notification system for important events

## 🎯 Strategy Tips

1. **Warrior**: Best for click-based progression early on
2. **Mage**: Build passive generation as soon as possible
3. **Rogue**: Look for critical hits on clicking sprees
4. **Engineer**: Maximize upgrades due to cost reduction

## 📊 Progression Formula

- XP for next level = 100 × 1.1^(level-1)
- Rebirth multiplier = 1 + (rebirth count × 0.1)
- Currency gained per level = 10 × 1.2^(level-1) × currency multiplier

## 🔧 Customization

You can modify game constants in `game.js`:
- `CLASSES` - Class definitions and perks
- `UPGRADES` - Available upgrades and effects
- `SHOP_ITEMS` - Shop items and prices

Enjoy the game! 🎮