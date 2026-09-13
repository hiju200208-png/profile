import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const revealElements = document.querySelectorAll(".reveal");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reducedMotion) {
    revealElements.forEach((element) => element.classList.add("show"));
} else {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    revealElements.forEach((element) => observer.observe(element));
}

const canvas = document.querySelector("#three-canvas");
const holder = document.querySelector(".hero-visual");
const status = document.querySelector("#three-status");

try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.15, 7.2);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    const world = new THREE.Group();
    world.rotation.z = -0.16;
    scene.add(world);

    const planetMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x596273,
        metalness: 0.72,
        roughness: 0.17,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        iridescence: 0.72,
        iridescenceIOR: 1.55,
        iridescenceThicknessRange: [180, 650]
    });

    const planet = new THREE.Mesh(new THREE.SphereGeometry(1.62, 96, 96), planetMaterial);
    world.add(planet);

    const ringMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xaab2c5,
        metalness: 0.85,
        roughness: 0.13,
        clearcoat: 1,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        iridescence: 1,
        iridescenceIOR: 1.7,
        iridescenceThicknessRange: [120, 900]
    });

    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.19, 32, 180), ringMaterial);
    ring.rotation.x = 1.16;
    ring.rotation.y = 0.24;
    world.add(ring);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.48, 0.035, 16, 180), new THREE.MeshBasicMaterial({ color: 0x8b91a3, transparent: true, opacity: 0.42 }));
    ring2.rotation.x = 0.55;
    ring2.rotation.y = 0.9;
    world.add(ring2);

    const moonPivot = new THREE.Group();
    moonPivot.rotation.x = 0.45;
    world.add(moonPivot);
    const moon = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 32), new THREE.MeshPhysicalMaterial({ color: 0xd9dce5, metalness: 0.6, roughness: 0.18, clearcoat: 1 }));
    moon.position.set(3.05, 0, 0);
    moonPivot.add(moon);

    const starGeometry = new THREE.BufferGeometry();
    const starCount = 520;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const radius = 8 + Math.random() * 12;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 2] = radius * Math.cos(phi);
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xc8ccd7, size: 0.025, transparent: true, opacity: 0.75 }));
    scene.add(stars);

    scene.add(new THREE.AmbientLight(0x667088, 1.1));
    const key = new THREE.PointLight(0xffffff, 42, 30); key.position.set(3.5, 3.2, 4.5); scene.add(key);
    const violet = new THREE.PointLight(0x7a6cff, 28, 20); violet.position.set(-3, -1.5, 3); scene.add(violet);
    const warm = new THREE.PointLight(0xffd5a5, 20, 18); warm.position.set(2.5, -2.5, 2); scene.add(warm);

    let pointerX = 0;
    let pointerY = 0;
    let dragX = 0;
    let dragY = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    holder.addEventListener("pointermove", (event) => {
        const rect = holder.getBoundingClientRect();
        pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        if (dragging) {
            dragY += (event.clientX - lastX) * 0.008;
            dragX += (event.clientY - lastY) * 0.008;
            lastX = event.clientX;
            lastY = event.clientY;
        }
    });
    holder.addEventListener("pointerdown", (event) => { dragging = true; lastX = event.clientX; lastY = event.clientY; canvas.setPointerCapture?.(event.pointerId); });
    holder.addEventListener("pointerup", () => { dragging = false; });
    holder.addEventListener("pointercancel", () => { dragging = false; });
    holder.addEventListener("pointerleave", () => { if (!dragging) { pointerX = 0; pointerY = 0; } });

    function resize() {
        const width = holder.clientWidth;
        const height = holder.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    function animate() {
        const t = clock.getElapsedTime();
        if (!reducedMotion) {
            planet.rotation.y = t * 0.13;
            ring.rotation.z = t * 0.09;
            ring2.rotation.z = -t * 0.06;
            moonPivot.rotation.z = t * 0.34;
            stars.rotation.y = t * 0.004;
            world.rotation.y += ((pointerX * 0.22 + dragY) - world.rotation.y) * 0.035;
            world.rotation.x += ((-pointerY * 0.14 + dragX) - world.rotation.x) * 0.035;
            world.position.y = Math.sin(t * 0.7) * 0.08;
        }
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }
    animate();
    status.textContent = "DRAG / MOVE";
} catch (error) {
    console.error(error);
    status.textContent = "3D VIEW UNAVAILABLE";
}
