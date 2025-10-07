const audio = new Audio();
let playlist = [];
let currentIndex = 0;
let shuffleMode = false;

const playBtn = document.getElementById("play");
const pauseBtn = document.getElementById("pause");
const stopBtn = document.getElementById("stop");
const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const shuffleBtn = document.getElementById("shuffle");
const volumeSlider = document.getElementById("volume");
const nowPlaying = document.getElementById("now-playing");
const playlistEl = document.getElementById("playlist");

// Load playlist.json dynamically
fetch("playlist.json")
  .then(res => res.json())
  .then(data => {
    playlist = data;
    loadPlaylist();
  })
  .catch(err => {
    console.error("Error loading playlist.json", err);
    nowPlaying.textContent = "⚠ Could not load playlist";
  });

function loadPlaylist() {
  playlistEl.innerHTML = "";
  playlist.forEach((track, index) => {
    const li = document.createElement("li");
    li.textContent = `${track.title} - ${track.artist}`;
    li.dataset.index = index;

    const downloadLink = document.createElement("a");
    downloadLink.href = track.src;
    downloadLink.download = track.title;
    downloadLink.textContent = " ⬇";
    downloadLink.style.color = "#0af";
    downloadLink.style.textDecoration = "none";
    downloadLink.style.marginLeft = "5px";

    li.appendChild(downloadLink);
    playlistEl.appendChild(li);
  });
}

function playTrack(index) {
  currentIndex = index;
  audio.src = playlist[currentIndex].src;
  audio.play();
  updateNowPlaying();
  highlightActive();
}

function updateNowPlaying() {
  nowPlaying.textContent = `Now Playing: ${playlist[currentIndex].title} - ${playlist[currentIndex].artist}`;
}

function highlightActive() {
  [...playlistEl.children].forEach(li => li.classList.remove("active"));
  if (playlistEl.children[currentIndex]) {
    playlistEl.children[currentIndex].classList.add("active");
  }
}

playBtn.onclick = () => {
  if (!audio.src && playlist.length > 0) playTrack(0);
  else audio.play();
};
pauseBtn.onclick = () => audio.pause();
stopBtn.onclick = () => {
  audio.pause();
  audio.currentTime = 0;
};
nextBtn.onclick = () => {
  if (playlist.length === 0) return;
  if (shuffleMode) {
    playTrack(Math.floor(Math.random() * playlist.length));
  } else {
    playTrack((currentIndex + 1) % playlist.length);
  }
};
prevBtn.onclick = () => {
  if (playlist.length === 0) return;
  playTrack((currentIndex - 1 + playlist.length) % playlist.length);
};
shuffleBtn.onclick = () => {
  shuffleMode = !shuffleMode;
  shuffleBtn.style.background = shuffleMode ? "#0af" : "#333";
};
volumeSlider.oninput = () => {
  audio.volume = volumeSlider.value;
};
playlistEl.onclick = (e) => {
  if (e.target.tagName === "LI") {
    playTrack(Number(e.target.dataset.index));
  }
};
audio.onended = () => nextBtn.click();

// Auto font scaling on container resize
const container = document.getElementById("playlist-container");
const observer = new ResizeObserver(() => {
  const scale = Math.max(12, container.clientWidth / 25);
  playlistEl.style.fontSize = scale + "px";
  nowPlaying.style.fontSize = scale + "px";
});
observer.observe(container);
