const fileGrid = document.querySelector("#fileGrid");
const itemCount = document.querySelector("#itemCount");
const searchInput = document.querySelector("#searchInput");
const audioPlayer = document.querySelector("#audioPlayer");
const audioName = document.querySelector("#audioName");
const audioBars = Array.from(document.querySelectorAll("#audioBars span"));
const audioButton = document.querySelector("#audioButton");
const audioShell = document.querySelector(".audio-shell");
const stars = document.querySelector(".stars");
const signupScreen = document.querySelector("#signupScreen");
const signupForm = document.querySelector("#signupForm");
const fileManager = document.querySelector("#fileManager");
const ejectButton = document.querySelector("#ejectButton");
const startSlideshowButton = document.querySelector("#startSlideshow");
const sideItems = Array.from(document.querySelectorAll(".side-item"));
const addressBox = document.querySelector(".address-box");
const slideshow = document.querySelector("#slideshow");
const slideshowBackdrop = document.querySelector("#slideshowBackdrop");
const slideContent = document.querySelector("#slideContent");
const slideName = document.querySelector("#slideName");
const slidePosition = document.querySelector("#slidePosition");
const slidePrevious = document.querySelector("#slidePrevious");
const slideNext = document.querySelector("#slideNext");
const slideshowClose = document.querySelector("#slideshowClose");

const ownerAudio = {
  name: "AUDIO.WAV",
  src: "./audio.mp3",
};

const categoryFiles = {
  confidential: [
    { name: "Picture 01.jpg", type: "image", tone: "#f02b94", src: "./media/picture1.jpg" },
    { name: "Picture 02.jpg", type: "image", tone: "#f02b94", src: "./media/picture2.jpg" },
    { name: "Picture 03.jpg", type: "image", tone: "#f02b94", src: "./media/picture3.jpg" },
    { name: "Picture 04.jpg", type: "image", tone: "#f02b94", src: "./media/picture4.jpg" },
    { name: "Picture 05.jpg", type: "image", tone: "#f02b94", src: "./media/picture5.jpg" },
    { name: "Picture 06.jpg", type: "image", tone: "#f02b94", src: "./media/picture6.jpg" },
    { name: "Picture 07.jpg", type: "image", tone: "#f02b94", src: "./media/picture7.jpg" },
    { name: "Picture 08.jpg", type: "image", tone: "#f02b94", src: "./media/picture8.jpg" },
    { name: "Picture 09.jpg", type: "image", tone: "#f02b94", src: "./media/picture9.jpg" },
  ],
  vault: [
    { name: "DieCut.jpg", type: "image", tone: "#f02b94", src: "./media/DieCut.jpg" },
    { name: "Early Design.png", type: "image", tone: "#f02b94", src: "./media/Early%20Design.png" },
    { name: "Hearts.jpg", type: "image", tone: "#f02b94", src: "./media/Hearts.jpg" },
    { name: "TrianglePackage.jpg", type: "image", tone: "#f02b94", src: "./media/TrianglePackage.jpg" },
  ],
};

const state = {
  activeCategory: "confidential",
  search: "",
  slideshowFiles: [],
  slideIndex: 0,
  isAutoplaying: false,
  isSlideTransitioning: false,
};

const SLIDE_INTERVAL = 4200;
const SLIDE_FADE_DURATION = 280;

let audioFrame;
let isMuted = false;
let hasStartedAudio = false;
let lastFocusedElement;
let staticBarsApplied = false;
let lastVisualizerUpdate = 0;
let slideshowTimer;
let slideTransitionTimer;
let slideRevealFrame;

function iconSvg(kind) {
  if (kind === "image") {
    return `
      <svg class="file-icon" viewBox="0 0 48 48" aria-hidden="true">
        <rect x="9" y="11" width="30" height="26" rx="3"></rect>
        <circle cx="19" cy="21" r="3"></circle>
        <path d="m13 33 8-8 6 6 4-4 5 6"></path>
      </svg>
    `;
  }

  if (kind === "audio") {
    return `
      <div class="bars" aria-hidden="true">
        <span></span><span></span><span></span><span></span>
      </div>
    `;
  }

  if (kind === "video") {
    return `
      <svg class="file-icon" viewBox="0 0 48 48" aria-hidden="true">
        <rect x="8" y="12" width="32" height="24" rx="3"></rect>
        <path d="m21 19 10 5-10 5Z"></path>
      </svg>
    `;
  }

  return `
    <svg class="file-icon" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M14 6h15l8 8v28H14Z"></path>
      <path d="M29 6v9h8"></path>
      <path d="M20 25h16M20 32h12"></path>
    </svg>
  `;
}

