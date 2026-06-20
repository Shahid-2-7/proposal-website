// Retrieve configuration from global scope
const config = window.config;

// ==========================================================================
// INITIALIZATION & DOM CACHING
// ==========================================================================
const elements = {
  // Intro Card
  cardIntro: document.getElementById('card-intro'),
  envelope: document.getElementById('envelope'),
  openBtn: document.getElementById('open-btn'),
  introTitle: document.getElementById('intro-title'),
  introMessage: document.getElementById('intro-message'),

  // Slideshow Card
  cardSlideshow: document.getElementById('card-slideshow'),
  currentSlideNum: document.getElementById('current-slide-num'),
  totalSlidesNum: document.getElementById('total-slides-num'),
  slideEmoji: document.getElementById('slide-emoji'),
  slideTitle: document.getElementById('slide-title'),
  slideText: document.getElementById('slide-text'),
  prevSlideBtn: document.getElementById('prev-slide-btn'),
  nextSlideBtn: document.getElementById('next-slide-btn'),
  slideIndicators: document.getElementById('slide-indicators'),

  // Proposal Card
  cardProposal: document.getElementById('card-proposal'),
  proposalQuestion: document.getElementById('proposal-question'),
  yesBtn: document.getElementById('yes-btn'),
  noBtn: document.getElementById('no-btn'),
  pleadingBubble: document.getElementById('pleading-bubble'),
  pleadingText: document.getElementById('pleading-text'),

  // Success Card
  cardSuccess: document.getElementById('card-success'),
  successTitle: document.getElementById('success-title'),
  successMessage: document.getElementById('success-message'),
  successGif: document.getElementById('success-gif'),
  whatsappBtn: document.getElementById('whatsapp-btn'),

  // Audio elements
  bgMusic: document.getElementById('bg-music'),
  soundToggle: document.getElementById('sound-toggle'),
  soundIcon: document.querySelector('.sound-icon')
};

// Application State
let currentSlideIndex = 0;
let noClickCount = 0;
let yesScale = 1.0;
let musicPlaying = false;

// Setup static configuration values
function initConfig() {
  elements.introTitle.textContent = config.introTitle;
  elements.introMessage.textContent = config.introMessage;
  elements.proposalQuestion.textContent = config.proposalQuestion;
  elements.yesBtn.textContent = config.yesBtnText;
  elements.noBtn.textContent = config.noBtnText;
  elements.successTitle.textContent = config.successTitle;
  elements.successMessage.textContent = config.successMessage;
  elements.successGif.src = config.successImg;

  // Sound source configuration
  if (config.musicUrl) {
    const source = elements.bgMusic.querySelector('source');
    source.src = config.musicUrl;
    elements.bgMusic.load();
  }

  // WhatsApp setup
  if (config.whatsappNumber) {
    const waUrl = `https://api.whatsapp.com/send?phone=${config.whatsappNumber}&text=${encodeURIComponent(config.whatsappMessage)}`;
    elements.whatsappBtn.addEventListener('click', () => {
      window.open(waUrl, '_blank');
    });
    elements.whatsappBtn.classList.remove('hidden');
  }
}

// ==========================================================================
// CARD NAVIGATION
// ==========================================================================
function showCard(cardToShow) {
  // Fade out current active cards
  const activeCard = document.querySelector('.card.active');
  if (activeCard) {
    activeCard.classList.remove('fade-in');
    setTimeout(() => {
      activeCard.classList.remove('active');
      cardToShow.classList.add('active');
      // Force repaint to make transition work
      cardToShow.offsetHeight;
      cardToShow.classList.add('fade-in');
    }, 600);
  } else {
    cardToShow.classList.add('active');
    cardToShow.offsetHeight;
    cardToShow.classList.add('fade-in');
  }
}

