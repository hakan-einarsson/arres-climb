import { LEVELS } from './levels/levels.js';
import { world } from './world.js';
import { player } from './player.js';
import { coin } from './coin.js';
import { camera } from './camera.js';

export class LevelManager {
    constructor() {
        this.currentLevelIndex = 0;
        this.isVictory = false;
        this.bannerElement = typeof document !== 'undefined' ? document.getElementById('b') : null;
        this.bannerTimer = 0;
    }

    showBanner(text, duration = 3.5) {
        if (!this.bannerElement && typeof document !== 'undefined') {
            this.bannerElement = document.getElementById('b');
        }
        if (this.bannerElement) {
            this.bannerElement.innerHTML = text;
            this.bannerElement.style.opacity = '1';
            this.bannerTimer = duration;
        }
    }

    loadLevel(index = 0) {
        if (index < 0 || index >= LEVELS.length) {
            index = 0;
        }

        this.currentLevelIndex = index;
        this.isVictory = false;
        const level = LEVELS[index];

        world.clearWorld();
        world.applyLevelConfig(level);
        world.createWorld(0, 0);

        if (Array.isArray(level.modifications)) {
            world.applyModifications(level.modifications);
        }

        const spawn = level.spawn || world.getSpawnPosition();
        player.spawnAt(spawn.x, spawn.y, spawn.z);

        const goal = level.goal || world.getGoalPosition();
        coin.setPosition(goal.x, goal.y, goal.z);

        camera.followTarget(player);
        this.showBanner(`🏆 ${level.name}`);
    }

    nextLevel() {
        if (this.currentLevelIndex + 1 < LEVELS.length) {
            this.showBanner('✨ Level Complete!', 1.5);
            setTimeout(() => this.loadLevel(this.currentLevelIndex + 1), 800);
        } else {
            this.isVictory = true;
            this.showBanner('🎉 VICTORY! All Coins Found!', 10.0);
        }
    }

    restartCurrentLevel() {
        this.showBanner('💀 Fell into the void!', 1.8);
        this.loadLevel(this.currentLevelIndex);
    }

    update(dt) {
        if (this.bannerTimer > 0) {
            this.bannerTimer -= dt;
            if (this.bannerTimer <= 0 && this.bannerElement && !this.isVictory) {
                this.bannerElement.style.opacity = '0';
            }
        }

        coin.update(dt);

        if (coin.checkCollision(player)) {
            coin.active = false;
            this.nextLevel();
        }

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
