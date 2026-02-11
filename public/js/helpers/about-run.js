let audioInstance = null;

export const runToggleAudio = async () => {
  const icon = document.querySelector(".audio-play-btn > div");
  if (!icon) return;

  if (!audioInstance) {
    audioInstance = new Audio("/media/Louis_Armstrong_What_A_Wonderful_World_audio.mp3");
    audioInstance.addEventListener("ended", () => {
      icon.className = "audio-icon-play";
    });
  }

  if (audioInstance.paused) {
    await audioInstance.play();
    icon.className = "audio-icon-pause";
  } else {
    audioInstance.pause();
    icon.className = "audio-icon-play";
  }
};
