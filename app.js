/**
 * SKAROSSERIE PRESENTATION CONTROLLER
 * Supports:
 * - Manual Speaker Mode (Clicker / Space / Arrow Keys)
 * - Autonomous Ambient Kiosk Loop (Key 'A')
 * - On-Demand Embedded YouTube Video Modal (G-Class Door Video)
 * - Local CNC Video Playback
 * - Speaker Notes Drawer (Key 'N')
 * - Fullscreen Toggle (Key 'F')
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const slides = Array.from(document.querySelectorAll('.slide'));
  const totalSlides = slides.length;
  const slideIndicator = document.getElementById('slideIndicator');
  const modeBadge = document.getElementById('modeBadge');
  const loopProgressBar = document.getElementById('loopProgress');
  const dotsContainer = document.getElementById('dotsNav');
  
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnLoopToggle = document.getElementById('btnLoopToggle');
  const loopStatusText = document.getElementById('loopStatusText');
  const btnNotesToggle = document.getElementById('btnNotesToggle');
  const btnFullscreen = document.getElementById('btnFullscreen');
  
  const notesDrawer = document.getElementById('notesDrawer');
  const notesBody = document.getElementById('notesBody');
  const btnCloseNotes = document.getElementById('btnCloseNotes');
  
  // Videos & Modals
  const cncVideo = document.getElementById('cncVideo');
  const btnCncVideo = document.getElementById('btnCncVideo');
  const btnOpenYtVideo = document.getElementById('btnOpenYtVideo');
  const videoModal = document.getElementById('videoModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnBackdropClose = document.getElementById('btnBackdropClose');
  const ytIframe = document.getElementById('ytIframe');

  // State
  let currentSlideIndex = 0;
  let isAutoLoop = false;
  let loopTimer = null;
  let loopStartTime = null;
  let loopDurationMs = 12000;
  let animFrameId = null;

  // Initialize Navigation Dots
  slides.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.className = `nav-dot ${idx === 0 ? 'active' : ''}`;
    dot.title = `Station ${idx + 1}`;
    dot.addEventListener('click', () => goToSlide(idx));
    dotsContainer.appendChild(dot);
  });

  const dots = Array.from(document.querySelectorAll('.nav-dot'));

  // Go to Slide Function
  function goToSlide(index) {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;

    // Remove active from old slide
    slides[currentSlideIndex].classList.remove('active');
    dots[currentSlideIndex].classList.remove('active');

    // Pause CNC video if leaving slide 4 (index 3)
    if (currentSlideIndex === 3 && cncVideo) {
      cncVideo.pause();
      if (btnCncVideo) btnCncVideo.textContent = '▶ Video abspielen';
    }

    // Stop and reset Slide 7 YouTube video if leaving slide 7 (index 6)
    const slide7VideoWrap = document.getElementById('slide7VideoWrap');
    const slide7YtIframe = document.getElementById('slide7YtIframe');
    if (currentSlideIndex === 6 && slide7VideoWrap && slide7YtIframe) {
      slide7VideoWrap.classList.remove('playing');
      slide7YtIframe.src = '';
    }

    // Set new slide
    currentSlideIndex = index;
    slides[currentSlideIndex].classList.add('active');
    dots[currentSlideIndex].classList.add('active');

    // Update Counter (01 / 09)
    const formattedNum = String(currentSlideIndex + 1).padStart(2, '0');
    const formattedTotal = String(totalSlides).padStart(2, '0');
    slideIndicator.textContent = `${formattedNum} / ${formattedTotal}`;

    // Update Speaker Notes
    updateSpeakerNotes();

    // Reset and restart Loop Timer if looping
    resetLoopProgress();
    if (isAutoLoop) {
      startSlideLoopTimer();
    }
  }

  function nextSlide() {
    goToSlide(currentSlideIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentSlideIndex - 1);
  }

  // Speaker Notes Management
  function updateSpeakerNotes() {
    const activeSlide = slides[currentSlideIndex];
    const notesEl = activeSlide.querySelector('.speaker-notes');
    if (notesEl && notesBody) {
      notesBody.innerHTML = notesEl.innerHTML;
    } else if (notesBody) {
      notesBody.textContent = 'Keine Notizen für diese Folie hinterlegt.';
    }
  }

  function toggleNotes(force) {
    const shouldOpen = force !== undefined ? force : !notesDrawer.classList.contains('open');
    if (shouldOpen) {
      updateSpeakerNotes();
      notesDrawer.classList.add('open');
    } else {
      notesDrawer.classList.remove('open');
    }
  }

  // Auto-Loop (Ambient Kiosk Engine)
  function toggleAutoLoop(force) {
    isAutoLoop = force !== undefined ? force : !isAutoLoop;
    if (isAutoLoop) {
      btnLoopToggle.classList.add('active');
      loopStatusText.textContent = 'AKTIV';
      modeBadge.textContent = 'Ambient Loop';
      modeBadge.classList.add('loop');
      startSlideLoopTimer();
    } else {
      btnLoopToggle.classList.remove('active');
      loopStatusText.textContent = 'AUS';
      modeBadge.textContent = 'Vortrags-Modus';
      modeBadge.classList.remove('loop');
      stopSlideLoopTimer();
      resetLoopProgress();
    }
  }

  function startSlideLoopTimer() {
    stopSlideLoopTimer();
    const activeSlide = slides[currentSlideIndex];
    const seconds = parseInt(activeSlide.getAttribute('data-duration') || '12', 10);
    loopDurationMs = seconds * 1000;
    loopStartTime = performance.now();

    function frame(now) {
      if (!isAutoLoop) return;
      const elapsed = now - loopStartTime;
      const progress = Math.min((elapsed / loopDurationMs) * 100, 100);
      loopProgressBar.style.width = `${progress}%`;

      if (elapsed >= loopDurationMs) {
        nextSlide();
      } else {
        animFrameId = requestAnimationFrame(frame);
      }
    }
    animFrameId = requestAnimationFrame(frame);
  }

  function stopSlideLoopTimer() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function resetLoopProgress() {
    loopProgressBar.style.width = '0%';
  }

  // Fullscreen Management
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn(`Fullscreen error: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  // Local CNC Video Toggle
  if (btnCncVideo && cncVideo) {
    cncVideo.muted = true;
    cncVideo.volume = 0;
    btnCncVideo.addEventListener('click', () => {
      cncVideo.muted = true;
      if (cncVideo.paused) {
        cncVideo.play();
        btnCncVideo.textContent = '⏸ Pause';
        // Pause loop while video is actively playing
        if (isAutoLoop) stopSlideLoopTimer();
      } else {
        cncVideo.pause();
        btnCncVideo.textContent = '▶ Video abspielen';
        if (isAutoLoop) startSlideLoopTimer();
      }
    });

    cncVideo.addEventListener('ended', () => {
      btnCncVideo.textContent = '▶ Video abspielen';
      if (isAutoLoop) startSlideLoopTimer();
    });
  }

  // Slide 7: Click-to-Play Video Poster
  const slide7VideoWrap = document.getElementById('slide7VideoWrap');
  const slide7YtIframe = document.getElementById('slide7YtIframe');
  if (slide7VideoWrap && slide7YtIframe) {
    slide7VideoWrap.addEventListener('click', () => {
      if (!slide7VideoWrap.classList.contains('playing')) {
        slide7VideoWrap.classList.add('playing');
        const targetSrc = slide7YtIframe.getAttribute('data-src');
        if (targetSrc && slide7YtIframe.src !== targetSrc) {
          slide7YtIframe.src = targetSrc;
        }
        if (isAutoLoop) stopSlideLoopTimer();
      }
    });
  }

  // YouTube On-Demand Video Modal
  const ytVideoId = 'y4Fs3-2sPgw';

  function openVideoModal() {
    // Pause Auto Loop while modal is open
    if (isAutoLoop) stopSlideLoopTimer();
    ytIframe.src = `https://www.youtube.com/embed/${ytVideoId}?autoplay=1&rel=0`;
    videoModal.classList.add('open');
  }

  function closeVideoModal() {
    videoModal.classList.remove('open');
    ytIframe.src = ''; // stops video playback
    if (isAutoLoop) startSlideLoopTimer();
  }

  if (btnOpenYtVideo) {
    btnOpenYtVideo.addEventListener('click', openVideoModal);
  }
  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeVideoModal);
  }
  if (btnBackdropClose) {
    btnBackdropClose.addEventListener('click', closeVideoModal);
  }

  // Button Listeners
  btnPrev.addEventListener('click', prevSlide);
  btnNext.addEventListener('click', nextSlide);
  btnLoopToggle.addEventListener('click', () => toggleAutoLoop());
  btnNotesToggle.addEventListener('click', () => toggleNotes());
  btnCloseNotes.addEventListener('click', () => toggleNotes(false));
  btnFullscreen.addEventListener('click', toggleFullscreen);

  // Keyboard Navigation
  window.addEventListener('keydown', (e) => {
    // If modal is open, ESC closes it
    if (e.key === 'Escape') {
      if (videoModal.classList.contains('open')) {
        closeVideoModal();
        return;
      }
      if (notesDrawer.classList.contains('open')) {
        toggleNotes(false);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ': // Space
      case 'PageDown':
        e.preventDefault();
        nextSlide();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'Backspace':
      case 'PageUp':
        e.preventDefault();
        prevSlide();
        break;
      case 'a':
      case 'A':
        toggleAutoLoop();
        break;
      case 'n':
      case 'N':
        toggleNotes();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
    }
  });

  // Initial Setup
  updateSpeakerNotes();
});
