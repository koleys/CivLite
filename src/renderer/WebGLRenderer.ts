import type { Unit, City, MapData, TileCoord } from '@/game/entities/types';

export type QualityPreset = 'lite' | 'medium' | 'high';

export interface RenderConfig {
  quality: QualityPreset;
  width: number;
  height: number;
  tileSize: number;
}

const TERRAIN_COLORS: Record<string, number[]> = {
  ocean: [45, 90, 123],
  coast: [74, 141, 183],
  grassland: [74, 140, 74],
  plains: [196, 163, 90],
  desert: [201, 168, 108],
  tundra: [143, 158, 143],
  snow: [232, 240, 240],
  mountain: [107, 107, 107],
};

const FEATURE_COLORS: Record<string, number[]> = {
  forest: [45, 90, 45],
  hills: [139, 115, 85],
  floodplains: [90, 138, 90],
  oasis: [90, 168, 201],
  reefs: [90, 168, 168],
};

const UNIT_COLORS: Record<string, number[]> = {
  warrior: [200, 50, 50],
  archer: [50, 150, 200],
  settler: [150, 150, 150],
  scout: [100, 200, 100],
};

export class WebGLRenderer {
  private gl: WebGLRenderingContext | null = null;
  private canvas: HTMLCanvasElement;
  private config: RenderConfig;
  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private colorBuffer: WebGLBuffer | null = null;

  constructor(canvas: HTMLCanvasElement, config: RenderConfig) {
    this.canvas = canvas;
    this.config = config;
  }

  initialize(): boolean {
    const gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return false;
    }

    this.gl = gl;

    if (!this.initShaders()) {
      return false;
    }

    if (!this.initBuffers()) {
      return false;
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    return true;
  }

  private initShaders(): boolean {
    const gl = this.gl;
    if (!gl) return false;

    const vsSource = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      varying vec4 v_color;
      uniform vec2 u_resolution;
      
      void main() {
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        v_color = a_color;
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec4 v_color;
      
      void main() {
        gl_FragColor = v_color;
      }
    `;

    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) return false;

    const program = gl.createProgram();
    if (!program) return false;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Shader program failed:', gl.getProgramInfoLog(program));
      return false;
    }

    this.program = program;
    return true;
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl;
    if (!gl) return null;

    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private initBuffers(): boolean {
    const gl = this.gl;
    if (!gl) return false;

    this.positionBuffer = gl.createBuffer();
    this.colorBuffer = gl.createBuffer();

    return true;
  }

  render(
    map: MapData,
    units: Unit[],
    cities: City[],
    selectedTile: TileCoord | null,
    cameraOffset: TileCoord
  ): void {
    const gl = this.gl;
    if (!gl || !this.program) return;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.program);

    const resolutionLocation = gl.getUniformLocation(this.program, 'u_resolution');
    gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);

    const positions: number[] = [];
    const colors: number[] = [];

    const scale = this.config.quality === 'high' ? 4 : 2;

    for (const [key, tile] of map.tiles) {
      const [x, y] = key.split(',').map(Number);
      const screenX = (x - cameraOffset.x) * this.config.tileSize * scale;
      const screenY = (y - cameraOffset.y) * this.config.tileSize * scale;

      if (screenX < -this.config.tileSize || screenX > this.canvas.width ||
          screenY < -this.config.tileSize || screenY > this.canvas.height) {
        continue;
      }

      const terrainColor = TERRAIN_COLORS[tile.terrain] || [100, 100, 100];
      this.addQuad(positions, colors, screenX, screenY, this.config.tileSize * scale, terrainColor);

      if (tile.feature && FEATURE_COLORS[tile.feature]) {
        const featureColor = FEATURE_COLORS[tile.feature];
        this.addQuad(positions, colors, screenX + 4, screenY + 4, this.config.tileSize * scale - 8, featureColor);
      }

      if (selectedTile && selectedTile.x === x && selectedTile.y === y) {
        this.addQuadOutline(positions, colors, screenX, screenY, this.config.tileSize * scale, [255, 255, 0, 128]);
      }
    }

    for (const unit of units) {
      const screenX = (unit.x - cameraOffset.x) * this.config.tileSize * scale + 8;
      const screenY = (unit.y - cameraOffset.y) * this.config.tileSize * scale + 8;
      const unitColor = UNIT_COLORS[unit.type] || [150, 150, 150];
      this.addQuad(positions, colors, screenX, screenY, this.config.tileSize * scale - 16, unitColor);
    }

    for (const city of cities) {
      const screenX = (city.x - cameraOffset.x) * this.config.tileSize * scale;
      const screenY = (city.y - cameraOffset.y) * this.config.tileSize * scale;
      this.addQuad(positions, colors, screenX + 4, screenY + 4, this.config.tileSize * scale - 8, [255, 200, 100]);
    }

    this.drawArrays(gl, positions, colors);
  }

  private addQuad(
    positions: number[],
    colors: number[],
    x: number,
    y: number,
    size: number,
    color: number[]
  ): void {
    const r = (color[0] || 0) / 255;
    const g = (color[1] || 0) / 255;
    const b = (color[2] || 0) / 255;
    const a = color[3] !== undefined ? color[3] / 255 : 1;

    positions.push(
      x, y,
      x + size, y,
      x, y + size,
      x, y + size,
      x + size, y,
      x + size, y + size
    );

    for (let i = 0; i < 6; i++) {
      colors.push(r, g, b, a);
    }
  }

  private addQuadOutline(
    positions: number[],
    colors: number[],
    x: number,
    y: number,
    size: number,
    color: number[]
  ): void {
    const r = (color[0] || 0) / 255;
    const g = (color[1] || 0) / 255;
    const b = (color[2] || 0) / 255;
    const a = color[3] !== undefined ? color[3] / 255 : 1;

    positions.push(
      x, y, x + size, y,
      x + size, y, x + size, y + size,
      x + size, y + size, x, y + size,
      x, y + size, x, y
    );

    for (let i = 0; i < 8; i++) {
      colors.push(r, g, b, a);
    }
  }

  private drawArrays(gl: WebGLRenderingContext, positions: number[], colors: number[]): void {
    if (positions.length === 0) return;

    const positionLocation = gl.getAttribLocation(this.program!, 'a_position');
    const colorLocation = gl.getAttribLocation(this.program!, 'a_color');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);

    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(colorBuffer);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }
  }

  destroy(): void {
    const gl = this.gl;
    if (gl && this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (gl && this.colorBuffer) gl.deleteBuffer(this.colorBuffer);
    if (gl && this.program) gl.deleteProgram(this.program);
    this.gl = null;
  }
}

export function createWebGLRenderer(
  canvas: HTMLCanvasElement,
  config: RenderConfig
): WebGLRenderer | null {
  const renderer = new WebGLRenderer(canvas, config);
  if (renderer.initialize()) {
    return renderer;
  }
  return null;
}
