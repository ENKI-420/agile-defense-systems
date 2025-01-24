class QuantumEffects {
constructor() {
    this.shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2() }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec2 resolution;
        varying vec2 vUv;
        
        float quantum_wave(vec2 pos, float t) {
        return sin(dot(pos, vec2(10.0)) + t) * 
                cos(dot(pos, vec2(-8.0, 6.0)) - t * 0.7);
        }
        
        void main() {
        vec2 pos = vUv * 2.0 - 1.0;
        vec3 color = vec3(0.0);
        
        float wave = quantum_wave(pos, time);
        color = vec3(0.1, 0.3, 0.9) + wave * 0.5;
        
        // Add quantum interference pattern
        float interference = sin(length(pos) * 20.0 - time) * 0.5 + 0.5;
        color += vec3(0.0, 0.2, 0.4) * interference;
        
        gl_FragColor = vec4(color, 1.0);
        }
    `
    });

    this.init();
    this.animate();
}

init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.quantum_plane = new THREE.Mesh(geometry, this.shaderMaterial);
    this.scene.add(this.quantum_plane);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.querySelector('.quantum-animation').appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onWindowResize.bind(this));
}

animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.shaderMaterial.uniforms.time.value += 0.01;
    this.renderer.render(this.scene, this.camera);
}

onWindowResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.shaderMaterial.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
}
}

// Initialize quantum effects
document.addEventListener('DOMContentLoaded', () => {
const quantumEffects = new QuantumEffects();
});