// ==========================================================================
// AUDIO SYSTEM (Bypassing Autoplay Rules)
// ==========================================================================
function startMusic() {
  elements.bgMusic.play()
    .then(() => {
      musicPlaying = true;
      elements.soundIcon.textContent = "🔊";
      elements.soundToggle.classList.remove('hidden');
    })
    .catch(error => {
      console.log("Music play blocked by browser. User interaction needed first.", error);
    });
}

elements.soundToggle.addEventListener('click', () => {
  if (musicPlaying) {
    elements.bgMusic.pause();
    elements.soundIcon.textContent = "🔇";
    musicPlaying = false;
  } else {
    elements.bgMusic.play();
    elements.soundIcon.textContent = "🔊";
    musicPlaying = true;
  }
});

// ==========================================================================
// ENVELOPE / INTRO LOGIC
// ==========================================================================
elements.openBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  elements.envelope.classList.add('open');
  startMusic();

  // Wait for envelope open animation to complete, then slide to reasons
  setTimeout(() => {
    showCard(elements.cardSlideshow);
    renderSlideshow();
  }, 2200);
});

// ==========================================================================
// SLIDESHOW LOGIC
// ==========================================================================
function renderSlideshow() {
  const slides = config.slides;
  elements.totalSlidesNum.textContent = slides.length;
  elements.currentSlideNum.textContent = currentSlideIndex + 1;

  // Slide details update
  elements.slideEmoji.textContent = slides[currentSlideIndex].emoji;
  elements.slideTitle.textContent = slides[currentSlideIndex].title;
  elements.slideText.textContent = slides[currentSlideIndex].text;

  // Buttons state update
  elements.prevSlideBtn.disabled = currentSlideIndex === 0;
  
  if (currentSlideIndex === slides.length - 1) {
    elements.nextSlideBtn.textContent = "Continue ❤️";
  } else {
    elements.nextSlideBtn.textContent = "Next 👉";
  }

  // Dots rendering
  elements.slideIndicators.innerHTML = '';
  slides.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.className = `indicator ${idx === currentSlideIndex ? 'active' : ''}`;
    elements.slideIndicators.appendChild(dot);
  });
}

elements.nextSlideBtn.addEventListener('click', () => {
  if (currentSlideIndex < config.slides.length - 1) {
    currentSlideIndex++;
    renderSlideshow();
  } else {
    // Transition to the Proposal Card
    showCard(elements.cardProposal);
  }
});

elements.prevSlideBtn.addEventListener('click', () => {
  if (currentSlideIndex > 0) {
    currentSlideIndex--;
    renderSlideshow();
  }
});

// ==========================================================================
// PROPOSAL & NO-BUTTON DODGING LOGIC
// ==========================================================================
function dodgeNoButton() {
  const noBtn = elements.noBtn;
  const bubble = elements.pleadingBubble;

  // Show the dialogue bubble with pleading messages
  if (config.noTexts.length > 0) {
    bubble.classList.remove('hidden');
    elements.pleadingText.textContent = config.noTexts[noClickCount % config.noTexts.length];
  }

  // Scale up YES button as they attempt to click NO
  yesScale += 0.35;
  elements.yesBtn.style.transform = `scale(${yesScale})`;

  // Calculate random position in viewport boundaries
  const padding = 20;
  const buttonWidth = noBtn.offsetWidth;
  const buttonHeight = noBtn.offsetHeight;
  
  // Calculate max coordinates within screen bounds
  const maxX = window.innerWidth - buttonWidth - padding;
  const maxY = window.innerHeight - buttonHeight - padding;
  
  // Random position that stays on screen
  const randomX = Math.max(padding, Math.floor(Math.random() * maxX));
  const randomY = Math.max(padding, Math.floor(Math.random() * maxY));

  // Change position type to fixed to break layout context and move around screen
  noBtn.style.position = 'fixed';
  noBtn.style.left = `${randomX}px`;
  noBtn.style.top = `${randomY}px`;
  noBtn.style.zIndex = '1000';

  noClickCount++;

  // After enough dodging attempts, hide the No button or click Yes
  if (noClickCount >= config.noTexts.length + 2) {
    noBtn.style.display = 'none';
    bubble.classList.add('hidden');
  }
}

