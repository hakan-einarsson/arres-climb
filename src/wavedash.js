// Wavedash SDK integration (https://docs.wavedash.com)
// All calls are guarded so the game behaves identically when not running
// on the Wavedash platform (e.g. local dev, or other web builds).

const LEADERBOARD_NAME = 'fastest-runs';
const SAVE_PATH = 'save.json';
const ACHIEVEMENT_FIRST_COMPLETION = 'FIRST_COMPLETION';
const ACHIEVEMENT_SPEED_RUNNER = 'SPEED_RUNNER';
const SPEED_RUNNER_THRESHOLD_SECONDS = 150; // 2m30s

let leaderboardId = null;

export const wdAvailable = () => typeof Wavedash !== 'undefined';

// Initializes the SDK and resolves the "fastest-runs" leaderboard id so
// later score submissions don't need to look it up again.
export function wdInit() {
    if (!wdAvailable()) return;
    try {
        Wavedash.init({ debug: false });
        Wavedash.getOrCreateLeaderboard(
            LEADERBOARD_NAME,
            Wavedash.LeaderboardSortOrder.ASC,
            Wavedash.LeaderboardDisplayType.TIME_MILLISECONDS
        ).then(res => {
            console.log('Leaderboard lookup result:', res);
            if (res && res.success) leaderboardId = res.data.id;
        }).catch(() => { });
    } catch (e) {
        console.error('Failed to initialize Wavedash SDK or leaderboard:', e);
    }
}

// Pushes { level, playTime } to Wavedash cloud save. Fire-and-forget.
export function wdSaveCloud(level, playTime) {
    if (!wdAvailable()) return;
    try {
        const data = new TextEncoder().encode(JSON.stringify({ level, playTime }));
        Wavedash.writeLocalFile(SAVE_PATH, data)
            .then(() => Wavedash.uploadRemoteFile(SAVE_PATH))
            .catch(() => { });
    } catch { }
}

// Downloads the cloud save and returns { level, playTime } or null.
export async function wdLoadCloud() {
    if (!wdAvailable()) return null;
    try {
        const dl = await Wavedash.downloadRemoteFile(SAVE_PATH);
        if (!dl || !dl.success) return null;
        const bytes = await Wavedash.readLocalFile(SAVE_PATH);
        return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
        return null;
    }
}

// Submits a completed run's total play time (seconds) to the leaderboard.
export function wdSubmitScore(playTime) {
    if (!wdAvailable() || !leaderboardId) return;
    try {
        console.log('Submitting score to leaderboard:', playTime);
        Wavedash.uploadLeaderboardScore(leaderboardId, Math.round(playTime * 1000), true).catch(() => { });
    } catch { }
}

// Unlocks the "beat the game" achievement, plus "speed runner" if the
// player finished the whole game in under 2m30s.
export function wdUnlockCompletion(playTime) {
    if (!wdAvailable()) return;
    try {
        Wavedash.setAchievement(ACHIEVEMENT_FIRST_COMPLETION, true);
        if (playTime < SPEED_RUNNER_THRESHOLD_SECONDS) {
            Wavedash.setAchievement(ACHIEVEMENT_SPEED_RUNNER, true);
        }
    } catch (e) {
        console.error('Failed to unlock completion achievements:', e);
    }
}
