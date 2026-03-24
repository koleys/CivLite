export type QualityPreset = 'lite' | 'medium' | 'high';

export interface PerformanceTargets {
  fps: number;
  turnProcessingMs: number;
  loadTimeMs: number;
}

export const PERFORMANCE_TARGETS: Record<QualityPreset, PerformanceTargets> = {
  lite: { fps: 30, turnProcessingMs: 300, loadTimeMs: 3000 },
  medium: { fps: 45, turnProcessingMs: 500, loadTimeMs: 5000 },
  high: { fps: 60, turnProcessingMs: 800, loadTimeMs: 8000 },
};

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  turnProcessingTime: number;
  memoryUsage: number;
  renderTime: number;
}

export class PerformanceMonitor {
  private frameCount: number = 0;
  private lastTime: number = 0;
  private frameTimes: number[] = [];
  private maxFrameTimeSamples: number = 60;
  private renderTime: number = 0;

  startFrame(): void {
    this.lastTime = performance.now();
  }

  endFrame(): void {
    const now = performance.now();
    const frameTime = now - this.lastTime;
    
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.maxFrameTimeSamples) {
      this.frameTimes.shift();
    }

    this.frameCount++;
  }

  setRenderTime(time: number): void {
    this.renderTime = time;
  }

  getFPS(): number {
    if (this.frameTimes.length === 0) return 0;
    
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    return Math.round(1000 / avgFrameTime);
  }

  getAverageFrameTime(): number {
    if (this.frameTimes.length === 0) return 0;
    return this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
  }

  getMetrics(turnProcessingTime: number = 0): PerformanceMetrics {
    return {
      fps: this.getFPS(),
      frameTime: this.getAverageFrameTime(),
      turnProcessingTime,
      memoryUsage: this.getMemoryUsage(),
      renderTime: this.renderTime,
    };
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  reset(): void {
    this.frameCount = 0;
    this.frameTimes = [];
    this.lastTime = 0;
  }
}

export class FrameRateController {
  private targetFPS: number;
  private frameInterval: number;
  private lastFrameTime: number = 0;
  private isRunning: boolean = false;
  private callback: (() => void) | null = null;

  constructor(targetFPS: number) {
    this.targetFPS = targetFPS;
    this.frameInterval = 1000 / targetFPS;
  }

  setTargetFPS(fps: number): void {
    this.targetFPS = fps;
    this.frameInterval = 1000 / fps;
  }

  getTargetFPS(): number {
    return this.targetFPS;
  }

  start(callback: () => void): void {
    this.callback = callback;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.tick();
  }

  stop(): void {
    this.isRunning = false;
  }

  private tick = (): void => {
    if (!this.isRunning) return;

    const now = performance.now();
    const elapsed = now - this.lastFrameTime;

    if (elapsed > this.frameInterval) {
      this.lastFrameTime = now - (elapsed % this.frameInterval);
      
      if (this.callback) {
        this.callback();
      }
    }

    if (this.isRunning) {
      requestAnimationFrame(this.tick);
    }
  };
}

export class TurnProcessor {
  private processingTime: number = 0;
  private maxSamples: number = 10;
  private samples: number[] = [];

  start(): number {
    return performance.now();
  }

  end(startTime: number): void {
    this.processingTime = performance.now() - startTime;
    this.samples.push(this.processingTime);
    
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  getAverageProcessingTime(): number {
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
  }

  isWithinTarget(preset: QualityPreset): boolean {
    const target = PERFORMANCE_TARGETS[preset].turnProcessingMs;
    return this.getAverageProcessingTime() <= target;
  }
}

export class LazyLoader<T> {
  private cache: Map<string, T> = new Map();
  private loading: Map<string, Promise<T>> = new Map();
  private loader: (key: string) => Promise<T>;

  constructor(loader: (key: string) => Promise<T>) {
    this.loader = loader;
  }

  async get(key: string): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    if (this.loading.has(key)) {
      return this.loading.get(key)!;
    }

    const promise = this.loader(key).then((value) => {
      this.cache.set(key, value);
      this.loading.delete(key);
      return value;
    }).catch((error) => {
      this.loading.delete(key);
      throw error;
    });

    this.loading.set(key, promise);
    return promise;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.loading.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function memoize<T extends (...args: unknown[]) => unknown>(
  func: T
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

let performanceMonitorInstance: PerformanceMonitor | null = null;
let frameRateControllerInstance: FrameRateController | null = null;
let turnProcessorInstance: TurnProcessor | null = null;

export function createPerformanceMonitor(): PerformanceMonitor {
  performanceMonitorInstance = new PerformanceMonitor();
  return performanceMonitorInstance;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitorInstance;
}

export function createFrameRateController(targetFPS: number): FrameRateController {
  frameRateControllerInstance = new FrameRateController(targetFPS);
  return frameRateControllerInstance;
}

export function getFrameRateController(): FrameRateController | null {
  return frameRateControllerInstance;
}

export function createTurnProcessor(): TurnProcessor {
  turnProcessorInstance = new TurnProcessor();
  return turnProcessorInstance;
}

export function getTurnProcessor(): TurnProcessor | null {
  return turnProcessorInstance;
}
