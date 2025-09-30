const songs = [
  {src: 'songs/friendship.mp3', title: 'Friendship', artist: 'Unknown', cover: 'assets/cover1.svg', duration: '—'},
  {src: 'songs/Hey_Minnale.mp3', title: 'Hey Minnale', artist: 'Unknown', cover: 'assets/cover2.svg', duration: '—'}
];

const audio = document.getElementById('audio');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const progress = document.getElementById('progress');
const currentTimeEl = document.getElementById('current');
const durationEl = document.getElementById('duration');
const volume = document.getElementById('volume');
const playlistEl = document.getElementById('playlist');
const autoplayCheckbox = document.getElementById('autoplay');
const coverImg = document.getElementById('cover');
const shuffleBtn = document.getElementById('shuffle');
const repeatBtn = document.getElementById('repeat');
const dropHint = document.getElementById('dropHint');
const filePicker = document.getElementById('filePicker');
const addFilesBtn = document.getElementById('addFiles');
const themeToggle = document.getElementById('themeToggle');

let currentIndex = 0;
let isPlaying = false;
let shuffle = false;
let repeatMode = 0; 
let userIsSeeking = false;
let dragCounter = 0;

function buildPlaylist(){
  playlistEl.innerHTML = '';
  songs.forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'track';
    div.dataset.index = i;
    div.innerHTML = `<div><strong>${s.title}</strong><br><small>${s.artist}</small></div><div><small>${s.duration}</small></div>`;
    div.addEventListener('click', () => { loadTrack(i); playAudio(); });
    playlistEl.appendChild(div);
  });
}

function updatePlaylistUI(){
  document.querySelectorAll('.track').forEach(el => el.classList.remove('active'));
  const active = document.querySelector(`.track[data-index="${currentIndex}"]`);
  if(active) active.classList.add('active');
}

function loadTrack(index){
  if(index < 0) index = songs.length - 1;
  if(index >= songs.length) index = 0;
  currentIndex = index;
  audio.src = songs[currentIndex].src;
  document.getElementById('title').textContent = songs[currentIndex].title;
  document.getElementById('artist').textContent = songs[currentIndex].artist;
  coverImg.src = songs[currentIndex].cover || '';
  updatePlaylistUI();
}

function playAudio(){
  if(!audio.src) loadTrack(currentIndex);
  audio.play();
  isPlaying = true;
  playBtn.textContent = '⏸️';
}

function pauseAudio(){
  audio.pause();
  isPlaying = false;
  playBtn.textContent = '▶️';
}

playBtn.addEventListener('click', () => { if(isPlaying) pauseAudio(); else playAudio(); });
prevBtn.addEventListener('click', () => { prevTrack(); });
nextBtn.addEventListener('click', () => { nextTrack(); });

function prevTrack(){
  if(audio.currentTime > 2) { audio.currentTime = 0; return; }
  if(shuffle) {
    loadTrack(Math.floor(Math.random()*songs.length));
    playAudio();
  } else {
    loadTrack(currentIndex - 1);
    if(autoplayCheckbox.checked) playAudio();
  }
}

function nextTrack(){
  if(shuffle) {
    loadTrack(Math.floor(Math.random()*songs.length));
    if(autoplayCheckbox.checked) playAudio();
  } else {
    if(currentIndex === songs.length -1) {
      if(repeatMode === 1) { loadTrack(0); if(autoplayCheckbox.checked) playAudio(); }
      else if(repeatMode === 2) { loadTrack(currentIndex); if(autoplayCheckbox.checked) playAudio(); }
      else { loadTrack(0); pauseAudio(); }
    } else {
      loadTrack(currentIndex + 1);
      if(autoplayCheckbox.checked) playAudio();
    }
  }
}

shuffleBtn.addEventListener('click', () => { shuffle = !shuffle; shuffleBtn.style.opacity = shuffle ? '1' : '0.6'; });
repeatBtn.addEventListener('click', () => {
  repeatMode = (repeatMode + 1) % 3;
  let txt = ['Off','All','One'][repeatMode];
  repeatBtn.title = 'Repeat: ' + txt;
  repeatBtn.style.opacity = repeatMode ? '1' : '0.6';
});


volume.addEventListener('input', (e) => { audio.volume = parseFloat(e.target.value); });


audio.addEventListener('timeupdate', () => {
  if(!userIsSeeking){
    const pct = (audio.currentTime / (audio.duration || 1)) * 100;
    progress.value = pct;
  }
  currentTimeEl.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audio.duration);
  songs[currentIndex].duration = durationEl.textContent;
  
  document.querySelectorAll('.track').forEach((el, i) => {
    const small = el.querySelector('small:last-child');
    if(small) small.textContent = songs[i].duration || '—';
  });
});

progress.addEventListener('input', () => { userIsSeeking = true; });
progress.addEventListener('change', () => {
  const pct = parseFloat(progress.value) / 100;
  audio.currentTime = pct * audio.duration;
  userIsSeeking = false;
});

audio.addEventListener('ended', () => {
  if(repeatMode === 2) { audio.currentTime = 0; playAudio(); }
  else nextTrack();
});

function formatTime(sec){
  if(!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec/60);
  const s = Math.floor(sec%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}


function handleFiles(fileList){
  Array.from(fileList).forEach(file => {
    const url = URL.createObjectURL(file);
    const name = file.name.replace(/\.[^/.]+$/, "");
    songs.push({src: url, title: name, artist: 'Local File', cover: '', duration: '—'});
  });
  buildPlaylist();
  updatePlaylistUI();
}

document.addEventListener('dragover', (e) => { e.preventDefault(); dropHint.textContent = 'Drop files to add'; });
document.addEventListener('dragleave', (e) => { dropHint.textContent = 'Drag & Drop songs here or press + to add'; });
document.addEventListener('drop', (e) => {
  e.preventDefault();
  dropHint.textContent = 'Added!';
  if(e.dataTransfer.files && e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
});

addFilesBtn.addEventListener('click', () => filePicker.click());
filePicker.addEventListener('change', (e) => { if(e.target.files) handleFiles(e.target.files); });


document.addEventListener('keydown', (e) => {
  if(e.code === 'Space') { e.preventDefault(); if(isPlaying) pauseAudio(); else playAudio(); }
  if(e.code === 'ArrowLeft') { prevTrack(); }
  if(e.code === 'ArrowRight') { nextTrack(); }
  if(e.code === 'ArrowUp') { e.preventDefault(); audio.volume = Math.min(1, audio.volume + 0.05); volume.value = audio.volume; }
  if(e.code === 'ArrowDown') { e.preventDefault(); audio.volume = Math.max(0, audio.volume - 0.05); volume.value = audio.volume; }
  if(e.key === '+') { filePicker.click(); }
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('theme-light');
  document.body.classList.toggle('theme-dark');
});


buildPlaylist();
loadTrack(0);
volume.dispatchEvent(new Event('input'));
updatePlaylistUI();
