precision highp float;

uniform sampler2D uBase;
uniform sampler2D uMult;
uniform vec2 uResolution;
uniform vec4 uColor;

void main() {
  vec2 xy = gl_FragCoord.xy;
  vec2 uv = xy / uResolution;
  uv.y = 1.0 - uv.y;
  vec4 baseColor = texture2D(uBase, uv);
  vec4 multColor = texture2D(uMult, uv);
  vec4 multedColor = baseColor * uColor;

  gl_FragColor = mix(baseColor, multedColor, multColor.a);
}
