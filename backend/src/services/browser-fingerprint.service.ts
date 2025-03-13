import { FingerPrintOptions } from '../types/automation.types';

export class BrowserFingerprintService {
  private static instance: BrowserFingerprintService | null = null;
  private lastFingerprintRotation = Date.now();
  private readonly FINGERPRINT_ROTATION_INTERVAL = 1000 * 60 * 30; // 30 minutes

  public static getInstance(): BrowserFingerprintService {
    if (!BrowserFingerprintService.instance) {
      BrowserFingerprintService.instance = new BrowserFingerprintService();
    }
    return BrowserFingerprintService.instance;
  }

  public shouldRotateFingerprint(): boolean {
    const now = Date.now();
    if (now - this.lastFingerprintRotation >= this.FINGERPRINT_ROTATION_INTERVAL) {
      this.lastFingerprintRotation = now;
      return true;
    }
    return false;
  }

  public getRandomFingerprint(): FingerPrintOptions {
    const screenSizes = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1536, height: 864 },
      { width: 1440, height: 900 },
      { width: 1280, height: 720 },
      { width: 2560, height: 1440 },
      { width: 3840, height: 2160 },
      { width: 1680, height: 1050 }
    ];
    
    const webglVendors = [
      {
        vendor: 'Google Inc. (NVIDIA)',
        renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0)',
        unmaskedVendor: 'NVIDIA Corporation',
        unmaskedRenderer: 'NVIDIA GeForce GTX 1660 SUPER',
        extensions: [
          'ANGLE_instanced_arrays',
          'EXT_blend_minmax',
          'EXT_color_buffer_half_float',
          'EXT_disjoint_timer_query',
          'EXT_float_blend',
          'EXT_frag_depth',
          'EXT_shader_texture_lod',
          'EXT_texture_compression_bptc',
          'EXT_texture_compression_rgtc',
          'EXT_texture_filter_anisotropic',
          'OES_element_index_uint',
          'OES_standard_derivatives',
          'OES_texture_float',
          'OES_texture_float_linear',
          'OES_texture_half_float',
          'OES_texture_half_float_linear',
          'OES_vertex_array_object',
          'WEBGL_color_buffer_float',
          'WEBGL_compressed_texture_s3tc',
          'WEBGL_compressed_texture_s3tc_srgb',
          'WEBGL_debug_renderer_info',
          'WEBGL_debug_shaders',
          'WEBGL_depth_texture',
          'WEBGL_draw_buffers',
          'WEBGL_lose_context',
          'WEBGL_multi_draw'
        ]
      },
      {
        vendor: 'Google Inc. (AMD)',
        renderer: 'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0)',
        unmaskedVendor: 'AMD',
        unmaskedRenderer: 'AMD Radeon RX 580',
        extensions: [
          'ANGLE_instanced_arrays',
          'EXT_blend_minmax',
          'EXT_color_buffer_half_float',
          'EXT_disjoint_timer_query',
          'EXT_float_blend',
          'EXT_frag_depth',
          'EXT_shader_texture_lod',
          'EXT_texture_compression_bptc',
          'EXT_texture_filter_anisotropic',
          'OES_element_index_uint',
          'OES_standard_derivatives',
          'OES_texture_float',
          'OES_texture_float_linear',
          'OES_texture_half_float',
          'OES_vertex_array_object',
          'WEBGL_color_buffer_float',
          'WEBGL_compressed_texture_s3tc',
          'WEBGL_depth_texture',
          'WEBGL_draw_buffers'
        ]
      },
      {
        vendor: 'Google Inc. (Intel)',
        renderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)',
        unmaskedVendor: 'Intel',
        unmaskedRenderer: 'Intel(R) UHD Graphics 630',
        extensions: [
          'ANGLE_instanced_arrays',
          'EXT_blend_minmax',
          'EXT_color_buffer_half_float',
          'EXT_disjoint_timer_query',
          'EXT_float_blend',
          'EXT_frag_depth',
          'EXT_shader_texture_lod',
          'EXT_texture_filter_anisotropic',
          'OES_element_index_uint',
          'OES_standard_derivatives',
          'OES_texture_float',
          'OES_texture_float_linear',
          'OES_texture_half_float',
          'OES_vertex_array_object',
          'WEBGL_color_buffer_float',
          'WEBGL_compressed_texture_s3tc',
          'WEBGL_depth_texture'
        ]
      }
    ];

    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Edg/122.0.2365.92',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OPR/108.0.0.0',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Vivaldi/6.5.3206.53'
    ];

    const fonts = [
      'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 'Cambria Math', 'Comic Sans MS', 'Consolas',
      'Courier', 'Courier New', 'Georgia', 'Helvetica', 'Impact', 'Lucida Console', 'Lucida Sans Unicode',
      'Microsoft Sans Serif', 'MS Gothic', 'MS PGothic', 'Palatino Linotype', 'Segoe UI', 'Tahoma', 'Times',
      'Times New Roman', 'Trebuchet MS', 'Verdana'
    ];

    const mediaDevices = [
      { kind: 'audioinput', label: 'Microphone (Realtek(R) Audio)' },
      { kind: 'audiooutput', label: 'Speakers (Realtek(R) Audio)' },
      { kind: 'videoinput', label: 'HD WebCam (1080p)' }
    ];

    const screen = screenSizes[Math.floor(Math.random() * screenSizes.length)];
    const webgl = webglVendors[Math.floor(Math.random() * webglVendors.length)];
    const selectedFonts = fonts.filter(() => Math.random() > 0.5);

    return {
      screen: {
        ...screen,
        availWidth: screen.width - Math.floor(Math.random() * 50),
        availHeight: screen.height - Math.floor(Math.random() * 100),
        colorDepth: 24,
        pixelDepth: 24,
        orientation: Math.random() > 0.5 ? 
          { type: 'landscape-primary', angle: 0 } :
          { type: 'portrait-primary', angle: 90 }
      },
      userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
      webgl: {
        ...webgl,
        antialias: Math.random() > 0.5,
        parameters: {
          'MAX_COMBINED_TEXTURE_IMAGE_UNITS': 32,
          'MAX_CUBE_MAP_TEXTURE_SIZE': 16384,
          'MAX_FRAGMENT_UNIFORM_VECTORS': 1024,
          'MAX_RENDERBUFFER_SIZE': 16384,
          'MAX_TEXTURE_IMAGE_UNITS': 16,
          'MAX_TEXTURE_SIZE': 16384,
          'MAX_VARYING_VECTORS': 30,
          'MAX_VERTEX_ATTRIBS': 16,
          'MAX_VERTEX_TEXTURE_IMAGE_UNITS': 16,
          'MAX_VERTEX_UNIFORM_VECTORS': 4096,
          'MAX_VIEWPORT_DIMS': [32767, 32767]
        }
      },
      cpu: {
        architecture: 'x86-64',
        cores: [4, 6, 8, 12, 16][Math.floor(Math.random() * 5)],
        platform: 'Win32',
        oscpu: 'Windows NT 10.0; Win64; x64'
      },
      memory: {
        deviceMemory: [4, 8, 16][Math.floor(Math.random() * 3)],
        jsHeapSizeLimit: 2 ** 31,
        totalJSHeapSize: Math.floor(Math.random() * 500000000) + 500000000,
        usedJSHeapSize: Math.floor(Math.random() * 100000000) + 100000000
      },
      battery: {
        charging: Math.random() > 0.3,
        chargingTime: Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 3600),
        dischargingTime: Math.floor(Math.random() * 7200) + 1800,
        level: Math.random()
      },
      network: {
        effectiveType: '4g',
        downlink: Math.floor(Math.random() * 30) + 10,
        rtt: Math.floor(Math.random() * 50) + 50,
        saveData: false
      },
      platform: 'Win32',
      plugins: [
        { name: 'Chrome PDF Plugin', description: 'Portable Document Format', filename: 'internal-pdf-viewer' },
        { name: 'Chrome PDF Viewer', description: '', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
        { name: 'Native Client', description: '', filename: 'internal-nacl-plugin' }
      ],
      mediaDevices: mediaDevices.filter(() => Math.random() > 0.3),
      fonts: selectedFonts,
      audio: {
        sampleRate: [44100, 48000, 96000][Math.floor(Math.random() * 3)],
        channelCount: [2, 4, 6][Math.floor(Math.random() * 3)],
        volume: Math.random()
      }
    };
  }
} 