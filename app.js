const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

for (const tab of tabs) {
  tab.addEventListener('click', () => {
    tabs.forEach((node) => node.classList.remove('active'));
    panels.forEach((node) => node.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.target).classList.add('active');
  });
}

const photoInput = document.getElementById('photoInput');
const canvas = document.getElementById('photoCanvas');
const ctx = canvas.getContext('2d');
const controls = ['brightness', 'contrast', 'saturation', 'blur'].map((id) => document.getElementById(id));
const rotatePhoto = document.getElementById('rotatePhoto');
const downloadPhoto = document.getElementById('downloadPhoto');
let image = null;
let angle = 0;

function drawImage() {
  if (!image) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const brightness = document.getElementById('brightness').value;
  const contrast = document.getElementById('contrast').value;
  const saturation = document.getElementById('saturation').value;
  const blur = document.getElementById('blur').value;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`;

  const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  ctx.restore();
}

photoInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    image = img;
    angle = 0;
    drawImage();
  };
  img.src = URL.createObjectURL(file);
});

controls.forEach((control) => control.addEventListener('input', drawImage));
rotatePhoto.addEventListener('click', () => {
  angle = (angle + 90) % 360;
  drawImage();
});
downloadPhoto.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'edited-photo.jpg';
  link.href = canvas.toDataURL('image/jpeg', 0.92);
  link.click();
});

drawImage();

const audioInput = document.getElementById('audioInput');
const audioPlayer = document.getElementById('audioPlayer');
const audioVolume = document.getElementById('audioVolume');
const audioRate = document.getElementById('audioRate');
const eqPreset = document.getElementById('eqPreset');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const mediaElSource = audioCtx.createMediaElementSource(audioPlayer);
const gainNode = audioCtx.createGain();
const lowShelf = audioCtx.createBiquadFilter();
const highShelf = audioCtx.createBiquadFilter();

lowShelf.type = 'lowshelf';
lowShelf.frequency.value = 200;
highShelf.type = 'highshelf';
highShelf.frequency.value = 3000;

mediaElSource.connect(lowShelf);
lowShelf.connect(highShelf);
highShelf.connect(gainNode);
gainNode.connect(audioCtx.destination);

function applyEqPreset(preset) {
  lowShelf.gain.value = 0;
  highShelf.gain.value = 0;
  switch (preset) {
    case 'voice':
      lowShelf.gain.value = -4;
      highShelf.gain.value = 6;
      break;
    case 'bass':
      lowShelf.gain.value = 8;
      highShelf.gain.value = -2;
      break;
    case 'radio':
      lowShelf.gain.value = -6;
      highShelf.gain.value = 10;
      break;
    default:
      break;
  }
}

audioInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  audioPlayer.src = URL.createObjectURL(file);
});

audioPlayer.addEventListener('play', () => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
});

audioVolume.addEventListener('input', () => {
  gainNode.gain.value = Number(audioVolume.value);
});

audioRate.addEventListener('input', () => {
  audioPlayer.playbackRate = Number(audioRate.value);
});

eqPreset.addEventListener('change', () => applyEqPreset(eqPreset.value));
applyEqPreset('flat');

const videoInput = document.getElementById('videoInput');
const videoPlayer = document.getElementById('videoPlayer');
const videoRate = document.getElementById('videoRate');
const videoSaturate = document.getElementById('videoSaturate');
const videoContrast = document.getElementById('videoContrast');
const trimStart = document.getElementById('trimStart');
const trimEnd = document.getElementById('trimEnd');
const saveVideoPreset = document.getElementById('saveVideoPreset');

videoInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  videoPlayer.src = URL.createObjectURL(file);
});

function applyVideoFilter() {
  videoPlayer.style.filter = `saturate(${videoSaturate.value}%) contrast(${videoContrast.value}%)`;
}

videoRate.addEventListener('input', () => {
  videoPlayer.playbackRate = Number(videoRate.value);
});

videoSaturate.addEventListener('input', applyVideoFilter);
videoContrast.addEventListener('input', applyVideoFilter);
applyVideoFilter();

saveVideoPreset.addEventListener('click', () => {
  const preset = {
    playbackRate: Number(videoRate.value),
    saturate: Number(videoSaturate.value),
    contrast: Number(videoContrast.value),
    trimStart: Number(trimStart.value),
    trimEnd: Number(trimEnd.value),
  };
  localStorage.setItem('creatorforge-video-preset', JSON.stringify(preset));
  saveVideoPreset.textContent = 'Saved ✓';
  setTimeout(() => {
    saveVideoPreset.textContent = 'Save video preset';
  }, 1200);
});

const storedPreset = localStorage.getItem('creatorforge-video-preset');
if (storedPreset) {
  try {
    const preset = JSON.parse(storedPreset);
    videoRate.value = preset.playbackRate ?? videoRate.value;
    videoSaturate.value = preset.saturate ?? videoSaturate.value;
    videoContrast.value = preset.contrast ?? videoContrast.value;
    trimStart.value = preset.trimStart ?? trimStart.value;
    trimEnd.value = preset.trimEnd ?? trimEnd.value;
    videoPlayer.playbackRate = Number(videoRate.value);
    applyVideoFilter();
  } catch (error) {
    console.warn('Unable to load preset', error);
  }
}

const mrrValue = document.getElementById('mrrValue');
const activeSubs = document.getElementById('activeSubs');
const simulateSignup = document.getElementById('simulateSignup');
const subscribeNow = document.getElementById('subscribeNow');

const revenue = {
  monthlyRecurringRevenue: 0,
  subscribers: 0,
};

function selectedPlanPrice() {
  return Number(document.querySelector('input[name="plan"]:checked').value);
}

function addSubscriber(amount) {
  revenue.subscribers += 1;
  revenue.monthlyRecurringRevenue += amount;
  mrrValue.textContent = `$${revenue.monthlyRecurringRevenue.toLocaleString()}`;
  activeSubs.textContent = revenue.subscribers;
}

simulateSignup.addEventListener('click', () => addSubscriber(49));
subscribeNow.addEventListener('click', () => addSubscriber(selectedPlanPrice()));
