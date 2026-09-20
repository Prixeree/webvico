declare module 'twgl.js' {
  export interface ProgramInfo {
    program: WebGLProgram;
    [key: string]: any;
  }
  export interface BufferInfo {
    numElements: number;
    indices?: WebGLBuffer;
    attribs?: { [key: string]: any };
    [key: string]: any;
  }
  export function createProgramInfo(gl: WebGLRenderingContext | WebGL2RenderingContext, shaderSources: string[]): ProgramInfo;
  export function createBufferInfoFromArrays(gl: WebGLRenderingContext | WebGL2RenderingContext, arrays: any): BufferInfo;
  export function setBuffersAndAttributes(gl: WebGLRenderingContext | WebGL2RenderingContext, programInfo: ProgramInfo, bufferInfo: BufferInfo): void;
  export function setUniforms(programInfo: ProgramInfo, uniforms: { [key: string]: any }): void;
  export function drawBufferInfo(gl: WebGLRenderingContext | WebGL2RenderingContext, bufferInfo: BufferInfo, type?: number, count?: number, offset?: number): void;
  export function createTexture(gl: WebGLRenderingContext | WebGL2RenderingContext, options?: any): WebGLTexture;
}
