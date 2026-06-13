/* Web Audio API Sound Synthesizer for Romantic Ambience & SFX */
let audioCtx = null;
let masterVolume = null;
let delayNode = null;
let delayFeedback = null;
let isMusicPlaying = false;
let chordInterval = null;
let melodyInterval = null;
let useSitareSong = false;
let sitareAudio = null;
// Scale notes frequencies (dreamy C Major / A Minor pentatonic scale)
const NOTES = {
  C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00, A3: 220.00,
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.00,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760.00
};
// Dreamy Chord Progression (4 bars, beautiful jazz-adjacent voicings)
const CHORDS = [
  // F Major 7 (Warm & hopeful)
  { root: 87.31, notes: [NOTES.C4, NOTES.E4, NOTES.A4, NOTES.C5] }, // F2 root, C4-E4-A4-C5
  // C Major 7 (Stable & peaceful)
  { root: 130.81, notes: [NOTES.E4, NOTES.G4, NOTES.B4 || 493.88, NOTES.E5] }, // C3 root, E4-G4-B4-E5
  // A minor 9 (Melancholic & deep)
  { root: 110.00, notes: [NOTES.C4, NOTES.E4, NOTES.G4, NOTES.C5] }, // A2 root, C4-E4-G4-C5
  // G dominant 11 (Tension resolving)
  { root: 98.00, notes: [NOTES.D4, NOTES.F4 || 349.23, NOTES.A4, NOTES.D5] } // G2 root, D4-F4-A4-D5
];
let currentChordIndex = 0;
// Initialize the Audio Context (must be triggered by user gesture)
function initAudio() {
  if (audioCtx) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();
  // 1. Master Volume Node
  masterVolume = audioCtx.createGain();
  masterVolume.gain.setValueAtTime(0.08, audioCtx.currentTime); // Low background level
  // 2. Spatial Delay/Echo Effect (Creates premium depth)
  delayNode = audioCtx.createDelay(1.0);
  delayNode.delayTime.setValueAtTime(0.45, audioCtx.currentTime); // 450ms delay
  delayFeedback = audioCtx.createGain();
  delayFeedback.gain.setValueAtTime(0.4, audioCtx.currentTime); // 40% feedback
  // Connect Delay Loop
  delayNode.connect(delayFeedback);
  delayFeedback.connect(delayNode);
  // Connect Output Paths
  masterVolume.connect(audioCtx.destination);
  delayNode.connect(masterVolume);
  // Check for sitare.mp3 song availability
 sitareAudio = document.getElementById('sitare-audio');
useSitareSong = true;
  
  // Expose global triggers
  window.triggerHoverSound = playHoverChime;
  window.triggerHeartExplosionSound = playExplosionSound;
  window.triggerEnvelopeSound = playPaperFriction;
}
// Start/Resume background melody loop
function startBackgroundMusic() {
  if (!audioCtx) initAudio();

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  isMusicPlaying = true;

  document.getElementById('music-toggle').classList.add('audio-playing');
  document.querySelector('.music-status').innerText = "Playing Sitare";

  sitareAudio = document.getElementById('sitare-audio');

  if (sitareAudio) {
    sitareAudio.volume = 0.5;
    sitareAudio.currentTime = 0;
    sitareAudio.play();
  }
}