// Attach hover (for PC) and touch (for mobile) triggers to the No button
elements.noBtn.addEventListener('mouseenter', dodgeNoButton);
elements.noBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  dodgeNoButton();
});

// Trigger standard dodging logic on click in case they somehow press it
elements.noBtn.addEventListener('click', (e) => {
  e.preventDefault();
  dodgeNoButton();
});

// ==========================================================================
// CELEBRATION (YES BUTTON CLICKED)
// ==========================================================================
elements.yesBtn.addEventListener('click', () => {
  // Hide pleading bubble and reset No button styles
  elements.pleadingBubble.classList.add('hidden');
  elements.noBtn.style.display = 'none';

  // Transition card
  showCard(elements.cardSuccess);

  // Trigger continuous confetti celebration bursts
  const duration = 12 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 10000 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 40 * (timeLeft / duration);
    // Left & right cannons
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
  }, 250);

  // Big initial bursts
  confetti({
    particleCount: 150,
    spread: 80,
    origin: { y: 0.6 }
  });
});

// ==========================================================================
// FLOATING HEARTS BACKGROUND (CANVAS)
// ==========================================================================
const canvas = document.getElementById('heart-canvas');
const ctx = canvas.getContext('2d');

let hearts = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Heart {
  constructor() {
    this.reset();
    // Scatter starting positions throughout screen at first load
    this.y = Math.random() * canvas.height;
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = canvas.height + Math.random() * 100;
    this.size = Math.random() * 15 + 8;
    this.speedY = -(Math.random() * 1.2 + 0.4);
    this.speedX = Math.random() * 0.4 - 0.2;
    this.alpha = Math.random() * 0.4 + 0.15;
    // Harmonious shades of soft red, pastel pink, and lavender
    const hue = Math.floor(Math.random() * 40) + 330; // 330 to 370 degrees (pink-rose range)
    this.color = `hsla(${hue}, 100%, 75%, ${this.alpha})`;
  }

  update() {
    this.y += this.speedY;
    this.x += this.speedX;

    // Fade out as it rises near the top
    if (this.y < 100) {
      this.alpha -= 0.005;
    }

    if (this.y < -30 || this.alpha <= 0) {
      this.reset();
    }
  }

  draw() {
    ctx.save();
    ctx.beginPath();
    const x = this.x;
    const y = this.y;
    const size = this.size;
    
    // Smooth Bezier Curve Drawing for Canvas Heart shape
    ctx.moveTo(x, y - size / 4);
    ctx.quadraticCurveTo(x, y - size, x - size / 2, y - size);
    ctx.quadraticCurveTo(x - size, y - size, x - size, y - size / 4);
    ctx.quadraticCurveTo(x - size, y + size / 3, x - size / 2, y + size * 0.7);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x + size / 2, y + size * 0.7);
    ctx.quadraticCurveTo(x + size, y + size / 3, x + size, y - size / 4);
    ctx.quadraticCurveTo(x + size, y - size, x + size / 2, y - size);
    ctx.quadraticCurveTo(x, y - size, x, y - size / 4);
    
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 117, 140, 0.3)';
    ctx.fill();
    ctx.restore();
  }
}

// Initialize particles pool
function initHearts() {
  const density = 25; // Number of particles
  hearts = [];
  for (let i = 0; i < density; i++) {
    hearts.push(new Heart());
  }
}

function animateHearts() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  hearts.forEach(heart => {
    heart.update();
    heart.draw();
  });
  requestAnimationFrame(animateHearts);
}

// Start Background Animation & Setup Config
initConfig();
initHearts();
animateHearts();

// Trigger initial card activation
setTimeout(() => {
  elements.cardIntro.classList.add('fade-in');
}, 100);
