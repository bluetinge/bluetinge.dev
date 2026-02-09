// WebGL2 texture-related enums, grouped into "default" (core WebGL2) vs extension-provided.
// Notes:
// - These are *enum options* you can choose from. Whether a given (internalFormat, format, type)
//   combination is legal is constrained by the WebGL2 spec tables.
// - Some extensions (e.g. float linear filtering / float color buffer) change *capabilities*
//   without introducing new enums (so they won’t appear here as added lists).
export const WebGL2TextureOptions = {
  // --- Sampler params --------------------------------------------------------
  MinFilters: {
    default: [
      "gl.NEAREST",
      "gl.LINEAR",
      "gl.NEAREST_MIPMAP_NEAREST",
      "gl.LINEAR_MIPMAP_NEAREST",
      "gl.NEAREST_MIPMAP_LINEAR",
      "gl.LINEAR_MIPMAP_LINEAR",
    ],
  },

  MagFilters: {
    default: ["gl.NEAREST", "gl.LINEAR"],
  },

  WrapOptions: {
    default: ["gl.CLAMP_TO_EDGE", "gl.REPEAT", "gl.MIRRORED_REPEAT"],
    EXT_texture_mirror_clamp_to_edge: ["ext.MIRROR_CLAMP_TO_EDGE_EXT"],
  },

  TextureCompareFunc: {
    default: [
      "gl.LEQUAL",
      "gl.GEQUAL",
      "gl.LESS",
      "gl.GREATER",
      "gl.EQUAL",
      "gl.NOTEQUAL",
      "gl.ALWAYS",
      "gl.NEVER",
    ],
  },

  TextureCompareMode: {
    default: ["gl.NONE", "gl.COMPARE_REF_TO_TEXTURE"],
  },

  // --- Pixel data "format" (the `format` argument to texImage2D/texSubImage2D) ----
  // Core WebGL2 base formats:
  Formats: {
    default: [
      // normalized / float-able base formats
      "gl.RED",
      "gl.RG",
      "gl.RGB",
      "gl.RGBA",

      // integer base formats (used with *I/*UI internalformats)
      "gl.RED_INTEGER",
      "gl.RG_INTEGER",
      "gl.RGB_INTEGER",
      "gl.RGBA_INTEGER",

      // depth / depth-stencil
      "gl.DEPTH_COMPONENT",
      "gl.DEPTH_STENCIL",
    ],

    // WebGL2 also supports WebGL1 “unsized” legacy formats for compatibility in many cases:
    // (Commonly used with UNSIGNED_BYTE uploads / TexImageSource conversions.)
    WebGL1_compat: ["gl.ALPHA", "gl.LUMINANCE", "gl.LUMINANCE_ALPHA"],
  },

  // --- GPU storage "internalformat" (sized internal formats for texStorage* / WebGL2 texImage*) ----
  InternalFormats: {
    default: [
      // ---- Unsigned normalized (UNORM) color ----
      "gl.R8",
      "gl.RG8",
      "gl.RGB8",
      "gl.RGBA8",
      "gl.RGB565",
      "gl.RGBA4",
      "gl.RGB5_A1",
      "gl.RGB10_A2",

      // ---- Signed normalized (SNORM) color ----
      "gl.R8_SNORM",
      "gl.RG8_SNORM",
      "gl.RGB8_SNORM",
      "gl.RGBA8_SNORM",

      // ---- sRGB ----
      "gl.SRGB8",
      "gl.SRGB8_ALPHA8",

      // ---- Floating point color ----
      "gl.R16F",
      "gl.RG16F",
      "gl.RGB16F",
      "gl.RGBA16F",
      "gl.R32F",
      "gl.RG32F",
      "gl.RGB32F",
      "gl.RGBA32F",

      // ---- Unsigned integer color ----
      "gl.R8UI",
      "gl.RG8UI",
      "gl.RGB8UI",
      "gl.RGBA8UI",
      "gl.R16UI",
      "gl.RG16UI",
      "gl.RGB16UI",
      "gl.RGBA16UI",
      "gl.R32UI",
      "gl.RG32UI",
      "gl.RGB32UI",
      "gl.RGBA32UI",
      "gl.RGB10_A2UI",

      // ---- Signed integer color ----
      "gl.R8I",
      "gl.RG8I",
      "gl.RGB8I",
      "gl.RGBA8I",
      "gl.R16I",
      "gl.RG16I",
      "gl.RGB16I",
      "gl.RGBA16I",
      "gl.R32I",
      "gl.RG32I",
      "gl.RGB32I",
      "gl.RGBA32I",

      // ---- Depth / stencil ----
      "gl.DEPTH_COMPONENT16",
      "gl.DEPTH_COMPONENT24",
      "gl.DEPTH_COMPONENT32F",
      "gl.DEPTH24_STENCIL8",
      "gl.DEPTH32F_STENCIL8",
      "gl.STENCIL_INDEX8",
    ],

    // Adds additional 16-bit normalized fixed-point formats (and SNORM variants)
    EXT_texture_norm16: [
      "ext.R16_EXT",
      "ext.RG16_EXT",
      "ext.RGB16_EXT",
      "ext.RGBA16_EXT",
      "ext.R16_SNORM_EXT",
      "ext.RG16_SNORM_EXT",
      "ext.RGB16_SNORM_EXT",
      "ext.RGBA16_SNORM_EXT",
    ],

    // Mostly relevant for WebGL1 paths (WebGL2 usually uses gl.SRGB8 / gl.SRGB8_ALPHA8)
    EXT_sRGB: ["ext.SRGB_EXT", "ext.SRGB_ALPHA_EXT"],

    // ---- Compressed internalformats (extension-defined enums) ----
    WEBGL_compressed_texture_s3tc: [
      "ext.COMPRESSED_RGB_S3TC_DXT1_EXT",
      "ext.COMPRESSED_RGBA_S3TC_DXT1_EXT",
      "ext.COMPRESSED_RGBA_S3TC_DXT3_EXT",
      "ext.COMPRESSED_RGBA_S3TC_DXT5_EXT",
    ],

    WEBGL_compressed_texture_s3tc_srgb: [
      "ext.COMPRESSED_SRGB_S3TC_DXT1_EXT",
      "ext.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT",
      "ext.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT",
      "ext.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT",
    ],

    WEBGL_compressed_texture_etc: [
      "ext.COMPRESSED_R11_EAC",
      "ext.COMPRESSED_SIGNED_R11_EAC",
      "ext.COMPRESSED_RG11_EAC",
      "ext.COMPRESSED_SIGNED_RG11_EAC",
      "ext.COMPRESSED_RGB8_ETC2",
      "ext.COMPRESSED_SRGB8_ETC2",
      "ext.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2",
      "ext.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2",
      "ext.COMPRESSED_RGBA8_ETC2_EAC",
      "ext.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC",
    ],

    WEBGL_compressed_texture_pvrtc: [
      "ext.COMPRESSED_RGB_PVRTC_4BPPV1_IMG",
      "ext.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG",
      "ext.COMPRESSED_RGB_PVRTC_2BPPV1_IMG",
      "ext.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG",
    ],

    WEBGL_compressed_texture_astc: [
      // LDR RGBA
      "ext.COMPRESSED_RGBA_ASTC_4x4_KHR",
      "ext.COMPRESSED_RGBA_ASTC_5x4_KHR",
      "ext.COMPRESSED_RGBA_ASTC_5x5_KHR",
      "ext.COMPRESSED_RGBA_ASTC_6x5_KHR",
      "ext.COMPRESSED_RGBA_ASTC_6x6_KHR",
      "ext.COMPRESSED_RGBA_ASTC_8x5_KHR",
      "ext.COMPRESSED_RGBA_ASTC_8x6_KHR",
      "ext.COMPRESSED_RGBA_ASTC_8x8_KHR",
      "ext.COMPRESSED_RGBA_ASTC_10x5_KHR",
      "ext.COMPRESSED_RGBA_ASTC_10x6_KHR",
      "ext.COMPRESSED_RGBA_ASTC_10x8_KHR",
      "ext.COMPRESSED_RGBA_ASTC_10x10_KHR",
      "ext.COMPRESSED_RGBA_ASTC_12x10_KHR",
      "ext.COMPRESSED_RGBA_ASTC_12x12_KHR",

      // LDR sRGB+Alpha
      "ext.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR",
      "ext.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR",
      "ext.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR",
      "ext.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR",
      "ext.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR",
      "ext.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR",
      "ext.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR",
      "ext.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR",
      "ext.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR",
      "ext.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR",
      "ext.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR",
      "ext.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR",
      "ext.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR",
      "ext.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR",
    ],
  },
};
