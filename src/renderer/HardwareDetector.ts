export type QualityPreset = 'lite' | 'medium' | 'high';

export interface HardwareInfo {
  cpuCores: number;
  gpuRenderer: string;
  gpuVendor: string;
  webglVersion: number;
  ram: number;
  isMobile: boolean;
  isLowEnd: boolean;
}

export interface RecommendedQuality {
  quality: QualityPreset;
  reason: string;
  fps: number;
}

export class HardwareDetector {
  private hardwareInfo: HardwareInfo | null = null;

  async detect(): Promise<HardwareInfo> {
    const info: HardwareInfo = {
      cpuCores: this.detectCPUCores(),
      gpuRenderer: this.detectGPURenderer(),
      gpuVendor: this.detectGPUVendor(),
      webglVersion: this.detectWebGLVersion(),
      ram: this.detectRAM(),
      isMobile: this.detectMobile(),
      isLowEnd: false,
    };

    info.isLowEnd = this.calculateLowEnd(info);

    this.hardwareInfo = info;
    return info;
  }

  private detectCPUCores(): number {
    return navigator.hardwareConcurrency || 4;
  }

  private detectGPURenderer(): string {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) return 'unknown';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    }
    
    return 'generic';
  }

  private detectGPUVendor(): string {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) return 'unknown';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    }
    
    return 'generic';
  }

  private detectWebGLVersion(): number {
    const canvas = document.createElement('canvas');
    if (canvas.getContext('webgl2')) return 2;
    if (canvas.getContext('webgl')) return 1;
    return 0;
  }

  private detectRAM(): number {
    return (navigator as { deviceMemory?: number }).deviceMemory || 4;
  }

  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private calculateLowEnd(info: HardwareInfo): boolean {
    if (info.isMobile) return true;
    if (info.cpuCores <= 2) return true;
    if (info.ram <= 4) return true;
    if (info.webglVersion < 2) return true;
    if (info.gpuRenderer.toLowerCase().includes('intel')) return true;
    
    return false;
  }

  recommendQuality(): RecommendedQuality {
    if (!this.hardwareInfo) {
      return { quality: 'lite', reason: 'Hardware not detected', fps: 30 };
    }

    const info = this.hardwareInfo;

    if (info.isLowEnd || info.isMobile) {
      return { quality: 'lite', reason: 'Low-end device detected', fps: 30 };
    }

    if (info.cpuCores >= 8 && info.ram >= 8 && info.webglVersion >= 2) {
      const isNvidia = info.gpuRenderer.toLowerCase().includes('nvidia');
      const isAmd = info.gpuRenderer.toLowerCase().includes('amd');
      const isIntelIris = info.gpuRenderer.toLowerCase().includes('iris');
      
      if (isNvidia || isAmd || isIntelIris) {
        return { quality: 'high', reason: 'High-end GPU detected', fps: 60 };
      }
    }

    if (info.cpuCores >= 4 && info.ram >= 6 && info.webglVersion >= 1) {
      return { quality: 'medium', reason: 'Mid-range hardware', fps: 45 };
    }

    return { quality: 'lite', reason: 'Limited hardware capabilities', fps: 30 };
  }

  getWebGLScore(): number {
    if (!this.hardwareInfo) return 0;

    let score = 0;

    score += this.hardwareInfo.webglVersion * 30;
    score += Math.min(this.hardwareInfo.cpuCores * 5, 30);
    score += Math.min(this.hardwareInfo.ram * 5, 20);

    if (this.hardwareInfo.gpuRenderer.toLowerCase().includes('nvidia')) score += 20;
    else if (this.hardwareInfo.gpuRenderer.toLowerCase().includes('amd')) score += 15;
    else if (this.hardwareInfo.gpuRenderer.toLowerCase().includes('intel')) score += 5;

    return Math.min(score, 100);
  }

  static getStoredPreference(): QualityPreset | null {
    try {
      const stored = localStorage.getItem('civlite_quality_preference');
      if (stored && ['lite', 'medium', 'high'].includes(stored)) {
        return stored as QualityPreset;
      }
    } catch {
      // Ignore storage errors
    }
    return null;
  }

  static setStoredPreference(quality: QualityPreset): void {
    try {
      localStorage.setItem('civlite_quality_preference', quality);
    } catch {
      // Ignore storage errors
    }
  }
}

export function createHardwareDetector(): HardwareDetector {
  return new HardwareDetector();
}
