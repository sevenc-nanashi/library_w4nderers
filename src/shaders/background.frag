precision highp float;

uniform sampler2D u_texture;
uniform sampler2D u_glowTexture;
uniform vec2 u_resolution;
uniform float u_pixelSize;
uniform float u_wave;
uniform float u_glowLevel;

float pixelQuantize = 32.0;

void main() {
  vec2 xy = gl_FragCoord.xy;
  xy.y = u_resolution.y - xy.y;
  vec2 xyPixel = floor(xy / u_pixelSize) * u_pixelSize;
  xyPixel.y += u_wave;
  vec2 uv = xyPixel / u_resolution;
  vec4 color = texture2D(u_texture, uv) * 0.6;
  for (int i = -1; i <= 1; i++) {
    for (int j = -1; j <= 1; j++) {
      vec2 offset = vec2(i, j) * u_pixelSize;
      color += texture2D(u_texture, (xyPixel + offset) / u_resolution) / 9.0 * 0.4;
    }
  }
  color = floor(color * pixelQuantize) / pixelQuantize;
  vec4 glow = texture2D(u_glowTexture, uv);
  color = 1.0 - (1.0 - color) * (1.0 - glow * u_glowLevel);

  gl_FragColor = color;
}
