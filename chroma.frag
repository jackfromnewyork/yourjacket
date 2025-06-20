precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D tex;
uniform float texWidth;
uniform float texHeight;

uniform vec3 keyColor;
uniform vec3 subColor;
uniform float similarity;
uniform float smoothness;
// uniform float spill;

// From https://github.com/libretro/glsl-shaders/blob/master/nnedi3/shaders/rgb-to-yuv.glsl
vec2 RGBtoUV(vec3 rgb) {
  return vec2(
    rgb.r * -0.169 + rgb.g * -0.331 + rgb.b *  0.5    + 0.5,
    rgb.r *  0.5   + rgb.g * -0.419 + rgb.b * -0.081  + 0.5
  );
}

vec4 ProcessChromaKey(vec2 texCoord) {
  vec4 rgba = texture2D(tex, texCoord);
  float chromaDist = distance(RGBtoUV(texture2D(tex, texCoord).rgb), RGBtoUV(keyColor));

  float baseMask = chromaDist - similarity;
  float fullMask = pow(clamp(baseMask / smoothness, 0., 1.), 1.5);
  // rgba.a = fullMask;

  float brightness = dot(rgba.rgb, vec3(0.2126, 0.7152, 0.0722));

  // float spillVal = pow(clamp(baseMask / spill, 0., 1.), 1.5);
  // float desat = clamp(rgba.r * 0.2126 + rgba.g * 0.7152 + rgba.b * 0.0722, 0., 1.);
  // rgba.rgb = mix(vec3(desat, desat, desat), rgba.rgb, spillVal);

   // Colorize with green where mask is low (close to key color)
  // vec3 targetColor = vec3(0.0, 1.0, 0.0) * brightness;; // green
  vec3 targetColor = subColor * brightness;
  rgba.rgb = mix(targetColor, rgba.rgb, fullMask);
  rgba.a = 1.0; // keep fully opaque

  return rgba;
}

void main(void) {
  vec2 flippedCoord = vec2(1.0 - vTexCoord.x, 1.0 - vTexCoord.y);
  gl_FragColor = ProcessChromaKey(flippedCoord);
}