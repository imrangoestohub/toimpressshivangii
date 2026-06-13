/* 3D WebGL Three.js Particle Heart Scene */

let scene, camera, renderer, particleSystem, backgroundParticles;
let heartGroup;
let container = document.getElementById('canvas-container');

// Particle parameters
const particleCount = 4000;
let positions, originalPositions, colors, velocities;
let isExploding = false;
let explosionTimer = 0;
let returnProgress = 0;
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let heartTargetX = 0;
let heartTargetY = 0;
let heartTargetScale = 1.0;

// Initialize Three.js Scene
function initThree() {
  // 1. Create Scene & Camera
  scene = new THREE.Scene();
  
  // Fog for deep atmosphere
  scene.fog = new THREE.FogExp2(0x031410, 0.02);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 22;

  // 2. Create WebGL Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio to 2 for performance
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // Heart Group
  heartGroup = new THREE.Group();
  scene.add(heartGroup);

  // 3. Create Heart Particle System
  createHeartParticles();

  // 4. Create Background Starfield
  createBackgroundStars();

  // 5. Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffccd5, 1.2);
  directionalLight.position.set(5, 5, 10);
  scene.add(directionalLight);

  // 6. Listeners
  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('mousemove', onMouseMove, false);
  window.addEventListener('click', onSceneClick, false);

  // 7. Start Loop
  animate();
}

