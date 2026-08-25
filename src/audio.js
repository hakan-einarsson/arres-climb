// ---------------------------------------------------------------------------
// Audio Context & ZzFX Micro Synth
// ---------------------------------------------------------------------------
let audioCtx = null;
let isMuted = false;
let isMusicPlaying = false;
let schedulerTimer = null;
let zzfxV = 0.3;

export function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

// Inlined ZzFX Micro (Frank Force, MIT)
export const zzfx = (...p) => {
    const ctx = getAudioContext();
    const R = 44100;
    let [v=1, r=.05, f=220, a=0, s=0, d=.1, sh=0, sc=1, sl=0, ds=0, pj=0, pt=0, rt=0, n=0, m=0, bc=0, dl=0, sv=1, dc=0, tr=0, fl=0] = p;
    let PI2 = Math.PI * 2, abs = Math.abs, sign = x => x < 0 ? -1 : 1;
    let startSlide = sl *= 500 * PI2 / R / R;
    let startFreq = f *= (1 + r * 2 * Math.random() - r) * PI2 / R;
    let mod = 0, rep = 0, cr = 0, j = 1, b = [], t = 0, S = 0;

    let src = ctx.createBufferSource(), buf;
    let q = 2, w = PI2 * abs(fl) * 2 / R, cos = Math.cos(w), alpha = Math.sin(w) / 2 / q;
    let a0 = 1 + alpha, a1 = -2 * cos / a0, a2 = (1 - alpha) / a0;
    let b0 = (1 + sign(fl) * cos) / 2 / a0, b1 = -(sign(fl) + cos) / a0, b2 = b0;
    let x2 = 0, x1 = 0, y2 = 0, y1 = 0;

    a = a * R || 9;
    dc *= R; s *= R; d *= R; dl *= R;
    ds *= 500 * PI2 / (R ** 3);
    m *= PI2 / R; pj *= PI2 / R; pt *= R;
    rt = rt * R | 0;
    v *= zzfxV;

    for (let len = a + dc + s + d + dl | 0, i = 0; i < len; b[i++] = S * v) {
        if (!(++cr % (bc * 100 | 0))) {
            S = sh ? sh > 1 ? sh > 2 ? sh > 3 ? sh > 4 ?
                (t / PI2 % 1 < sc / 2) * 2 - 1 :
                Math.sin(t ** 3) :
                Math.max(Math.min(Math.tan(t), 1), -1) :
                1 - (2 * t / PI2 % 2 + 2) % 2 :
                1 - 4 * abs(Math.round(t / PI2) - t / PI2) :
                Math.sin(t);

            S = (rt ? 1 - tr + tr * Math.sin(PI2 * i / rt) : 1) *
                (sh > 4 ? S : sign(S) * abs(S) ** sc) *
                (i < a ? i / a :
                 i < a + dc ? 1 - ((i - a) / dc) * (1 - sv) :
                 i < a + dc + s ? sv :
                 i < len - dl ? (len - i - dl) / d * sv : 0);

            S = dl ? S / 2 + (dl > i ? 0 : (i < len - dl ? 1 : (len - i) / dl) * b[i - dl | 0] / 2 / v) : S;
            if (fl) S = y1 = b2 * x2 + b1 * (x2 = x1) + b0 * (x1 = S) - a2 * y2 - a1 * (y2 = y1);
        }
        f = (f += sl += ds) * Math.cos(m * mod++);
        t += f + f * n * Math.sin(i ** 5);
        if (j && ++j > pt) { f += pj; startFreq += pj; j = 0; }
        if (rt && !(++rep % rt)) { f = startFreq; sl = startSlide; j ||= 1; }
    }

    buf = ctx.createBuffer(1, b.length, R);
    buf.getChannelData(0).set(b);
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start();
    return src;
};

// Master gains
let masterGain = null;
let musicGain = null;
const DEFAULT_SFX_VOL = 0.3;
const DEFAULT_MUSIC_VOL = 0.32;

function initNodes() {
    const ctx = getAudioContext();
    if (masterGain) return;

    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(isMuted ? 0 : 1.0, ctx.currentTime);
    masterGain.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.setValueAtTime(DEFAULT_MUSIC_VOL, ctx.currentTime);
    musicGain.connect(masterGain);

    zzfxV = isMuted ? 0 : DEFAULT_SFX_VOL;
}

export function unlockAudio() {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    initNodes();
    if (!isMusicPlaying && !isMuted) {
        startMusic();
    }
}

export function toggleMute() {
    initNodes();
    isMuted = !isMuted;
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (isMuted) {
        masterGain.gain.setTargetAtTime(0, now, 0.05);
        zzfxV = 0;
    } else {
        masterGain.gain.setTargetAtTime(1.0, now, 0.05);
        zzfxV = DEFAULT_SFX_VOL;
        if (!isMusicPlaying) startMusic();
    }
    return isMuted;
}