function playSynthLoops() {
  document.querySelector('.music-status').innerText = "Soundscape Active";
  // Play immediately
  playChordCycle();
  // Set intervals for repeating
  chordInterval = setInterval(playChordCycle, 5000); // New chord every 5 seconds
  melodyInterval = setInterval(playRandomMelodyNote, 1250); // Soft piano embellishments
}
// Stop background melody loop
function stopBackgroundMusic() {
  isMusicPlaying = false;
  document.getElementById('music-toggle').classList.remove('audio-playing');
  document.querySelector('.music-status').innerText = "Play Soundscape";
  
  if (sitareAudio) {
    sitareAudio.pause();
  }
  
  if (chordInterval) clearInterval(chordInterval);
  if (melodyInterval) clearInterval(melodyInterval);
}
// Synthesize a soft synth pad chord
function playChordCycle() {
  if (!isMusicPlaying || !audioCtx) return;
  const chord = CHORDS[currentChordIndex];
  const now = audioCtx.currentTime;
  const duration = 4.8; // Hold chord for 4.8 seconds
  // Synthesize Root Bass note
  playWarmOsc(chord.root, 0.05, duration, 'triangle', now);
  // Synthesize individual chord notes
  chord.notes.forEach((freq, index) => {
    // Add a tiny humanization delay to arpeggiate slightly
    const strumDelay = index * 0.08;
    playWarmOsc(freq, 0.03, duration - strumDelay, 'sine', now + strumDelay);
  });
  // Cycle to next chord
  currentChordIndex = (currentChordIndex + 1) % CHORDS.length;
}
// Synthesize randomized sweet high piano notes fitting the scale
function playRandomMelodyNote() {
  if (!isMusicPlaying || !audioCtx || Math.random() > 0.6) return; // 60% chance to play on beat
  const now = audioCtx.currentTime;
  const chord = CHORDS[(currentChordIndex - 1 + CHORDS.length) % CHORDS.length];
  
  // Pick a random note from the active chord or high pentatonic notes
  const candidateNotes = [...chord.notes, NOTES.E5, NOTES.G5, NOTES.A5, NOTES.C6, NOTES.E6];
  const freq = candidateNotes[Math.floor(Math.random() * candidateNotes.length)];
  
  // Play a delicate, high bell-like sound
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  
  // Piano-like envelope: instant attack, long exponential decay
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.04, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
  osc.connect(gain);
  // Route through delay node for spaciousness
  gain.connect(delayNode);
  gain.connect(masterVolume);
  osc.start(now);
  osc.stop(now + 2.6);
}
// Helper: Custom oscillator player with lowpass filter for warm tone
function playWarmOsc(frequency, volume, duration, type, startTime) {
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  // Filter out sharp high frequencies for a warm lofi feel
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, startTime);
  // Volume envelope (Smooth fade in and fade out)
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.5); // 0.5s attack
  gainNode.gain.setValueAtTime(volume, startTime + duration - 1.0);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // 1s release
  osc.connect(filter);
  filter.connect(gainNode);
  
  // Send pad partly to delay
  gainNode.connect(masterVolume);
  if (type === 'sine') {
    gainNode.connect(delayNode);
  }
  osc.start(startTime);
  osc.stop(startTime + duration);
}
// SFX 1: Hover Chime (pentatonic sparkle)
function playHoverChime() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  // Trigger 3 quick ascending notes
  const scale = [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.A5, NOTES.C6];
  const offsetIndex = Math.floor(Math.random() * 2); // Start lower or higher
  for (let i = 0; i < 3; i++) {
    const noteTime = now + (i * 0.05);
    const freq = scale[offsetIndex + i];
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteTime);
    gainNode.gain.setValueAtTime(0, noteTime);
    gainNode.gain.linearRampToValueAtTime(0.025, noteTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.4);
    osc.connect(gainNode);
    gainNode.connect(masterVolume);
    osc.start(noteTime);
    osc.stop(noteTime + 0.45);
  }
}
// SFX 2: Heart Explosion (fireworks boom and shimmer)
function playExplosionSound() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  // 1. Deep Bass Impact
  const bassOsc = audioCtx.createOscillator();
  const bassGain = audioCtx.createGain();
  
  bassOsc.type = 'triangle';
  bassOsc.frequency.setValueAtTime(65.41, now); // C2
  bassOsc.frequency.exponentialRampToValueAtTime(32.7, now + 0.6); // Pitch drop
  bassGain.gain.setValueAtTime(0, now);
  bassGain.gain.linearRampToValueAtTime(0.25, now + 0.02);
  bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
  bassOsc.connect(bassGain);
  bassGain.connect(masterVolume);
  
  bassOsc.start(now);
  bassOsc.stop(now + 0.85);
  // 2. High Shimmer Sweep
  const sweepOsc = audioCtx.createOscillator();
  const sweepGain = audioCtx.createGain();
  sweepOsc.type = 'sine';
  sweepOsc.frequency.setValueAtTime(500, now);
  sweepOsc.frequency.exponentialRampToValueAtTime(3500, now + 0.25); // Fast sweep up
  sweepGain.gain.setValueAtTime(0, now);
  sweepGain.gain.linearRampToValueAtTime(0.06, now + 0.05);
  sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  sweepOsc.connect(sweepGain);
  sweepGain.connect(delayNode); // Feed heavily into delay loop
  sweepGain.connect(masterVolume);
  sweepOsc.start(now);
  sweepOsc.stop(now + 0.65);
}
// SFX 3: Paper Rustle Friction (using synthesized white noise)
function playPaperFriction() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const bufferSize = audioCtx.sampleRate * 0.35; // 350ms of sound
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  // Fill buffer with white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;
  // Bandpass filter to sound like thin paper sliding
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1400, now);
  filter.Q.setValueAtTime(3.0, now);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  noiseNode.connect(filter);
  filter.connect(gain);
  gain.connect(masterVolume);
  noiseNode.start(now);
  noiseNode.stop(now + 0.35);
}
