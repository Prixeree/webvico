/**
 * Generates a synthetic cinematic video stream via an offscreen canvas
 * with a dynamic Macbeth-style color chart, skin-tone test patches,
 * golden-hour gradients, and moving highlights to test color grading instantly.
 */
export class SampleVideoGenerator {
  public width: number;
  public height: number;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isRunning: boolean = false;
  private startTime: number = performance.now();
  public currentTime: number = 0;
  public duration: number = 15;
  public paused: boolean = true;
  public loop: boolean = true;
  private listeners: Set<{ event: string; cb: () => void }> = new Set();

  constructor(width = 1280, height = 720) {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
  }

  public play() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.paused = false;
      this.startTime = performance.now() - this.currentTime * 1000;
      this.emit('play');
      this.tick();
    }
  }

  public pause() {
    this.isRunning = false;
    this.paused = true;
    this.emit('pause');
  }

  public togglePlay() {
    if (this.paused) this.play();
    else this.pause();
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration));
    this.startTime = performance.now() - this.currentTime * 1000;
    this.drawFrame();
    this.emit('timeupdate');
  }

  public on(event: string, cb: () => void) {
    this.listeners.add({ event, cb });
  }

  private emit(event: string) {
    for (const listener of this.listeners) {
      if (listener.event === event) listener.cb();
    }
  }

  private tick() {
    if (!this.isRunning) return;

    const now = performance.now();
    this.currentTime = ((now - this.startTime) / 1000) % this.duration;
    this.drawFrame();
    this.emit('timeupdate');

    requestAnimationFrame(() => this.tick());
  }

  public drawFrame() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const t = this.currentTime;

    // 1. Cinematic Background: Golden Hour / Sunset Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    const sunPos = (Math.sin(t * 0.4) + 1.0) * 0.5;
    bgGrad.addColorStop(0, '#121826');
    bgGrad.addColorStop(0.4, `rgb(${Math.floor(180 + sunPos * 50)}, ${Math.floor(80 + sunPos * 40)}, 45)`);
    bgGrad.addColorStop(0.7, '#d97736');
    bgGrad.addColorStop(1.0, '#3a1c28');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Animated Sun / Specular Highlight
    const sunX = w * 0.5 + Math.sin(t * 0.6) * (w * 0.3);
    const sunY = h * 0.35 + Math.cos(t * 0.5) * (h * 0.1);
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 260);
    sunGrad.addColorStop(0, 'rgba(255, 255, 240, 0.95)');
    sunGrad.addColorStop(0.2, 'rgba(255, 210, 120, 0.6)');
    sunGrad.addColorStop(0.6, 'rgba(255, 120, 50, 0.2)');
    sunGrad.addColorStop(1, 'rgba(255, 100, 40, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 260, 0, Math.PI * 2);
    ctx.fill();

    // 3. Cinematic Mountains / Silhouettes
    ctx.fillStyle = '#1e141d';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.7);
    ctx.lineTo(w * 0.25, h * 0.52);
    ctx.lineTo(w * 0.5, h * 0.68);
    ctx.lineTo(w * 0.78, h * 0.48);
    ctx.lineTo(w, h * 0.65);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // 4. Color Evaluation Chart (Macbeth-style 24-patch matrix)
    const chartW = 380;
    const chartH = 140;
    const chartX = 40;
    const chartY = h - chartH - 40;

    ctx.fillStyle = 'rgba(15, 17, 23, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(chartX - 10, chartY - 10, chartW + 20, chartH + 20, 8);
    } else {
      ctx.rect(chartX - 10, chartY - 10, chartW + 20, chartH + 20);
    }
    ctx.fill();
    ctx.stroke();

    const patches = [
      '#735244', '#c29682', '#627a9d', '#576c43', '#8580b1', '#67bdaa',
      '#d67e2c', '#505ba6', '#c15a63', '#5e3c6c', '#9dbc40', '#e0a32e',
      '#383d96', '#469449', '#af363c', '#e7c71f', '#bb5695', '#0885a1',
      '#f3f3f2', '#c8c8c8', '#a0a0a0', '#7a7a7a', '#555555', '#343434'
    ];

    const cols = 6;
    const rows = 4;
    const pw = chartW / cols;
    const ph = chartH / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        ctx.fillStyle = patches[idx];
        ctx.fillRect(chartX + c * pw + 2, chartY + r * ph + 2, pw - 4, ph - 4);
      }
    }

    ctx.fillStyle = '#a0aec0';
    ctx.font = '11px sans-serif';
    ctx.fillText('COLOR CALIBRATION TARGET', chartX, chartY - 14);

    // 5. Animated Wave
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < w; x += 10) {
      const y = h * 0.75 + Math.sin(x * 0.015 + t * 2) * 20;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 6. Timecode & Status Display Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(w - 220, 20, 200, 45);
    ctx.fillStyle = '#48bb78';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('● SYNTHETIC TEST CLIP', w - 205, 40);

    ctx.fillStyle = '#edf2f7';
    ctx.font = '14px monospace';
    const mins = Math.floor(t / 60).toString().padStart(2, '0');
    const secs = Math.floor(t % 60).toString().padStart(2, '0');
    const frames = Math.floor((t % 1) * 30).toString().padStart(2, '0');
    ctx.fillText(`TC: ${mins}:${secs}:${frames}`, w - 205, 58);
  }

  public getSource(): HTMLCanvasElement {
    return this.canvas;
  }
}
