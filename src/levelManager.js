import { LEVELS } from './levels/levels.js';
import { world } from './world.js';
import { player } from './player.js';
import { coin } from './coin.js';
import { camera } from './camera.js';
import { playCoin, playLevelComplete, playVictory, playFall } from './audio.js';

export function getLevel(index) {
    const l = LEVELS[index];
    if (!l) return null;
    if (Array.isArray(l)) {
        return {
            seed: l[0],
            size: l[1],
            maxHeight: l[2],
            islandFactor: l[3],
            scale: l[4],
            threshold: l[5],
            heightTypeMap: l[6],
            spawn: l[7],
            goal: l[8],
            modifications: l[9] || []
        };
    }
    return l;
}

const SAVE_KEY = 'ac_lvl';

export function getSavedLevel() {
    try {
        const val = localStorage.getItem(SAVE_KEY);
        return val !== null ? parseInt(val, 10) || 0 : 0;
    } catch {
        return 0;
    }
}

export function saveProgress(idx) {
    try {
        localStorage.setItem(SAVE_KEY, idx.toString());
    } catch {}
}

export function resetProgress() {
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch {}
}

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
        saveProgress(index);
        this.isVictory = false;
        const level = getLevel(index);

        world.clearWorld();
        world.applyLevelConfig(level);
        world.createWorld(0, 0);

        if (Array.isArray(level.modifications)) {
            world.applyModifications(level.modifications);
        }

        const rawSpawn = level.spawn || world.getSpawnPosition();
        const spawn = Array.isArray(rawSpawn) ? { x: rawSpawn[0], y: rawSpawn[1], z: rawSpawn[2] } : rawSpawn;
        player.spawnAt(spawn.x, spawn.y, spawn.z);

        const rawGoal = level.goal || world.getGoalPosition();
        const goal = Array.isArray(rawGoal) ? { x: rawGoal[0], y: rawGoal[1], z: rawGoal[2] } : rawGoal;
        coin.setPosition(goal.x, goal.y, goal.z);

        camera.followTarget(player);
        this.showBanner('Level ' + (this.currentLevelIndex + 1));
    }

    nextLevel() {
        if (this.currentLevelIndex + 1 < LEVELS.length) {
            this.showBanner('Level Complete!', 1.5);
            playLevelComplete();
            setTimeout(() => this.loadLevel(this.currentLevelIndex + 1), 800);
        } else {
            this.isVictory = true;
            this.showBanner('VICTORY! All Coins Found!', 10.0);
            playVictory();
        }
    }

    restartCurrentLevel() {
        playFall();
        this.showBanner('Fell into the void!', 1.8);
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
            playCoin();
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
