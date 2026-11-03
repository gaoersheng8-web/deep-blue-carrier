/* ─────────────────────────────────────────────────────────
   原创海军氛围配乐《向海》· Web Audio 合成
   不包含《人民海军向前进》的旋律或录音。
   ───────────────────────────────────────────────────────── */

let ctx = null;
let master = null;
let delay = null;
let delayWet = null;
let timer = null;
let active = false;
let beat = 0;
let noiseBuffer = null;

const PAD_CHORDS = [
  [146.83, 174.61, 220.00, 293.66], // Dm add9
  [116.54, 146.83, 174.61, 233.08], // Bb
  [130.81, 164.81, 196.00, 261.63], // C
  [110.00, 146.83, 164.81, 220.00]  // Am / D
];

const MOTIF = [293.66, 349.23, 440.00, 392.00, 349.23, 293.66, 261.63, 293.66];

function makeNoise() {
  const length = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function build() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);

  delay = ctx.createDelay(1.2);
  delay.delayTime.value = 0.42;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.28;
  delayWet = ctx.createGain();
  delayWet.gain.value = 0.22;
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(delayWet);
  delayWet.connect(master);

  noiseBuffer = makeNoise();

  // ocean wash
  const ocean = ctx.createBufferSource();
  ocean.buffer = noiseBuffer;
  ocean.loop = true;
  const oceanFilter = ctx.createBiquadFilter();
  oceanFilter.type = "lowpass";
  oceanFilter.frequency.value = 360;
  const oceanGain = ctx.createGain();
  oceanGain.gain.value = 0.012;
  ocean.connect(oceanFilter);
  oceanFilter.connect(oceanGain);
  oceanGain.connect(master);
  ocean.start();

  // low drone
  [73.42, 110.0].forEach((freq, index) => {
    const osc = ctx.createOscillator();
    osc.type = index ? "triangle" : "sine";
    osc.frequency.value = freq;
    osc.detune.value = index ? 4 : -3;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 240;
    const gain = ctx.createGain();
    gain.gain.value = index ? 0.028 : 0.045;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start();
  });

  return true;
}

function schedulePad(index, at) {
  const chord = PAD_CHORDS[index % PAD_CHORDS.length];
  const duration = 8.6;
  chord.forEach((freq, note) => {
    const osc = ctx.createOscillator();
    osc.type = note === 0 ? "sine" : "triangle";
    osc.frequency.value = freq;
    osc.detune.value = (note - 1.5) * 3;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 620 + note * 90;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(0.018, at + 2.2);
    gain.gain.setValueAtTime(0.018, at + duration - 3.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(at);
    osc.stop(at + duration + 0.1);
  });
}

function horn(freq, at, duration, volume = 0.035) {
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = freq;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900, at);
  filter.frequency.exponentialRampToValueAtTime(420, at + duration);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.14);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  gain.connect(delay);
  osc.start(at);
  osc.stop(at + duration + 0.05);
}

function kick(at) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(105, at);
  osc.frequency.exponentialRampToValueAtTime(38, at + 0.28);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.16, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
  osc.connect(gain);
  gain.connect(master);
  osc.start(at);
  osc.stop(at + 0.45);
}

function snare(at) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  filter.Q.value = 0.8;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.035, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(at);
  src.stop(at + 0.2);
}

function tick() {
  if (!active || !ctx) return;
  const at = ctx.currentTime + 0.08;
  if (beat % 4 === 0) {
    schedulePad(beat / 4, at);
  }
  if (beat % 2 === 0) kick(at);
  else snare(at + 0.02);
  if (beat % 4 === 2) {
    const note = MOTIF[(beat / 4) % MOTIF.length];
    horn(note, at, 1.6, 0.026);
    horn(note * 1.5, at + 0.34, 1.15, 0.012);
  }
  if (beat % 8 === 4) {
    horn(MOTIF[(beat / 4 + 3) % MOTIF.length] * 2, at + 0.6, 1.1, 0.014);
  }
  beat += 1;
}

function startLoop() {
  if (timer) return;
  tick();
  timer = window.setInterval(tick, 2400);
}

function stopLoop() {
  if (timer) window.clearInterval(timer);
  timer = null;
}

export async function toggleMusic(on) {
  try {
    if (!ctx) {
      await build();
    }
    if (on) {
      await Promise.race([ctx.resume(), new Promise(resolve => setTimeout(resolve, 450))]);
      active = true;
      startLoop();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.4);
    } else {
      active = false;
      stopLoop();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    }
    return true;
  } catch (error) {
    console.error("music unavailable", error);
    return false;
  }
}
