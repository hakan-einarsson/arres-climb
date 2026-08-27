import { LEVELS } from './levels/levels.js';
import { world } from './world.js';
import { player } from './player.js';
import { coin } from './coin.js';
import { camera } from './camera.js';
import { playLevelComplete, playVictory, playFall } from './audio.js';

export function getLevel(index) {
    return LEVELS[index] || null;
}

const SAVE_KEY = 'ac_lvl';
const TIME_KEY = 'ac_time';
const BEST_KEY = 'ac_best';

export const getSavedLevel = () => { try { return +localStorage.getItem(SAVE_KEY) || 0; } catch { return 0; } };
export const saveProgress = (idx, t = 0) => { try { localStorage.setItem(SAVE_KEY, idx); localStorage.setItem(TIME_KEY, t); } catch { } };
export const resetProgress = () => { try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(TIME_KEY); } catch { } };
export const getBestTime = () => { try { return +localStorage.getItem(BEST_KEY) || 0; } catch { return 0; } };
export const saveBestTime = t => { try { localStorage.setItem(BEST_KEY, t); } catch { } };
export const fmtTime = t => (t / 60 | 0) + ':' + (t % 60 < 10 ? '0' : '') + (t % 60).toFixed(1);

export class LevelManager {
    constructor() {
        this.currentLevelIndex = 0;
        this.isVictory = false;
        this.victoryTimer = 0;
        this.playTime = 0;
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
        this.victoryTimer = 0;
        this.playTime = index === 0 ? 0 : (+localStorage.getItem(TIME_KEY) || 0);
        saveProgress(index, this.playTime);
        const level = getLevel(index);

        world.clearWorld();
        world.applyLevelConfig(level);
        world.createWorld(0, 0);

        const mods = Array.isArray(level) ? level[9] : level?.modifications;
        if (Array.isArray(mods)) {
            world.applyModifications(mods);
        }

        const rawSpawn = (Array.isArray(level) ? level[7] : level?.spawn) || world.getSpawnPosition();
        const spawn = Array.isArray(rawSpawn) ? { x: rawSpawn[0], y: rawSpawn[1], z: rawSpawn[2] } : rawSpawn;
        player.spawnAt(spawn.x, spawn.y, spawn.z);

        const rawGoal = (Array.isArray(level) ? level[8] : level?.goal) || world.getGoalPosition();
        const goal = Array.isArray(rawGoal) ? { x: rawGoal[0], y: rawGoal[1], z: rawGoal[2] } : rawGoal;
        coin.setPosition(goal.x, goal.y, goal.z);

        camera.followTarget(player);
        this.showBanner('Level ' + (this.currentLevelIndex + 1));
    }

    nextLevel() {
        if (this.currentLevelIndex + 1 < LEVELS.length) {
            this.showBanner('Level Complete!', 1.5);
            playLevelComplete();
            saveProgress(this.currentLevelIndex + 1, this.playTime);
            setTimeout(() => this.loadLevel(this.currentLevelIndex + 1), 800);
        } else {
            this.isVictory = true;
            this.victoryTimer = 0;
            const prev = getBestTime();
            if (!prev || this.playTime < prev) saveBestTime(this.playTime);
            const vt = document.getElementById('vt');
            if (vt) vt.textContent = 'TIME: ' + fmtTime(this.playTime) + (prev && this.playTime >= prev ? ' (BEST: ' + fmtTime(prev) + ')' : ' - NEW RECORD!');
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

        if (this.isVictory) {
            this.victoryTimer += dt;
            if (this.victoryTimer >= 3.5) {
                const es = document.getElementById('es');
                if (es && es.style.display !== 'flex') {
                    es.style.display = 'flex';
                }
            }
            return;
        }

        this.playTime += dt;
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
