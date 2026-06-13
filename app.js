/* Main Application Orchestration & Event Handling */

document.addEventListener('DOMContentLoaded', () => {
  setupCustomCursor();
  setupTransitions();
  setupAudioControl();
  setup3DTiltCards();
  setupEnvelope();
  setupProposalWidget();
});

// 1. Custom Glowing Cursor
function setupCustomCursor() {
  const cursor = document.getElementById('custom-cursor');
  const glow = document.getElementById('custom-cursor-glow');
  
  if (!cursor || !glow) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let cursorX = mouseX;
  let cursorY = mouseY;
  let glowX = mouseX;
  let glowY = mouseY;

  // Track mouse coordinates
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // Smooth cursor follow using lerp in tick loop
  function tickCursor() {
    // Lerp cursor position
    cursorX += (mouseX - cursorX) * 0.25;
    cursorY += (mouseY - cursorY) * 0.25;
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;

    // Lerp outer glow position (slower for lagging fluid effect)
    glowX += (mouseX - glowX) * 0.12;
    glowY += (mouseY - glowY) * 0.12;
    glow.style.left = `${glowX}px`;
    glow.style.top = `${glowY}px`;

    requestAnimationFrame(tickCursor);
  }
  tickCursor();

  // Highlight cursor on hoverable elements
  const hoverables = document.querySelectorAll('button, a, .tilt-card, .envelope, .envelope-seal, #proposal-yes, #proposal-no');
  hoverables.forEach(el => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('hovered-cursor');
      if (window.triggerHoverSound) {
        window.triggerHoverSound();
      }
    });
    
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('hovered-cursor');
    });
  });
}

// 2. Screen Transitions (Landing -> Experience)
function setupTransitions() {
  const startBtn = document.getElementById('start-btn');
  const landingScreen = document.getElementById('landing-screen');
  const mainContainer = document.getElementById('main-container');

  if (!startBtn || !landingScreen || !mainContainer) return;

  // Animate Landing elements in on load using GSAP
  gsap.to('.landing-title', { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.2 });
  gsap.to('.landing-subtitle', { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.5 });
  gsap.to('.glow-button', { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.8 });

  startBtn.addEventListener('click', () => {
    // A. Start Audio Synthesis (safe after user click gesture)
    initAudio();
    startBackgroundMusic();

    // B. Initialize WebGL Three.js Scene
    initThree();
    if (window.changeThreePage) {
      window.changeThreePage(2);
    }

    // C. Transition out landing screen
    gsap.to(landingScreen, {
      opacity: 0,
      duration: 1.0,
      ease: 'power2.inOut',
      onComplete: () => {
        landingScreen.style.visibility = 'hidden';
        landingScreen.style.display = 'none';
      }
    });

    // D. Transition in main dashboard
    mainContainer.classList.remove('hidden');
    gsap.fromTo(mainContainer, 
      { opacity: 0 }, 
      { opacity: 1, duration: 1.0, ease: 'power2.out', delay: 0.3 }
    );

    // E. Stagger reveal Page 2 elements
    gsap.from('.navbar', { y: -50, opacity: 0, duration: 0.8, ease: 'power2.out', delay: 0.5 });
    gsap.from('.instruction-card', { x: -50, opacity: 0, duration: 0.8, ease: 'power2.out', delay: 0.8 });
    gsap.from('.tilt-card', { y: 30, opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.15, delay: 1.0 });
    gsap.from('#to-page-3', { scale: 0.8, opacity: 0, duration: 0.8, ease: 'back.out(1.2)', delay: 1.4 });
  });

  // F. Page Navigation handlers
  const toPage3Btn = document.getElementById('to-page-3');
  const toPage2Btn = document.getElementById('to-page-2');
  const page2 = document.getElementById('page-2');
  const page3 = document.getElementById('page-3');

  if (toPage3Btn && toPage2Btn && page2 && page3) {
    // Page 2 -> Page 3
    toPage3Btn.addEventListener('click', () => {
      if (window.triggerHoverSound) window.triggerHoverSound();
      
      gsap.to(page2, {
        opacity: 0,
        x: -30,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => {
          page2.classList.add('hidden-page');
          page3.classList.remove('hidden-page');
          
          if (window.changeThreePage) {
            window.changeThreePage(3);
          }

          gsap.fromTo(page3,
            { opacity: 0, x: 30 },
            { 
              opacity: 1, 
              x: 0, 
              duration: 0.6, 
              ease: 'power2.out',
              onComplete: () => {
                // Animate envelope and proposal widget slide in
                gsap.fromTo('.envelope-wrapper', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.2)' });
                gsap.fromTo('.playful-widget', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.2 });
              }
            }
          );
        }
      });
    });

    // Page 3 -> Page 2
    toPage2Btn.addEventListener('click', () => {
      if (window.triggerHoverSound) window.triggerHoverSound();
      
      gsap.to(page3, {
        opacity: 0,
        x: 30,
        duration: 0.5,
        ease: 'power2.in',
        onComplete: () => {
          page3.classList.add('hidden-page');
          page2.classList.remove('hidden-page');
          
          if (window.changeThreePage) {
            window.changeThreePage(2);
          }

          gsap.fromTo(page2,
            { opacity: 0, x: -30 },
            { 
              opacity: 1, 
              x: 0, 
              duration: 0.6, 
              ease: 'power2.out'
            }
          );
        }
      });
    });
  }
}

