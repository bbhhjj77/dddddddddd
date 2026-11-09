import { SoundType } from "../types";

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  /**
   * 부드러운 클릭 (Soft click)
   */
  public playClick(customVol?: number) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const finalVol = (customVol ?? this.volume) * 0.3;

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      gain.gain.setValueAtTime(finalVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio playback non-blocking
    }
  }

  /**
   * 가벼운 종소리 (Gentle bell - harmonic decay)
   */
  public playBell(customVol?: number) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const finalVol = (customVol ?? this.volume) * 0.4;

      // Two harmonic frequencies for warm bell resonance
      const freqs = [880, 1760];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        const v = idx === 0 ? finalVol : finalVol * 0.4;
        gain.gain.setValueAtTime(v, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx === 0 ? 0.7 : 0.4));

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.7);
      });
    } catch {}
  }

  /**
   * 짧은 알림음 (Short alert - pleasant double tone)
   */
  public playAlert(customVol?: number) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const finalVol = (customVol ?? this.volume) * 0.35;

      const tones = [
        { freq: 523.25, start: now, dur: 0.08 }, // C5
        { freq: 659.25, start: now + 0.09, dur: 0.14 }, // E5
      ];

      tones.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(finalVol, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch {}
  }

  /**
   * 타이머 종료음 / 정답 공개 차임 (Timer end chime)
   */
  public playTimerEnd(customVol?: number) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const finalVol = (customVol ?? this.volume) * 0.4;

      const notes = [
        { freq: 587.33, start: now, dur: 0.1 }, // D5
        { freq: 739.99, start: now + 0.1, dur: 0.1 }, // F#5
        { freq: 880.0, start: now + 0.2, dur: 0.4 }, // A5
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(finalVol, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch {}
  }

  /**
   * 특정 사운드 유형 미리듣기 또는 재생
   */
  public playSoundByType(type: SoundType, customVol?: number) {
    if (type === "silent" || this.isMuted) return;

    switch (type) {
      case "bell":
        this.playBell(customVol);
        break;
      case "chime":
        this.playTimerEnd(customVol);
        break;
      case "click":
        this.playClick(customVol);
        break;
      case "alert":
        this.playAlert(customVol);
        break;
    }
  }

  /**
   * 질문 등장 효과음
   */
  public onQuestionAppear(type: SoundType) {
    if (type === "silent") return;
    if (type === "bell") this.playBell();
    else if (type === "alert") this.playAlert();
    else this.playClick();
  }

  /**
   * 정답 공개 효과음
   */
  public onAnswerReveal(type: SoundType) {
    if (type === "silent") return;
    if (type === "bell") this.playBell();
    else if (type === "chime") this.playTimerEnd();
    else if (type === "alert") this.playAlert();
    else this.playClick();
  }

  /**
   * 다음 카드 이동 효과음
   */
  public onCardTransition(type: SoundType) {
    if (type === "silent") return;
    this.playClick();
  }
}

export const soundManager = new SoundManager();
