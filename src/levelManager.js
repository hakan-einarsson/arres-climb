import { LEVELS } from './levels/levels.js';
import { world } from './world.js';
import { player } from './player.js';
import { coin } from './coin.js';
import { camera } from './camera.js';

export class LevelManager {
    constructor() {
        this.currentLevelIndex = 0;
        this.isVictory = false;
        this.bannerElement = null;
        this.bannerTimer = 0;

        this.initDOM();
    }

    initDOM() {
        if (typeof document === 'undefined') return;

        this.bannerElement = document.createElement('div');
        this.bannerElement.id = 'level-banner';
        this.bannerElement.style.position = 'fixed';
        this.bannerElement.style.top = '24px';
        this.bannerElement.style.left = '50%';
        this.bannerElement.style.transform = 'translateX(-50%)';
        this.bannerElement.style.padding = '10px 24px';
        this.bannerElement.style.background = 'rgba(13, 17, 23, 0.85)';
        this.bannerElement.style.border = '2px solid #58a6ff';
        this.bannerElement.style.borderRadius = '8px';
        this.bannerElement.style.color = '#ffffff';
        this.bannerElement.style.fontFamily = 'Consolas, monospace';
        this.bannerElement.style.fontSize = '16px';
        this.bannerElement.style.fontWeight = 'bold';
        this.bannerElement.style.textAlign = 'center';
        this.bannerElement.style.zIndex = '1000';
        this.bannerElement.style.pointerEvents = 'none';
        this.bannerElement.style.transition = 'opacity 0.4s ease';
        this.bannerElement.style.opacity = '0';

        document.body.appendChild(this.bannerElement);
    }

    showBanner(text, duration = 3.5) {
        if (!this.bannerElement) return;
        this.bannerElement.innerHTML = text;
        this.bannerElement.style.opacity = '1';
        this.bannerTimer = duration;
    }

    loadLevel(index = 0) {
        if (index < 0 || index >= LEVELS.length) {
            index = 0;
        }

        this.currentLevelIndex = index;
        this.isVictory = false;
        const level = LEVELS[index];

        // 1. Rensa existerande värld
        world.clearWorld();

        // 2. Applicera nivåns parametrar och generera terräng
        world.applyLevelConfig(level);
        world.createWorld(0, 0);

        // 3. Applicera banans modifieringar
        if (Array.isArray(level.modifications)) {
            world.applyModifications(level.modifications);
        }

        // 4. Placera spelaren vid spawn
        const spawn = level.spawn || world.getSpawnPosition();
        player.spawnAt(spawn.x, spawn.y, spawn.z);

        // 5. Placera enhörningsmyntet vid målet
        const goal = level.goal || world.getGoalPosition();
        coin.setPosition(goal.x, goal.y, goal.z);

        // 6. Synka kameran till spelaren
        camera.followTarget(player);

        // 7. Visa bandetaljer
        this.showBanner(`🏆 ${level.name}`);
        console.log(`[LevelManager] Loaded ${level.name} (Seed: ${level.seed})`);
    }

    nextLevel() {
        if (this.currentLevelIndex + 1 < LEVELS.length) {
            this.showBanner('✨ Level Complete! Loading Next Level...', 1.5);
            setTimeout(() => {
                this.loadLevel(this.currentLevelIndex + 1);
            }, 800);
        } else {
            this.isVictory = true;
            this.showBanner('🎉 VICTORY! You collected all the unicorn coins!', 10.0);
            console.log('[LevelManager] Game completed!');
        }
    }

    restartCurrentLevel() {
        this.showBanner('💀 Fell into the void! Restarting level...', 2.0);
        this.loadLevel(this.currentLevelIndex);
    }

    update(dt) {
        // Uppdatera banner-timer
        if (this.bannerTimer > 0) {
            this.bannerTimer -= dt;
            if (this.bannerTimer <= 0 && this.bannerElement && !this.isVictory) {
                this.bannerElement.style.opacity = '0';
            }
        }

        // Uppdatera myntet
        coin.update(dt);

        // Kontrollera myntkollision
        if (coin.checkCollision(player)) {
            coin.active = false;
            this.nextLevel();
        }

        // Kontrollera om spelaren trillar ned i tomrummet
        if (player.y < -4.0) {
            this.restartCurrentLevel();
        }
    }

    render(renderer) {
        coin.render(renderer);
    }
}

export const levelManager = new LevelManager();
export default levelManager;