function renderThumb(item) {
  if (item.src && item.type === "image") {
    return `<div class="thumb"><img src="${item.src}" alt=""></div>`;
  }

  if (item.src && item.type === "video") {
    return `<div class="thumb"><video src="${item.src}" muted playsinline></video></div>`;
  }

  if (item.type === "audio") {
    return `<div class="thumb audio-thumb">${iconSvg("audio")}</div>`;
  }

  return `
    <div class="thumb placeholder-thumb" style="--tone: ${item.tone || "#7c8799"}">
      ${iconSvg(item.type)}
    </div>
  `;
}

function renderFiles() {
  const query = state.search.trim().toLowerCase();
  const sourceFiles = categoryFiles[state.activeCategory] || [];
  const files = sourceFiles.filter((file) => file.name.toLowerCase().includes(query));

  fileGrid.innerHTML = files
    .map(
      (file, index) => `
        <button class="file-card" type="button" data-file-index="${index}" title="Open ${file.name}">
          ${renderThumb(file)}
          <span class="file-name">${file.name}</span>
        </button>
      `,
    )
    .join("");

  itemCount.textContent = `${files.length} ${files.length === 1 ? "item" : "items"}`;
  addressBox.textContent = state.activeCategory.toUpperCase();
}

function renderSidebar() {
  sideItems.forEach((button) => {
    const isActive = button.dataset.category === state.activeCategory;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function setCategory(category) {
  if (!categoryFiles[category]) return;
  state.activeCategory = category;
  closeSlideshow();
  renderSidebar();
  renderFiles();
}

function setupAudio() {
  audioName.textContent = ownerAudio.name;
  audioButton.classList.remove("is-muted");
  audioButton.disabled = !ownerAudio.src;
  audioButton.setAttribute("aria-label", ownerAudio.src ? "Play audio" : "Audio unavailable");
  audioButton.dataset.state = ownerAudio.src ? "ready" : "empty";
  audioPlayer.volume = 1;
  audioPlayer.muted = false;
  audioPlayer.loop = true;
  audioPlayer.preload = "auto";
  audioPlayer.playbackRate = 1;
  audioPlayer.preservesPitch = true;

  applyStaticBars();

  if (ownerAudio.src) {
    audioPlayer.src = ownerAudio.src;
    audioPlayer.load();
    startVisualizer();
  }
}

function applyStaticBars() {
  if (staticBarsApplied) return;

  audioBars.forEach((bar, index) => {
    bar.style.height = "6px";
    bar.style.opacity = "0.42";
  });
  audioShell.classList.remove("is-active");
  staticBarsApplied = true;
}

function setAudioShellActive(active) {
  audioShell.classList.toggle("is-active", active);
  if (active) {
    staticBarsApplied = false;
    audioBars.forEach((bar) => {
      bar.style.opacity = "1";
    });
  }
}

function startVisualizer() {
  if (audioFrame) return;

  if (!ownerAudio.src) {
    applyStaticBars();
    return;
  }

  const tick = (timestamp) => {
    if (hasStartedAudio && !audioPlayer.paused && !audioPlayer.muted && !isMuted) {
      setAudioShellActive(true);
      if (timestamp - lastVisualizerUpdate >= 66) {
        audioBars.forEach((bar, index) => {
          const wave = Math.sin(audioPlayer.currentTime * (3.3 + index * 0.19) + index * 0.82);
          const pulse = Math.sin(audioPlayer.currentTime * 1.7 + index * 1.31);
          const height = 8 + Math.max(0, wave * 0.64 + pulse * 0.36) * 16;
          bar.style.height = `${height.toFixed(2)}px`;
        });
        lastVisualizerUpdate = timestamp;
      }
    } else {
      applyStaticBars();
    }

    audioFrame = requestAnimationFrame(tick);
  };

  audioFrame = requestAnimationFrame(tick);
}

function setMuteState(nextMuted) {
  isMuted = nextMuted;
  audioPlayer.muted = isMuted;
  audioPlayer.volume = 1;

  audioButton.classList.toggle("is-muted", isMuted);
  audioButton.dataset.state = isMuted ? "muted" : "live";
  audioButton.setAttribute("aria-label", isMuted ? "Unmute audio" : "Mute audio");
  setAudioShellActive(hasStartedAudio && !isMuted && !audioPlayer.paused);
}

function drawStars() {
  const fallingHearts = Array.from({ length: 10 }, (_, index) => {
    const left = (index * 11 + 5) % 100;
    const size = 7 + ((index * 3) % 5);
    const alpha = 0.22 + (((index * 7) % 18) / 100);
    const turn = -6 + ((index * 9) % 13);
    const duration = 40 + ((index * 5) % 18);
    const delay = -1 * ((index * 9) % duration);
    const drift = -8 + ((index * 11) % 17);

    return `<span class="star" style="--left:${left}%;--size:${size}px;--alpha:${alpha};--turn:${turn}deg;--duration:${duration}s;--delay:${delay}s;--drift:${drift}px"></span>`;
  });

  stars.innerHTML = fallingHearts.join("");
}

async function startAudioPlayback({ silent = false } = {}) {
  if (!ownerAudio.src) {
    applyStaticBars();
    return false;
  }

  if (hasStartedAudio) return true;

  try {
    audioPlayer.muted = false;
    await audioPlayer.play();
    hasStartedAudio = true;
    setMuteState(false);
    setAudioShellActive(true);
    return true;
  } catch (error) {
    audioButton.dataset.state = "ready";
    audioButton.setAttribute("aria-label", "Play audio");
    applyStaticBars();

    if (!silent) {
      console.error("Audio failed to play:", error);
    }

    return false;
  }
}

function getVisibleFiles() {
  const query = state.search.trim().toLowerCase();
  return (categoryFiles[state.activeCategory] || []).filter((file) => file.name.toLowerCase().includes(query));
}

function renderSlide() {
  const file = state.slideshowFiles[state.slideIndex];
  if (!file) return;

  slideName.textContent = file.name;
  slidePosition.textContent = `${state.slideIndex + 1} / ${state.slideshowFiles.length}`;
  slidePrevious.disabled = state.slideshowFiles.length < 2;
  slideNext.disabled = state.slideshowFiles.length < 2;

  if (file.src && file.type === "image") {
    slideContent.innerHTML = `<img src="${file.src}" alt="${file.name}">`;
    return;
  }

  if (file.src && file.type === "video") {
    slideContent.innerHTML = `<video src="${file.src}" controls playsinline preload="metadata"></video>`;
    return;
  }

  slideContent.innerHTML = `
    <div class="slide-placeholder" style="--tone: ${file.tone || "#7c8799"}">
      ${iconSvg(file.type)}
    </div>
  `;
}

function clearSlideAnimation() {
  if (slideTransitionTimer !== undefined) {
    window.clearTimeout(slideTransitionTimer);
    slideTransitionTimer = undefined;
  }

  if (slideRevealFrame !== undefined) {
    window.cancelAnimationFrame(slideRevealFrame);
    slideRevealFrame = undefined;
  }

  state.isSlideTransitioning = false;
  slideContent.classList.remove("is-fading-out", "is-fading-in");
}

function fadeInSlide() {
  slideContent.classList.add("is-fading-in");
  slideRevealFrame = window.requestAnimationFrame(() => {
    slideRevealFrame = window.requestAnimationFrame(() => {
      slideContent.classList.remove("is-fading-in");
      slideRevealFrame = undefined;
    });
  });
}

function stopAutoSlideshow() {
  state.isAutoplaying = false;

  if (slideshowTimer !== undefined) {
    window.clearTimeout(slideshowTimer);
    slideshowTimer = undefined;
  }
}

function scheduleNextSlide() {
  if (!state.isAutoplaying || state.slideshowFiles.length < 2) return;

  slideshowTimer = window.setTimeout(() => {
    slideshowTimer = undefined;
    if (!state.isAutoplaying || slideshow.classList.contains("is-hidden")) return;
    moveSlide(1, { animate: true });
    scheduleNextSlide();
  }, SLIDE_INTERVAL);
}

function startAutoSlideshow() {
  stopAutoSlideshow();
  state.isAutoplaying = true;
  scheduleNextSlide();
}

function openSlideshow(index, { autoplay = false, presentation = false } = {}) {
  const files = getVisibleFiles();
  if (!files[index]) return;

  stopAutoSlideshow();
  clearSlideAnimation();
  lastFocusedElement = document.activeElement;
  state.slideshowFiles = files;
  state.slideIndex = index;
  renderSlide();
  slideshow.classList.toggle("is-presentation", presentation);
  slideshow.classList.remove("is-hidden");
  document.body.classList.add("is-slideshow-open");
  fadeInSlide();
  if (autoplay) startAutoSlideshow();
  slideshowClose.focus();
}

function closeSlideshow() {
  stopAutoSlideshow();
  clearSlideAnimation();
  slideshow.classList.remove("is-presentation");
  if (slideshow.classList.contains("is-hidden")) return;

  const video = slideContent.querySelector("video");
  if (video) video.pause();
  slideshow.classList.add("is-hidden");
  document.body.classList.remove("is-slideshow-open");
  slideContent.replaceChildren();
  if (lastFocusedElement instanceof HTMLElement) lastFocusedElement.focus();
}

function moveSlide(direction, { animate = true } = {}) {
  const total = state.slideshowFiles.length;
  if (total < 2) return;

  const nextIndex = (state.slideIndex + direction + total) % total;
  if (!animate || !slideContent.childElementCount) {
    state.slideIndex = nextIndex;
    renderSlide();
    fadeInSlide();
    return;
  }

  if (state.isSlideTransitioning) return;

  state.isSlideTransitioning = true;
  const currentVideo = slideContent.querySelector("video");
  if (currentVideo) currentVideo.pause();
  slideContent.classList.remove("is-fading-in");
  slideContent.classList.add("is-fading-out");

  slideTransitionTimer = window.setTimeout(() => {
    state.slideIndex = nextIndex;
    renderSlide();
    slideContent.classList.remove("is-fading-out");
    fadeInSlide();
    slideTransitionTimer = window.setTimeout(() => {
      state.isSlideTransitioning = false;
      slideTransitionTimer = undefined;
    }, SLIDE_FADE_DURATION);
  }, SLIDE_FADE_DURATION);
}

function startSlideshow() {
  if (!getVisibleFiles().length) return;
  openSlideshow(0, { autoplay: true, presentation: true });
}

async function toggleAudioState() {
  if (!hasStartedAudio) {
    await startAudioPlayback();
    return;
  }

  setMuteState(!isMuted);
}

audioButton.addEventListener("click", (event) => {
  event.preventDefault();
  toggleAudioState();
});

function startAudioAfterFirstInteraction(event) {
  if (event.target instanceof Element && event.target.closest("#audioButton")) return;
  startAudioPlayback({ silent: true });
}

document.addEventListener("click", startAudioAfterFirstInteraction, { once: true });
document.addEventListener("keydown", startAudioAfterFirstInteraction, { once: true });

audioPlayer.addEventListener("ended", () => {
  hasStartedAudio = false;
  isMuted = false;
  audioButton.classList.remove("is-muted");
  audioButton.dataset.state = "ready";
  audioButton.setAttribute("aria-label", "Play audio");
  applyStaticBars();
  setAudioShellActive(false);
});

audioPlayer.addEventListener("playing", () => {
  hasStartedAudio = true;
  setAudioShellActive(!isMuted);
});

audioPlayer.addEventListener("pause", () => {
  if (!audioPlayer.ended) applyStaticBars();
});

audioPlayer.addEventListener("error", () => {
  hasStartedAudio = false;
  audioButton.dataset.state = "error";
  audioButton.setAttribute("aria-label", "Audio unavailable");
  applyStaticBars();
});

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderFiles();
});

sideItems.forEach((button) => {
  button.addEventListener("click", () => {
    setCategory(button.dataset.category);
  });
});

fileGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".file-card");
  if (!card) return;
  openSlideshow(Number(card.dataset.fileIndex));
});

startSlideshowButton.addEventListener("click", startSlideshow);
slideshowBackdrop.addEventListener("click", closeSlideshow);
slideshowClose.addEventListener("click", closeSlideshow);
slidePrevious.addEventListener("click", () => moveSlide(-1));
slideNext.addEventListener("click", () => moveSlide(1));

document.addEventListener("keydown", (event) => {
  if (slideshow.classList.contains("is-hidden")) return;
  if (event.key === "Escape") closeSlideshow();
  if (event.key === "ArrowLeft") moveSlide(-1);
  if (event.key === "ArrowRight") moveSlide(1);
});

signupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  signupScreen.classList.add("is-hidden");
  fileManager.classList.remove("is-hidden");
});

ejectButton.addEventListener("click", () => {
  fileManager.classList.add("is-hidden");
  signupScreen.classList.remove("is-hidden");
});

setupAudio();
drawStars();
renderSidebar();
renderFiles();
startAudioPlayback({ silent: true });
