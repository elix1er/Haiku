class SoundManager {
  sounds: Map<string, HTMLAudioElement>;

  constructor() {
    this.sounds = new Map<string, HTMLAudioElement>();
  }

  async loadSound(path: string): Promise<HTMLAudioElement> {
    return new Promise(resolve => {
      const sound = new Audio();
      sound.src = path;
      sound.addEventListener('canplaythrough', () => {
        this.sounds.set(path, sound);
        resolve(sound);
      });
    });
  }

  deleteSound(path: string): void {
    if (!this.sounds.has(path)) {
      throw new Error('SoundManager::deleteSound(): The sound file doesn\'t exist, cannot delete !');
    }

    const sound = this.sounds.get(path)!;
    sound.src = '';
    this.sounds.delete(path);
  }

  playSound(path: string): void {
    if (!this.sounds.has(path)) {
      throw new Error('SoundManager::play(): The sound file doesn\'t exist, cannot play !');
    }

    const sound = this.sounds.get(path)!;
    sound.play();
  }

  pauseSound(path: string): void {
    const sound = this.sounds.get(path)!;
    sound.pause();
  }

  releaseSounds() {
    for (let path in this.sounds) {
      const sound = this.sounds.get(path)!;
      sound.src = '';
      this.sounds.delete(path);
    }
  }
}

export { SoundManager };
export const soundManager = new SoundManager();