// 3. Audio Equalizer Control Toggle
function setupAudioControl() {
  const musicBtn = document.getElementById('music-toggle');
  if (!musicBtn) return;

  musicBtn.addEventListener('click', () => {
    if (isMusicPlaying) {
      stopBackgroundMusic();
    } else {
      startBackgroundMusic();
    }
  });
}

// 4. 3D Tilt Cards with Glare effect
function setup3DTiltCards() {
  const cards = document.querySelectorAll('.tilt-card');

  cards.forEach(card => {
    const inner = card.querySelector('.card-inner');
    const glow = card.querySelector('.card-glow');

    // 3D Mouse Parallax
    card.addEventListener('mousemove', (e) => {
      if (card.classList.contains('flipped')) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // x coordinate within card
      const y = e.clientY - rect.top;  // y coordinate within card

      // Center coords offset
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Compute angles based on offset percentage (-10 to +10 degrees)
      const rotateX = -(y - centerY) / centerY * 14;
      const rotateY = (x - centerX) / centerX * 14;

      // Update card styles
      inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;
      
      // Update light glare gradient position
      if (glow) {
        const percentX = (x / rect.width) * 100;
        const percentY = (y / rect.height) * 100;
        glow.style.setProperty('--mouse-x', `${percentX}%`);
        glow.style.setProperty('--mouse-y', `${percentY}%`);
      }
    });

    // Reset when mouse leaves
    card.addEventListener('mouseleave', () => {
      if (card.classList.contains('flipped')) return;
      inner.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });

    // Flip card on click to reveal compliments
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
      
      // Reset tilt when flipping
      inner.style.transform = '';
      
      // Play sound SFX
      if (window.triggerHoverSound) {
        window.triggerHoverSound();
      }
    });
  });
}

// 5. 3D Envelope Opening Interaction
function setupEnvelope() {
  const envelope = document.getElementById('envelope');
  const letter = document.getElementById('letter');
  
  if (!envelope || !letter) return;

  envelope.addEventListener('click', (e) => {
    // Prevent double fire if click originates inside active letter text scroll
    if (e.target.closest('.letter-content') && envelope.classList.contains('opened')) {
      return;
    }

    if (!envelope.classList.contains('opened')) {
      envelope.classList.add('opened');
      
      // Play envelope sound
      if (window.triggerEnvelopeSound) {
        window.triggerEnvelopeSound();
      }

      // Slightly delay letter content fade in for reveal
      gsap.fromTo('.letter-body p', 
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: 'power2.out', delay: 0.6 }
      );
    } else {
      // Re-folding back
      envelope.classList.remove('opened');
      if (window.triggerEnvelopeSound) {
        window.triggerEnvelopeSound();
      }
    }
  });
}

