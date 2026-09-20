import * as twgl from 'twgl.js';
import { vertexShaderSource, fragmentShaderSource } from './shader';
import { GradeParams } from '../ai/types';

export class WebGLRenderer {
  private gl: WebGL2RenderingContext;
  private programInfo: twgl.ProgramInfo;
  private bufferInfo: twgl.BufferInfo;
  private videoTexture: WebGLTexture;
  private lutTexture: WebGLTexture;
  private hasFloatLinear: boolean;
  private lutSize: number = 16;
  private lutActive: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', {
      preserveDrawingBuffer: true,
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance'
    });

    if (!gl) {
      throw new Error('WebGL 2.0 is not supported by your browser or hardware.');
    }

    this.gl = gl;
    this.hasFloatLinear = !!gl.getExtension('OES_texture_float_linear');

    // Create shader program via twgl
    this.programInfo = twgl.createProgramInfo(gl, [vertexShaderSource, fragmentShaderSource]);

    // Fullscreen quad geometry
    const arrays = {
      a_position: {
        numComponents: 2,
        data: [
          -1.0, -1.0,
           1.0, -1.0,
          -1.0,  1.0,
          -1.0,  1.0,
           1.0, -1.0,
           1.0,  1.0
        ]
      },
      a_texCoord: {
        numComponents: 2,
        data: [
          0.0, 1.0,
          1.0, 1.0,
          0.0, 0.0,
          0.0, 0.0,
          1.0, 1.0,
          1.0, 0.0
        ]
      }
    };
    this.bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

    // Initialize Video Texture
    this.videoTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // Placeholder 1x1 black pixel
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255])
    );

    // Initialize 3D LUT Texture
    this.lutTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_3D, this.lutTexture);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  /**
   * Uploads or updates a 3D LUT texture.
   */
  public setLut(size: number, data: Float32Array | null) {
    const gl = this.gl;
    if (!data || size <= 0) {
      this.lutActive = false;
      return;
    }

    this.lutSize = size;
    this.lutActive = true;

    gl.bindTexture(gl.TEXTURE_3D, this.lutTexture);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    if (this.hasFloatLinear) {
      gl.texImage3D(
        gl.TEXTURE_3D, 0, gl.RGBA32F,
        size, size, size, 0,
        gl.RGBA, gl.FLOAT, data
      );
    } else {
      // Fallback: 8-bit quantized texture for 100% universal hardware support
      const byteData = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        byteData[i] = Math.min(255, Math.max(0, Math.round(data[i] * 255)));
      }
      gl.texImage3D(
        gl.TEXTURE_3D, 0, gl.RGBA8,
        size, size, size, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, byteData
      );
    }

    gl.bindTexture(gl.TEXTURE_3D, null);
  }

  /**
   * Updates 2D video texture from HTMLVideoElement or HTMLCanvasElement.
   */
  public updateVideoFrame(source: HTMLVideoElement | HTMLCanvasElement) {
    if (!source) return;
    if (source instanceof HTMLVideoElement && source.readyState < 2) return;

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  }

  /**
   * Sets canvas dimensions and viewport.
   */
  public setSize(width: number, height: number) {
    if (this.gl.canvas.width !== width || this.gl.canvas.height !== height) {
      this.gl.canvas.width = width;
      this.gl.canvas.height = height;
    }
  }

  /**
   * Renders the frame with active grading uniforms.
   */
  public render(
    params: GradeParams,
    options: { splitX: number; showOriginal: boolean }
  ) {
    const gl = this.gl;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.04, 0.04, 0.06, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.programInfo.program);

    // Bind textures to texture units
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_3D, this.lutTexture);

    // Build uniforms object for twgl
    const uniforms = {
      u_video: 0,
      u_lut: 1,
      u_lut_size: this.lutSize,
      u_lut_active: this.lutActive,
      u_exposure: params.exposure,
      u_contrast: params.contrast,
      u_saturation: params.saturation,
      u_temperature: params.temperature,
      u_tint: params.tint,
      u_shadows_rgb: params.shadows_rgb,
      u_highlights_rgb: params.highlights_rgb,
      u_split_x: options.splitX,
      u_show_original: options.showOriginal
    };

    twgl.setUniforms(this.programInfo, uniforms);
    twgl.setBuffersAndAttributes(gl, this.programInfo, this.bufferInfo);
    twgl.drawBufferInfo(gl, this.bufferInfo);
  }

  public destroy() {
    const gl = this.gl;
    if (this.videoTexture) gl.deleteTexture(this.videoTexture);
    if (this.lutTexture) gl.deleteTexture(this.lutTexture);
    if (this.programInfo.program) gl.deleteProgram(this.programInfo.program);
  }
}
