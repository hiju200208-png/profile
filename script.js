import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const revealElements = document.querySelectorAll(".reveal");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reducedMotion) revealElements.forEach((el) => el.classList.add("show"));
else {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add("show"); observer.unobserve(entry.target); }
    }), { threshold: 0.1 });
    revealElements.forEach((el) => observer.observe(el));
}

const canvas = document.querySelector("#three-canvas");
const holder = document.querySelector(".hero-visual");
const status = document.querySelector("#three-status");

try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.05, 9.3);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.42;

    const world = new THREE.Group();
    world.scale.setScalar(0.88);
    world.rotation.z = -0.12;
    scene.add(world);

    const planet = new THREE.Mesh(
        new THREE.SphereGeometry(1.72, 128, 128),
        new THREE.MeshPhysicalMaterial({
            color: 0x8b8fa0,
            metalness: 0.76,
            roughness: 0.12,
            clearcoat: 1,
            clearcoatRoughness: 0.035,
            iridescence: 1,
            iridescenceIOR: 1.72,
            iridescenceThicknessRange: [180, 920]
        })
    );
    world.add(planet);

    const ringMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xb9b6cb,
        metalness: 0.82,
        roughness: 0.09,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        transparent: true,
        opacity: 0.93,
        side: THREE.DoubleSide,
        iridescence: 1,
        iridescenceIOR: 1.8,
        iridescenceThicknessRange: [160, 1050]
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.36, 0.17, 40, 240), ringMaterial);
    ring.rotation.set(1.16, 0.18, 0.04);
    world.add(ring);

    const upperRing = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.065, 24, 220), ringMaterial.clone());
    upperRing.material.opacity = 0.74;
    upperRing.rotation.set(0.66, 1.04, -0.24);
    world.add(upperRing);

    const orbit = new THREE.Mesh(
        new THREE.TorusGeometry(3.05, 0.012, 8, 240),
        new THREE.MeshBasicMaterial({ color: 0xa7a8b7, transparent: true, opacity: 0.34 })
    );
    orbit.rotation.set(1.26, 0.04, -0.22);
    world.add(orbit);

    const moonPivot = new THREE.Group();
    moonPivot.rotation.set(0.15, 0, 0.12);
    world.add(moonPivot);
    const moon = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 40, 40),
        new THREE.MeshPhysicalMaterial({ color: 0xd8d7e1, metalness: 0.55, roughness: 0.12, clearcoat: 1, iridescence: .55 })
    );
    moon.position.set(3.05, 0.05, 0);
    moonPivot.add(moon);

    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 720;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - .5) * 24;
        positions[i * 3 + 1] = (Math.random() - .5) * 15;
        positions[i * 3 + 2] = -3 - Math.random() * 14;
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({
        color: 0xd7ddf3, size: 0.022, transparent: true, opacity: 0.78, sizeAttenuation: true
    }));
    scene.add(stars);

    scene.add(new THREE.HemisphereLight(0xb9c3e7, 0x08090d, 1.6));
    const white = new THREE.PointLight(0xffffff, 62, 28); white.position.set(3.8, 3.6, 5.4); scene.add(white);
    const lavender = new THREE.PointLight(0x8f82ff, 42, 24); lavender.position.set(-3.8, -1.4, 4.2); scene.add(lavender);
    const pearl = new THREE.PointLight(0xf6e8dc, 31, 20); pearl.position.set(2.7, -3.2, 3.4); scene.add(pearl);
    const blue = new THREE.PointLight(0x8fb8ff, 24, 18); blue.position.set(-2.2, 3.0, 2.5); scene.add(blue);

    let pointerX = 0, pointerY = 0, dragX = 0, dragY = 0, dragging = false, lastX = 0, lastY = 0;
    holder.addEventListener("pointermove", (event) => {
        const rect = holder.getBoundingClientRect();
        pointerX = ((event.clientX - rect.left) / rect.width - .5) * 2;
        pointerY = ((event.clientY - rect.top) / rect.height - .5) * 2;
        if (dragging) {
            dragY += (event.clientX - lastX) * .007;
            dragX += (event.clientY - lastY) * .007;
            lastX = event.clientX; lastY = event.clientY;
        }
    });
    holder.addEventListener("pointerdown", (event) => { dragging = true; lastX = event.clientX; lastY = event.clientY; canvas.setPointerCapture?.(event.pointerId); });
    holder.addEventListener("pointerup", () => dragging = false);
    holder.addEventListener("pointercancel", () => dragging = false);
    holder.addEventListener("pointerleave", () => { if (!dragging) { pointerX = 0; pointerY = 0; } });

    function resize() {
        const width = Math.max(holder.clientWidth, 1);
        const height = Math.max(holder.clientHeight, 1);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.fov = width < 520 ? 42 : 34;
        camera.position.z = width < 520 ? 10.3 : 9.3;
        world.scale.setScalar(width < 520 ? .72 : width < 760 ? .80 : .88);
        camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    function animate() {
        const t = clock.getElapsedTime();
        if (!reducedMotion) {
            planet.rotation.y = t * .10;
            ring.rotation.z = .04 + t * .055;
            upperRing.rotation.z = -.24 - t * .038;
            orbit.rotation.z = -.22 + t * .018;
            moonPivot.rotation.z = t * .25;
            stars.rotation.y = t * .0025;
            world.rotation.y += ((pointerX * .16 + dragY) - world.rotation.y) * .03;
            world.rotation.x += ((-pointerY * .10 + dragX) - world.rotation.x) * .03;
            world.position.y = Math.sin(t * .55) * .055;
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