// 6. Playful Question Widget (Runaway button)
function setupProposalWidget() {
  const yesBtn = document.getElementById('proposal-yes');
  const noBtn = document.getElementById('proposal-no');
  const widget = document.getElementById('playful-widget');
  const responseMsg = document.getElementById('proposal-response');

  if (!yesBtn || !noBtn || !widget || !responseMsg) return;

  // Track position offsets
  let isMoving = false;

  // Runaway "No" Button behavior
  function escapeNoButton() {
    if (isMoving) return;
    isMoving = true;

    // Get boundaries of the container
    const container = widget.querySelector('.button-group');
    const containerRect = container.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();

    // Compute maximum allowable offsets relative to button-group
    const maxX = containerRect.width - btnRect.width;
    const maxY = containerRect.height - btnRect.height;

    // Pick a random spot inside button-group
    const randomX = Math.random() * maxX;
    const randomY = Math.random() * (maxY - 10) + 5; // Keep slightly clear of edges

    // Apply movement animation
    gsap.to(noBtn, {
      left: randomX,
      top: randomY,
      duration: 0.25,
      ease: 'power2.out',
      onComplete: () => {
        isMoving = false;
      }
    });

    // Play light hover chime
    if (window.triggerHoverSound) {
      window.triggerHoverSound();
    }
  }

  // Trigger escape on hover AND focus (mobile touch protection)
  noBtn.addEventListener('mouseenter', escapeNoButton);
  noBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    escapeNoButton();
  });

  // Yes Button Clicked
  yesBtn.addEventListener('click', () => {
    // A. Hide the buttons with animation
    gsap.to([yesBtn, noBtn], {
      opacity: 0,
      scale: 0.5,
      duration: 0.4,
      stagger: 0.08,
      ease: 'back.in(1.5)',
      onComplete: () => {
        yesBtn.style.display = 'none';
        noBtn.style.display = 'none';
        
        // Show response message
        responseMsg.classList.remove('hidden-message');
        responseMsg.classList.add('show');
        
        // Stagger reveal text inside
        gsap.fromTo('#proposal-response p', 
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.5)' }
        );
      }
    });

    // B. Trigger Heart Fireworks Boom
    if (window.triggerHeartExplosionSound) {
      window.triggerHeartExplosionSound();
    }
    if (typeof explodeHeart === 'function') {
      explodeHeart();
    }

    // C. Create a rain of floating emoji hearts!
    createHeartShower();
  });

  // Generate dynamic CSS heart floating particles on screen
  function createHeartShower() {
    const showerContainer = document.createElement('div');
    showerContainer.style.position = 'fixed';
    showerContainer.style.top = '0';
    showerContainer.style.left = '0';
    showerContainer.style.width = '100vw';
    showerContainer.style.height = '100vh';
    showerContainer.style.pointerEvents = 'none';
    showerContainer.style.zIndex = '9999';
    document.body.appendChild(showerContainer);

    const heartEmojis = ['💖', '🌸', '✨', '🌹', '💗', '💕'];

    for (let i = 0; i < 40; i++) {
      const heart = document.createElement('div');
      heart.innerText = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
      heart.style.position = 'absolute';
      heart.style.fontSize = `${Math.random() * 20 + 20}px`;
      
      // Spread starting positions along bottom edge
      const startX = Math.random() * window.innerWidth;
      heart.style.left = `${startX}px`;
      heart.style.bottom = `-50px`;
      heart.style.opacity = `${Math.random() * 0.4 + 0.6}`;

      showerContainer.appendChild(heart);

      // Animate floats upward with slight horizontal swaying (sine)
      gsap.to(heart, {
        bottom: '105vh',
        x: (Math.random() - 0.5) * 200,
        rotation: (Math.random() - 0.5) * 180,
        duration: Math.random() * 2.5 + 2.0,
        ease: 'power1.out',
        onComplete: () => {
          heart.remove();
        }
      });
    }

    // Clean up container
    setTimeout(() => {
      showerContainer.remove();
    }, 5000);
  }
}