export function getIsMuted() {
    return isMuted;
}

// ---------------------------------------------------------------------------
// Sound Effects
// ---------------------------------------------------------------------------
const SFX = {
    jump: [0.9, 0.05, 340, 0.01, 0.06, 0.12, 0, 1.8, 8.5, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0.04],
    land: [0.45, 0.05, 110, 0.005, 0.02, 0.06, 0, 0, -3.5, 0, 0, 0, 0, 0.6, 0, 0.1, 0, 0.7, 0.02],
    rainbow: [1.3, 0.05, 480, 0.02, 0.22, 0.35, 1, 2.2, 12, 1, 240, 0.07, 0.05, 0, 0.2, 0, 0.06, 0.6, 0.06],
    rotate: [0.35, 0.02, 580, 0.005, 0.015, 0.03, 1, 0.5, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0.8, 0.01],
    coin: [1.1, 0, 880, 0.01, 0.12, 0.25, 0, 0, 0, 0, 440, 0.05, 0, 0, 0, 0, 0.05, 0.8, 0.04],
    fall: [0.8, 0.05, 260, 0.01, 0.15, 0.45, 0, 0, -11, -2, 0, 0, 0, 0.3, 0, 0.15, 0, 0.6, 0.1],
    levelComplete: [1.2, 0, 523.25, 0.02, 0.2, 0.4, 0, 1.2, 4, 0, 261.6, 0.08, 0.06, 0, 0, 0, 0.1, 0.7, 0.06]
};

function playSfx(p) {
    if (isMuted) return;
    try {
        unlockAudio();
        zzfx(...p);
    } catch {}
}

export const playJump = () => playSfx(SFX.jump);
export const playLand = () => playSfx(SFX.land);
export const playRainbowBounce = () => playSfx(SFX.rainbow);
export const playCameraRotate = () => playSfx(SFX.rotate);
export const playCoin = () => playSfx(SFX.coin);
export const playFall = () => playSfx(SFX.fall);
export const playLevelComplete = () => playSfx(SFX.levelComplete);

export function playVictory() {
    if (isMuted) return;
    unlockAudio();
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        setTimeout(() => {
            if (!isMuted) zzfx(1.1, 0, freq, 0.02, 0.18, 0.35, 0, 1.1, 0, 0, 0, 0, 0, 0, 0, 0, 0.05, 0.8, 0.04);
        }, i * 140);
    });
}

// ---------------------------------------------------------------------------
// Chiptune Music Engine (BGM)
// ---------------------------------------------------------------------------
const midiFreq = m => m ? 440 * (2 ** ((m - 69) / 12)) : 0;

const BASS_LINE = [
    36,0,36,0, 43,0,48,0, 36,0,36,0, 40,0,43,0,
    40,0,40,0, 47,0,52,0, 40,0,40,0, 43,0,47,0,
    41,0,41,0, 48,0,53,0, 41,0,41,0, 45,0,48,0,
    43,0,43,0, 50,0,55,0, 43,0,41,0, 40,0,38,0,
    45,0,45,0, 52,0,57,0, 45,0,45,0, 48,0,52,0,
    40,0,40,0, 47,0,52,0, 40,0,40,0, 43,0,47,0,
    41,0,41,0, 48,0,53,0, 41,0,41,0, 45,0,48,0,
    43,0,43,0, 50,0,55,0, 43,0,43,45, 47,48,50,0
];

const ARP_LINE = [
    60,64,67,71, 72,71,67,64, 60,64,67,71, 72,76,79,76,
    64,67,71,74, 76,74,71,67, 64,67,71,74, 76,79,83,79,
    65,69,72,76, 77,76,72,69, 65,69,72,76, 77,81,84,81,
    67,71,74,77, 79,77,74,71, 67,71,74,77, 79,83,86,83,
    69,72,76,79, 81,79,76,72, 69,72,76,79, 81,84,88,84,
    64,67,71,74, 76,74,71,67, 64,67,71,74, 76,79,83,79,
    65,69,72,76, 77,76,72,69, 65,69,72,76, 77,81,84,81,
    67,72,74,79, 67,72,74,79, 67,71,74,79, 83,86,91,86
];

const LEAD_LINE = [
    76,0,0,0, 79,0,0,0, 84,0,83,0, 79,0,76,0,
    79,0,0,0, 76,0,74,0, 76,0,0,0, 0,0,0,0,
    81,0,0,0, 84,0,0,0, 88,0,86,0, 84,0,81,0,
    83,0,0,0, 79,0,81,0, 83,0,0,0, 0,0,86,0,
    84,0,0,0, 88,0,0,0, 93,0,91,0, 88,0,86,0,
    88,0,0,0, 83,0,79,0, 76,0,0,0, 0,0,0,0,
    77,0,81,0, 84,0,88,0, 86,0,84,0, 81,0,79,0,
    79,0,81,0, 83,0,86,0, 84,0,0,0, 0,0,0,0
];

