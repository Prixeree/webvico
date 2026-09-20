/**
 * Native canvas.captureStream() + MediaRecorder video export.
 * Zero external dependencies. Preserves audio track when present.
 */
export interface RecordCanvasOptions {
  onProgress?: (progress: number, currentTime: number, duration: number) => void;
  onComplete?: (blobUrl: string) => void;
  onError?: (error: Error) => void;
}

export class CanvasRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private audioContext: AudioContext | null = null;
  private audioSource: MediaElementAudioSourceNode | null = null;

  private getMimeType(): string {
    const types = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];
    for (const t of types) {
      if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  }

  public async startRecording(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement,
    options: RecordCanvasOptions = {}
  ): Promise<void> {
    if (this.isRecording) return;
    this.isRecording = true;
    this.recordedChunks = [];

    try {
      const mimeType = this.getMimeType();
      const stream = canvas.captureStream(30);

      // Connect video audio if available
      try {
        if (!this.audioContext) {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          this.audioContext = new AudioCtx();
          this.audioSource = this.audioContext.createMediaElementSource(video);
          const dest = this.audioContext.createMediaStreamDestination();
          this.audioSource.connect(dest);
          this.audioSource.connect(this.audioContext.destination);

          const audioTracks = dest.stream.getAudioTracks();
          if (audioTracks.length > 0) {
            stream.addTrack(audioTracks[0]);
          }
        }
      } catch (audioErr) {
        console.warn('Audio capture bypassed or not available:', audioErr);
      }

      const recorderOptions = mimeType ? { mimeType, videoBitsPerSecond: 12000000 } : {};
      this.mediaRecorder = new MediaRecorder(stream, recorderOptions);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      const duration = video.duration || 10;
      const wasLooping = video.loop;
      video.loop = false;

      const finishRecording = () => {
        if (!this.isRecording) return;
        this.isRecording = false;

        video.pause();
        video.loop = wasLooping;

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }

        const blobType = mimeType.split(';')[0] || 'video/webm';
        const blob = new Blob(this.recordedChunks, { type: blobType });
        const url = URL.createObjectURL(blob);

        if (options.onComplete) {
          options.onComplete(url);
        }
      };

      const trackProgress = () => {
        if (!this.isRecording) return;
        const cur = video.currentTime;
        const progress = Math.min(100, Math.round((cur / duration) * 100));

        if (options.onProgress) {
          options.onProgress(progress, cur, duration);
        }

        if (cur >= duration - 0.1 || video.ended) {
          finishRecording();
        } else {
          requestAnimationFrame(trackProgress);
        }
      };

      video.currentTime = 0;
      this.mediaRecorder.start(100);
      await video.play();

      requestAnimationFrame(trackProgress);
    } catch (err: any) {
      this.isRecording = false;
      if (options.onError) options.onError(err);
    }
  }

  public stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }
}
