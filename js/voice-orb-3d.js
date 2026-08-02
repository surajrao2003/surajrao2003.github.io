// ============================================================================
// VOICE AGENT 3D ORB — self-contained WebGL visual for the hero orb.
// Depends only on three.js (ESM CDN) and a <canvas> element.
// Public API: initVoiceOrb3D(canvas) -> { setState(state), setLevel(level) }
// To remove the voice agent entirely: delete this file, js/voice-orb.js,
// their two <script> tags in index.html, and the .voice-orb-wrap markup.
// ============================================================================

import * as THREE from "https://esm.sh/three@0.169.0";

const COLOR_A = new THREE.Color("#c07200"); // --accent-primary
const COLOR_B = new THREE.Color("#f9bf3f"); // --accent-3

const VERTEX_SHADER = /* glsl */ `
	varying vec3 vNormal;
	varying vec3 vViewDir;

	void main() {
		vec4 worldPos = modelMatrix * vec4(position, 1.0);
		vNormal = normalize(mat3(modelMatrix) * normal);
		vViewDir = normalize(cameraPosition - worldPos.xyz);
		gl_Position = projectionMatrix * viewMatrix * worldPos;
	}
`;

const FRAGMENT_SHADER = /* glsl */ `
	uniform vec3 colorA;
	uniform vec3 colorB;
	uniform float uTime;
	uniform float uLevel;
	uniform float uEnergy;

	varying vec3 vNormal;
	varying vec3 vViewDir;

	// Lightweight 3D simplex-style noise (Ashima-derived, trimmed for one octave use)
	vec3 mod289(vec3 x){ return x - floor(x / 289.0) * 289.0; }
	vec4 mod289(vec4 x){ return x - floor(x / 289.0) * 289.0; }
	vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
	vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

	float snoise(vec3 v){
		const vec2 C = vec2(1.0/6.0, 1.0/3.0);
		const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
		vec3 i  = floor(v + dot(v, C.yyy));
		vec3 x0 = v - i + dot(i, C.xxx);
		vec3 g = step(x0.yzx, x0.xyz);
		vec3 l = 1.0 - g;
		vec3 i1 = min(g.xyz, l.zxy);
		vec3 i2 = max(g.xyz, l.zxy);
		vec3 x1 = x0 - i1 + C.xxx;
		vec3 x2 = x0 - i2 + C.yyy;
		vec3 x3 = x0 - D.yyy;
		i = mod289(i);
		vec4 p = permute(permute(permute(
			i.z + vec4(0.0, i1.z, i2.z, 1.0))
			+ i.y + vec4(0.0, i1.y, i2.y, 1.0))
			+ i.x + vec4(0.0, i1.x, i2.x, 1.0));
		float n_ = 0.142857142857;
		vec3 ns = n_ * D.wyz - D.xzx;
		vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
		vec4 x_ = floor(j * ns.z);
		vec4 y_ = floor(j - 7.0 * x_);
		vec4 x = x_ * ns.x + ns.yyyy;
		vec4 y = y_ * ns.x + ns.yyyy;
		vec4 h = 1.0 - abs(x) - abs(y);
		vec4 b0 = vec4(x.xy, y.xy);
		vec4 b1 = vec4(x.zw, y.zw);
		vec4 s0 = floor(b0) * 2.0 + 1.0;
		vec4 s1 = floor(b1) * 2.0 + 1.0;
		vec4 sh = -step(h, vec4(0.0));
		vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
		vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
		vec3 p0 = vec3(a0.xy, h.x);
		vec3 p1 = vec3(a0.zw, h.y);
		vec3 p2 = vec3(a1.xy, h.z);
		vec3 p3 = vec3(a1.zw, h.w);
		vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
		p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
		vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
		m = m * m;
		return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
	}

	void main() {
		float n = snoise(vNormal * 2.2 + uTime * 0.18);
		float mixAmt = 0.5 + 0.5 * n;
		vec3 base = mix(colorA, colorB, clamp(mixAmt, 0.0, 1.0));

		// Directional key light for a rounded, softly-shaded sphere look
		vec3 lightDir = normalize(vec3(0.4, 0.6, 0.8));
		float diffuse = max(dot(vNormal, lightDir), 0.0);
		vec3 col = base * (0.62 + diffuse * 0.5);

		// Specular highlight (subtle)
		vec3 halfDir = normalize(lightDir + vViewDir);
		float spec = pow(max(dot(vNormal, halfDir), 0.0), 40.0);
		col += vec3(1.0, 0.98, 0.9) * spec * 0.35;

		// Fresnel rim brightening for a soft glowing edge
		float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), 2.2);
		col += fresnel * vec3(1.0, 0.85, 0.55) * (0.5 + uEnergy * 0.5);

		// Voice-reactive inner glow
		col += base * uLevel * 0.7;

		gl_FragColor = vec4(col, 1.0);
	}
`;

export function initVoiceOrb3D(canvas) {
	const renderer = new THREE.WebGLRenderer({
		canvas,
		alpha: true,
		antialias: true,
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 10);
	camera.position.z = 3.2;

	const geometry = new THREE.SphereGeometry(1, 96, 96);
	const material = new THREE.ShaderMaterial({
		vertexShader: VERTEX_SHADER,
		fragmentShader: FRAGMENT_SHADER,
		uniforms: {
			colorA: { value: COLOR_A },
			colorB: { value: COLOR_B },
			uTime: { value: 0 },
			uLevel: { value: 0 },
			uEnergy: { value: 0 },
		},
	});
	const sphere = new THREE.Mesh(geometry, material);
	scene.add(sphere);

	let size = 0;
	let level = 0;
	let energy = 0; // 0 = idle, 1 = active/speaking (drives fresnel brightness + rotation speed)
	let frameId = null;

	function resize() {
		const rect = canvas.getBoundingClientRect();
		size = rect.width || canvas.clientWidth || 180;
		const dpr = Math.min(window.devicePixelRatio, 2);
		renderer.setSize(size, size, false);
		canvas.width = size * dpr;
		canvas.height = size * dpr;
	}

	const resizeObserver = new ResizeObserver(resize);
	resizeObserver.observe(canvas);
	resize();
	window.addEventListener("load", resize);

	const clock = new THREE.Clock();

	function tick() {
		const dt = clock.getDelta();
		const t = clock.elapsedTime;

		material.uniforms.uTime.value = t;
		material.uniforms.uLevel.value += (level - material.uniforms.uLevel.value) * 0.15;
		material.uniforms.uEnergy.value += (energy - material.uniforms.uEnergy.value) * 0.05;

		const spinSpeed = 0.12 + material.uniforms.uEnergy.value * 0.35;
		sphere.rotation.y += dt * spinSpeed;
		sphere.rotation.x = Math.sin(t * 0.25) * 0.12;

		renderer.render(scene, camera);
		frameId = requestAnimationFrame(tick);
	}
	frameId = requestAnimationFrame(tick);

	return {
		setState(state) {
			energy = state === "active" || state === "speaking" ? 1 : state === "connecting" ? 0.5 : 0;
		},
		setLevel(v) {
			level = Math.max(0, Math.min(1, v));
		},
	};
}