const DRUM_PATTERN = [
    1,3,3,3, 2,3,3,3, 1,3,1,3, 2,3,3,4,
    1,3,3,3, 2,3,3,3, 1,3,1,3, 2,3,4,3,
    1,3,3,3, 2,3,3,3, 1,3,1,3, 2,3,3,4,
    1,3,3,3, 2,3,3,3, 1,3,1,1, 2,3,4,4,
    1,3,3,3, 2,3,3,3, 1,3,1,3, 2,3,3,4,
    1,3,3,3, 2,3,3,3, 1,3,1,3, 2,3,4,3,
    1,3,3,3, 2,3,3,3, 1,3,1,3, 2,3,3,4,
    1,3,1,3, 2,3,1,3, 2,2,3,3, 2,4,4,4
];

const TOTAL_STEPS = 128;
const BPM = 126;
const SECONDS_PER_STEP = 15 / BPM; // 0.119s

let currentStep = 0;
let nextStepTime = 0;
let noiseBuffer = null;

function getNoiseBuffer(ctx) {
    if (!noiseBuffer) {
        const size = ctx.sampleRate * 0.4;
        noiseBuffer = ctx.createBuffer(1, size, ctx.sampleRate);
        const out = noiseBuffer.getChannelData(0);
        for (let i = 0; i < size; i++) out[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
}

function playTone(freq, time, duration, type, volume, attack = 0.01, decay = 0.1, filterFreq = 0) {
    if (!freq || !musicGain) return;
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(volume, time + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration + decay);

    if (filterFreq > 0) {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(filterFreq, time);
        osc.connect(f);
        f.connect(g);
    } else {
        osc.connect(g);
    }

    g.connect(musicGain);
    osc.start(time);
    osc.stop(time + duration + decay + 0.05);
}

function playDrum(type, time) {
    if (!type || !musicGain) return;
    const ctx = getAudioContext();

    if (type === 1) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, time);
        osc.frequency.exponentialRampToValueAtTime(35, time + 0.08);
        g.gain.setValueAtTime(0.55, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
        osc.connect(g);
        g.connect(musicGain);
        osc.start(time);
        osc.stop(time + 0.1);
    } else if (type === 2) {
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.setValueAtTime(1200, time);
        f.Q.setValueAtTime(1.2, time);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.28, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        noise.connect(f);
        f.connect(g);
        g.connect(musicGain);
        noise.start(time);
        noise.stop(time + 0.13);
    } else {
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const f = ctx.createBiquadFilter();
        f.type = 'highpass';
        f.frequency.setValueAtTime(7000, time);
        const dur = type === 4 ? 0.07 : 0.03;
        const g = ctx.createGain();
        g.gain.setValueAtTime(type === 4 ? 0.16 : 0.09, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + dur);
        noise.connect(f);
        f.connect(g);
        g.connect(musicGain);
        noise.start(time);
        noise.stop(time + dur + 0.01);
    }
}

function scheduleNotes() {
    if (!isMusicPlaying || isMuted) return;
    const ctx = getAudioContext();
    const lookahead = 0.15;

    while (nextStepTime < ctx.currentTime + lookahead) {
        const step = currentStep % TOTAL_STEPS;
        const time = nextStepTime;

        const bFreq = midiFreq(BASS_LINE[step]);
        if (bFreq) playTone(bFreq, time, SECONDS_PER_STEP * 1.1, 'triangle', 0.42, 0.01, 0.06, 500);

        const aFreq = midiFreq(ARP_LINE[step]);
        if (aFreq) playTone(aFreq, time, SECONDS_PER_STEP * 0.8, 'sine', 0.18, 0.01, 0.08);

        const lFreq = midiFreq(LEAD_LINE[step]);
        if (lFreq) playTone(lFreq, time, SECONDS_PER_STEP * 2.2, 'triangle', 0.32, 0.04, 0.18, 2200);

        const drum = DRUM_PATTERN[step];
        if (drum) playDrum(drum, time);

        nextStepTime += SECONDS_PER_STEP;
        currentStep++;
    }
}

export function startMusic() {
    initNodes();
    if (isMusicPlaying) return;
    const ctx = getAudioContext();
    isMusicPlaying = true;
    nextStepTime = ctx.currentTime + 0.05;
    currentStep = 0;
    if (schedulerTimer) clearInterval(schedulerTimer);
    schedulerTimer = setInterval(scheduleNotes, 35);
}

export function stopMusic() {
    isMusicPlaying = false;
    if (schedulerTimer) {
        clearInterval(schedulerTimer);
        schedulerTimer = null;
    }
}
