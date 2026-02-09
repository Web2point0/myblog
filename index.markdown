---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: home


---

<div class="iframe-wrapper">
<div class="boombox">
        <div class="handle"></div>
        <div class="brand">RADIO</div>
        
        <div class="speakers">
            <div class="speaker" id="speaker1"></div>
            <div class="speaker" id="speaker2"></div>
        </div>
        
        <div class="display">
            <div class="display-text" id="display">- - - -</div>
        </div>
        
        <div class="controls">
            <button class="play-button play" id="playButton" onclick="togglePlay()">▶</button>
            
            <div class="volume-control">
                <span class="volume-icon">🔊</span>
                <input type="range" min="0" max="100" value="70" class="volume-slider" id="volumeSlider" oninput="changeVolume()">
                <span class="volume-value" id="volumeValue">70</span>
            </div>
        </div>
    </div>
    <p>Check out our live radio page: <a href="/radio">Live Radio</a></p>
    <p>Mobile devices: <a href="https://2channel.radio12345.com">Click here</a></p>
    <audio id="audioPlayer"></audio>
    
    <script>
        const audio = document.getElementById('audioPlayer');
        const playButton = document.getElementById('playButton');
        const display = document.getElementById('display');
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        const speaker1 = document.getElementById('speaker1');
        const speaker2 = document.getElementById('speaker2');
        const streamUrl = 'https://uk22freenew.listen2myradio.com/live.mp3?typeportmount=s1_13339_stream_672269329';
        
        let isPlaying = false;
        
        // Set initial volume
        audio.volume = 0.7;
        
        function togglePlay() {
            if (!isPlaying) {
                audio.src = streamUrl;
                audio.play().then(() => {
                    isPlaying = true;
                    playButton.textContent = '⏹';
                    playButton.className = 'play-button stop';
                    display.textContent = '♪ LIVE ♪';
                    speaker1.classList.add('playing');
                    speaker2.classList.add('playing');
                }).catch(error => {
                    console.error('Playback failed:', error);
                    alert('Could not play stream. Please try again.');
                });
            } else {
                audio.pause();
                audio.src = '';
                isPlaying = false;
                playButton.textContent = '▶';
                playButton.className = 'play-button play';
                display.textContent = '- - - -';
                speaker1.classList.remove('playing');
                speaker2.classList.remove('playing');
            }
        }
        
        function changeVolume() {
            const volume = volumeSlider.value;
            audio.volume = volume / 100;
            volumeValue.textContent = volume;
        }
    </script>
<iframe src="/playlist" width="auto" height="auto" style="border:none; overflow:hidden;"></iframe>
<iframe src="https://myyear.net/hiscore/osrs/beta1/your-template.html?user=fun%20i%20orb&color=%23c875ff&font=Verdana%2C%20sans-serif&bgUrl=https%3A%2F%2Frs3-banner-worker.clip-devious-turf.workers.dev%2Fbg%2F49327317-4929-420d-af0c-6cbe94798f89" 
  width="335" 
  height="249" 
  style="border:none;border-radius:8px;overflow:hidden;" 
  scrolling="no">
</iframe></div>
<a href="https://myyear.net/hiscore/osrs/beta1/">Create a RS Banner just like this!</a><br />
<a href="https://myyear.net/hiscore/rs3/beta1/">RS3 Banner Generator</a>
<p>These use a community hiscore fetch proxy. Which can be slow at times of peak traffic. Try using our own proxy provided in the <a href="/links/">links section</a> for rs3/osrs banner generator. </p>