// Create the 3D Heart using parametric formulas
function createHeartParticles() {
  const geometry = new THREE.BufferGeometry();
  
  positions = new Float32Array(particleCount * 3);
  originalPositions = new Float32Array(particleCount * 3);
  colors = new Float32Array(particleCount * 3);
  velocities = new Float32Array(particleCount * 3);

  // Palette: Soft Pink (50%), Rose Gold (30%), Emerald Accent (20%)
  const colorPink = new THREE.Color(0xffb3c1);
  const colorRoseGold = new THREE.Color(0xd4a373);
  const colorEmerald = new THREE.Color(0x74c69d);

  for (let i = 0; i < particleCount; i++) {
    // 1. Generate math heart coordinate
    // Angle t around the heart shape
    const t = Math.PI * 2 * Math.random();
    
    // Heart Outline Formulas (rotated to face camera correctly)
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    
    // Extrude depth along Z, shape thickness thinner towards the tips
    const depthScale = Math.cos(t * 0.5); // Thinner at the bottom tip
    const z = (Math.random() - 0.5) * 12 * Math.abs(depthScale);

    // Scaling factor to fit view
    const scale = 0.28;
    
    // Center alignment
    let posX = x * scale;
    let posY = y * scale + 1.5; // Offset upwards slightly
    let posZ = z * scale;

    // Add random inner volume scattering so it's a solid 3D cloud, not just a thin shell
    const innerScattering = Math.random();
    posX *= innerScattering;
    posY *= innerScattering;
    posZ *= innerScattering;

    // Fine-grained noise for soft celestial look
    const noise = 0.25;
    posX += (Math.random() - 0.5) * noise;
    posY += (Math.random() - 0.5) * noise;
    posZ += (Math.random() - 0.5) * noise;

    positions[i * 3] = posX;
    positions[i * 3 + 1] = posY;
    positions[i * 3 + 2] = posZ;

    // Store starting coordinates for reset mapping
    originalPositions[i * 3] = posX;
    originalPositions[i * 3 + 1] = posY;
    originalPositions[i * 3 + 2] = posZ;

    // 2. Select Particle Color based on weighted probability
    const rand = Math.random();
    let finalColor;
    if (rand < 0.50) {
      finalColor = colorPink.clone().lerp(new THREE.Color(0xffe5ec), Math.random() * 0.4);
    } else if (rand < 0.80) {
      finalColor = colorRoseGold.clone().lerp(new THREE.Color(0xb76e79), Math.random() * 0.4);
    } else {
      finalColor = colorEmerald.clone().lerp(new THREE.Color(0x52b788), Math.random() * 0.4);
    }

    colors[i * 3] = finalColor.r;
    colors[i * 3 + 1] = finalColor.g;
    colors[i * 3 + 2] = finalColor.b;

    // Initialize velocities to zero
    velocities[i * 3] = 0;
    velocities[i * 3 + 1] = 0;
    velocities[i * 3 + 2] = 0;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Generate glowing particle texture dynamically using Canvas (so we don't need external files)
  const texture = createParticleTexture();

  // Create point material
  const material = new THREE.PointsMaterial({
    size: 0.28,
    map: texture,
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  particleSystem = new THREE.Points(geometry, material);
  heartGroup.add(particleSystem);
}

// Background space stars orbiting
function createBackgroundStars() {
  const count = 1000;
  const geometry = new THREE.BufferGeometry();
  const bgPositions = new Float32Array(count * 3);
  const bgColors = new Float32Array(count * 3);

  const colorPink = new THREE.Color(0xffccd5);
  const colorGold = new THREE.Color(0xd4a373);

  for (let i = 0; i < count; i++) {
    // Distribute randomly in a spherical shell around the center
    const radius = 40 + Math.random() * 80;
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    
    bgPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    bgPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    bgPositions[i * 3 + 2] = radius * Math.cos(phi);

    // Soft yellow/pink stars
    const color = Math.random() > 0.5 ? colorPink : colorGold;
    bgColors[i * 3] = color.r * 0.8;
    bgColors[i * 3 + 1] = color.g * 0.8;
    bgColors[i * 3 + 2] = color.b * 0.8;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.4,
    map: createParticleTexture(),
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    opacity: 0.65,
    depthWrite: false
  });

  backgroundParticles = new THREE.Points(geometry, material);
  scene.add(backgroundParticles);
}

// Create radial glow canvas texture to avoid loading external image assets
function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  // Radial gradient: white core fading to transparent glow
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,230,235,1)');
  gradient.addColorStop(0.5, 'rgba(255,179,193,0.3)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Mouse movement captures
function onMouseMove(event) {
  // Normalize mouse coords (-1 to +1)
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

  // Set rotation targets for subtle parallax tilt
  targetRotationY = mouseX * 0.45;
  targetRotationX = -mouseY * 0.45;
}

// Handle Window Resizing
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Click Event for Particle Explosion
function onSceneClick(event) {
  // Do not trigger click if landing screen is active or clicking buttons/UI
  const isLanding = document.getElementById('landing-screen').style.opacity !== '0' && document.getElementById('landing-screen').style.visibility !== 'hidden';
  if (isLanding) return;
  if (event.target.closest('.left-panel') || event.target.closest('.right-panel') || event.target.closest('.navbar')) return;

  // Trigger synthesized sound (handled in audio-synth.js, we call window trigger)
  if (window.triggerHeartExplosionSound) {
    window.triggerHeartExplosionSound();
  }

  explodeHeart();
}

// Start heart particle explosion
function explodeHeart() {
  if (isExploding) return; // Prevent double-triggering while mid-explosion
  
  isExploding = true;
  explosionTimer = 0;
  returnProgress = 0;

  const positionAttribute = particleSystem.geometry.attributes.position;
  
  for (let i = 0; i < particleCount; i++) {
    const px = positions[i * 3];
    const py = positions[i * 3 + 1];
    const pz = positions[i * 3 + 2];

    // Compute outward radial direction from center
    const length = Math.sqrt(px * px + py * py + posZForLength(pz));
    const dirX = px / (length || 1);
    const dirY = py / (length || 1);
    const dirZ = pz / (length || 1);

    // Dynamic explosive speed
    const speed = 15 + Math.random() * 25;
    velocities[i * 3] = dirX * speed;
    velocities[i * 3 + 1] = dirY * speed;
    velocities[i * 3 + 2] = dirZ * speed;
  }
}

// Avoid compiler error if pz is not scoped
function posZForLength(z) {
  return z * z;
}

// Heartbeat pulse calculation
function getHeartBeatScale(time) {
  // Simulates heartbeat double pulse: lubricate -> squeeze -> rest
  // We combine two sine waves for biological heartbeat rhythm
  const speed = 4.0;
  const pulse = Math.sin(time * speed) * 0.45 + Math.sin(time * speed * 2.0) * 0.2;
  // Map value to positive subtle pulse scale
  const scale = 1.0 + Math.max(0, pulse) * 0.08;
  return scale;
}

// Main Animation Loop
function animate() {
  requestAnimationFrame(animate);

  const time = clockGetTime();

  // 1. Handle Heartbeat pulse
  const pulseScale = getHeartBeatScale(time);

  // 2. Parallax Lerp for Heart Group rotation and position transitions
  heartGroup.rotation.y += (targetRotationY - heartGroup.rotation.y) * 0.06;
  heartGroup.rotation.x += (targetRotationX - heartGroup.rotation.x) * 0.06;
  
  heartGroup.position.x += (heartTargetX - heartGroup.position.x) * 0.05;
  heartGroup.position.y += (heartTargetY - heartGroup.position.y) * 0.05;
  const targetScaleVec = new THREE.Vector3(heartTargetScale, heartTargetScale, heartTargetScale);
  heartGroup.scale.lerp(targetScaleVec, 0.05);

  // Orbit background stars
  if (backgroundParticles) {
    backgroundParticles.rotation.y = time * 0.012;
    backgroundParticles.rotation.x = time * 0.005;
  }

  // 3. Update particle positions based on physics state
  const positionAttribute = particleSystem.geometry.attributes.position;
  
  if (isExploding) {
    explosionTimer += 0.016; // Approx dt at 60fps
    
    if (explosionTimer < 1.3) {
      // PHASE 1: Blowing out outward
      const drag = 0.94; // Friction to slow particles down
      
      for (let i = 0; i < particleCount; i++) {
        velocities[i * 3] *= drag;
        velocities[i * 3 + 1] *= drag;
        velocities[i * 3 + 2] *= drag;

        positions[i * 3] += velocities[i * 3] * 0.016;
        positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.016;
        positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.016;
      }
    } else {
      // PHASE 2: Slowly pulling back home
      returnProgress += 0.015; // Speed of return
      if (returnProgress >= 1.0) {
        returnProgress = 1.0;
        isExploding = false; // Reset explosion sequence complete
      }

      // Smooth step return transition
      const ease = easeInOutCubic(returnProgress);

      for (let i = 0; i < particleCount; i++) {
        const ox = originalPositions[i * 3] * pulseScale;
        const oy = originalPositions[i * 3 + 1] * pulseScale;
        const oz = originalPositions[i * 3 + 2] * pulseScale;

        // Linear interpolation from current blown out position to original heartbeat positions
        positions[i * 3] += (ox - positions[i * 3]) * ease;
        positions[i * 3 + 1] += (oy - positions[i * 3 + 1]) * ease;
        positions[i * 3 + 2] += (oz - positions[i * 3 + 2]) * ease;
      }
    }
  } else {
    // Normal resting state: pulse heart gently
    for (let i = 0; i < particleCount; i++) {
      // Apply resting rotation & breathing pulse
      positions[i * 3] = originalPositions[i * 3] * pulseScale;
      positions[i * 3 + 1] = originalPositions[i * 3 + 1] * pulseScale;
      positions[i * 3 + 2] = originalPositions[i * 3 + 2] * pulseScale;
      
      // Add a tiny micro-wave shimmer
      positions[i * 3 + 1] += Math.sin(time * 2.5 + originalPositions[i * 3]) * 0.02;
    }
  }

  // Tell Three.js positions have changed so WebGL updates buffer
  positionAttribute.needsUpdate = true;

  // Render Scene
  renderer.render(scene, camera);
}

// Utility Clock
const startTime = Date.now();
function clockGetTime() {
  return (Date.now() - startTime) * 0.001;
}

// Smooth Easing function
function easeInOutCubic(x) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// Change 3D Heart coordinates based on active page and viewport width
window.changeThreePage = function(pageIndex) {
  const isMobile = window.innerWidth <= 1024;

  if (pageIndex === 2) {
    if (isMobile) {
      heartTargetX = 0;
      heartTargetY = 3.5;
      heartTargetScale = 0.85;
    } else {
      heartTargetX = 3.8;
      heartTargetY = 0.5;
      heartTargetScale = 1.0;
    }
  } else if (pageIndex === 3) {
    if (isMobile) {
      heartTargetX = 0;
      heartTargetY = 6.2;
      heartTargetScale = 0.45;
    } else {
      heartTargetX = -4.2;
      heartTargetY = 0.5;
      heartTargetScale = 0.72;
    }
  }
};
