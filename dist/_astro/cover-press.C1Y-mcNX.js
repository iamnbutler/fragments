const O=`#version 300 es
in vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`,V=`#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform float u_texAspect;
uniform vec2 u_focus;
uniform vec2 u_levels;
uniform vec3 u_c[8];
uniform int u_n;
uniform float u_steps;
uniform float u_scale;
uniform float u_seed;
out vec4 o;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { return 0.5 * vnoise(p) + 0.3 * vnoise(p * 2.1 + 3.1) + 0.2 * vnoise(p * 4.3 + 7.7); }
float grain(vec2 frag, float k) { return hash(floor(frag / u_scale) + k * 17.0 + u_seed); }

vec3 ramp(float t) {
  t = clamp(t, 0.0, 1.0) * float(u_n - 1);
  int i = int(floor(t));
  int j = min(i + 1, u_n - 1);
  return mix(u_c[i], u_c[j], fract(t));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = vec2(frag.x / u_res.x, 1.0 - frag.y / u_res.y);
  // cover-fit around the focus point
  float A = u_res.x / u_res.y;
  vec2 span = A > u_texAspect ? vec2(1.0, u_texAspect / A) : vec2(A / u_texAspect, 1.0);
  vec2 c = clamp(u_focus, span * 0.5, 1.0 - span * 0.5);
  vec2 st = c + (uv - 0.5) * span;

  vec3 src = texture(u_tex, st).rgb;
  float l = dot(src, vec3(0.2126, 0.7152, 0.0722));
  l = clamp((l - u_levels.x) / (u_levels.y - u_levels.x), 0.0, 1.0);
  l = pow(l, 0.9);

  // cut into steps; the grain decides each pixel at a step's edge
  float n = max(u_steps, 2.0);
  float d = (grain(frag, 1.0) - 0.5) * 0.6;
  float q = clamp(floor(l * (n - 1.0) + 0.5 + d), 0.0, n - 1.0) / (n - 1.0);
  vec3 col = ramp(q);

  // ink mottle, paper tooth, dropout
  float m = fbm(uv * vec2(A, 1.0) * 7.0 + u_seed);
  col *= 1.0 + (m - 0.5) * 0.07;
  col += (grain(frag, 2.0) - 0.5) * 0.07;
  col = mix(col, u_c[u_n - 1], step(0.9975, grain(frag, 5.0)) * 0.6);
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`,H=R=>{const n=parseInt(R.slice(1),16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]},A=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;function Y(R){const n=R.querySelector(".cv"),c=n?.querySelector(".cv-gl"),u=n?.querySelector(".cv-plate");if(!n||!c||!u)return;const p=JSON.parse(n.dataset.works??"[]"),L=JSON.parse(n.dataset.maps??"{}");if(!p.length)return;const e=c.getContext("webgl2",{antialias:!1,premultipliedAlpha:!1});if(!e)return;const w=(o,t)=>{const s=e.createShader(o);if(e.shaderSource(s,t),e.compileShader(s),!e.getShaderParameter(s,e.COMPILE_STATUS))throw new Error(e.getShaderInfoLog(s)??"shader");return s},f=e.createProgram();if(e.attachShader(f,w(e.VERTEX_SHADER,O)),e.attachShader(f,w(e.FRAGMENT_SHADER,V)),e.linkProgram(f),!e.getProgramParameter(f,e.LINK_STATUS))return;e.useProgram(f),e.bindBuffer(e.ARRAY_BUFFER,e.createBuffer()),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW);const y=e.getAttribLocation(f,"a");e.enableVertexAttribArray(y),e.vertexAttribPointer(y,2,e.FLOAT,!1,0,0);const i=o=>e.getUniformLocation(f,o),l={res:i("u_res"),texAspect:i("u_texAspect"),focus:i("u_focus"),levels:i("u_levels"),c:i("u_c"),n:i("u_n"),steps:i("u_steps"),scale:i("u_scale"),seed:i("u_seed")},M=e.createTexture();e.bindTexture(e.TEXTURE_2D,M),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);const P={ed:n.querySelector(".cv-ed"),title:n.querySelector(".cv-title")},g=n.querySelector(".cv-img"),X=7,E=Number(new URLSearchParams(location.search).get("cover")),k=Number(n.dataset.start??0);let v=Number.isInteger(E)&&E>=1&&E<=p.length?E-1:k,d=p[v],a=null,h=2,U=X,S=null,T=!1,x=0,b=0,I=Math.random()*400;const G=()=>{const o=c.getBoundingClientRect(),t=Math.min(devicePixelRatio||1,2),s=Math.min(1,2400/(o.width*t)),r=Math.round(o.width*t*s),m=Math.round(o.height*t*s);return(c.width!==r||c.height!==m)&&(c.width=r,c.height=m),t*s},C=()=>{if(!a)return;const o=G();e.viewport(0,0,c.width,c.height),a instanceof HTMLVideoElement&&a.readyState>=2&&e.texImage2D(e.TEXTURE_2D,0,e.RGB,e.RGB,e.UNSIGNED_BYTE,a);const t=L[d.map]??Object.values(L)[0],s=new Float32Array(24);t.slice(0,8).forEach((r,m)=>s.set(H(r),m*3)),e.uniform2f(l.res,c.width,c.height),e.uniform1f(l.texAspect,d.aspect),e.uniform2f(l.focus,d.focus[0],d.focus[1]),e.uniform2f(l.levels,d.levels[0],d.levels[1]),e.uniform3fv(l.c,s),e.uniform1i(l.n,Math.min(t.length,8)),e.uniform1f(l.steps,Math.round(h)),e.uniform1f(l.scale,o),e.uniform1f(l.seed,I),e.drawArrays(e.TRIANGLES,0,3)},q=()=>a instanceof HTMLVideoElement&&!a.paused,D=o=>{x=0;const t=S??U;Math.round(h)!==t&&o-b>90&&(h+=Math.sign(t-h),b=o),C(),(Math.round(h)!==t||q())&&(x=requestAnimationFrame(D))},_=()=>{x||(x=requestAnimationFrame(D))},N=o=>u.getBoundingClientRect().width*Math.min(devicePixelRatio||1,2)<=800?o.small:o.still,B=o=>{const t=p[o],s=r=>{if(o!==v)return;a instanceof HTMLVideoElement&&a!==r&&(a.pause(),a.removeAttribute("src"),a.load()),a=r,d=t,e.bindTexture(e.TEXTURE_2D,M),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.texImage2D(e.TEXTURE_2D,0,e.RGB,e.RGB,e.UNSIGNED_BYTE,r);const m=N(t);g.currentSrc!==new URL(m,location.href).href&&(g.removeAttribute("srcset"),g.src=m),g.style.objectPosition=`${t.focus[0]*100}% ${t.focus[1]*100}%`,P.ed.textContent=`${o+1}/${p.length}`,P.title.textContent=`Untitled, ${t.date}`,h=A()?U:2,I=Math.random()*400,n.classList.add("is-live"),r instanceof HTMLVideoElement&&T&&!A()&&r.play().catch(()=>{}),_()};if(t.loop&&!A()){const r=document.createElement("video");r.muted=!0,r.loop=!0,r.playsInline=!0,r.preload="auto",r.crossOrigin="anonymous",r.addEventListener("loadeddata",()=>s(r),{once:!0}),r.src=t.loop,r.load()}else{const r=new Image;r.decoding="async",r.onload=()=>s(r),r.src=N(t)}};u.addEventListener("click",()=>{v=(v+1)%p.length,B(v)}),u.addEventListener("pointermove",o=>{if(o.pointerType!=="mouse")return;const t=u.getBoundingClientRect();S=Math.round(3+(o.clientX-t.left)/t.width*13),_()}),u.addEventListener("pointerleave",()=>{S=null,_()}),new IntersectionObserver(([o])=>{T=o.isIntersecting,a instanceof HTMLVideoElement&&(T&&!A()?a.play().then(_).catch(()=>{}):a.pause()),T&&_()}).observe(u);let F=0;addEventListener("resize",()=>{clearTimeout(F),F=window.setTimeout(_,120)}),c.addEventListener("webglcontextlost",()=>n.classList.remove("is-live")),B(v)}export{Y as coverPress};
