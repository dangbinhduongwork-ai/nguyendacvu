/**
 * NGUYỄN ĐẮC VŨ - 3D FOOD TECHNOLOGY PORTFOLIO
 * Pure Vanilla JavaScript (Zero External Libraries)
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 1. 3D PARTICLE SYSTEM (CANVAS API)
    // ==========================================================================
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const isMobile = window.innerWidth <= 768;
    const PARTICLE_COUNT = isMobile ? 180 : 450;
    const FOV = 400; // Field of View for 3D projection

    const particles = [];
    const ripples = [];

    // Mouse coordinates in 3D centered space
    const mouse = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0
    };

    // Color gradient palette: Cyan -> Blue -> Purple
    const colorPalette = [
        'rgba(0, 242, 254, ',   // Cyan
        'rgba(79, 172, 254, ',  // Blue
        'rgba(121, 40, 202, ',  // Purple
        'rgba(184, 0, 255, '    // Bright Purple
    ];

    class Particle3D {
        constructor() {
            this.reset();
            this.z = Math.random() * 1000 - 200;
        }

        reset() {
            this.x = (Math.random() - 0.5) * width * 1.5;
            this.y = (Math.random() - 0.5) * height * 1.5;
            this.z = 1000;
            this.baseSize = Math.random() * 2 + 1.2;
            this.speedZ = Math.random() * 0.8 + 0.3;
            this.colorPrefix = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        }

        update() {
            this.z -= this.speedZ;

            // React gently to mouse offset
            this.x += (mouse.x * 0.05 - this.x * 0.001);
            this.y += (mouse.y * 0.05 - this.y * 0.001);

            // Recycle if particle passes camera
            if (this.z <= -FOV + 10) {
                this.reset();
            }
        }

        draw() {
            // Perspective Projection math: 3D (x, y, z) -> 2D (screenX, screenY)
            const scale = FOV / (FOV + this.z);
            if (scale < 0) return;

            const screenX = this.x * scale + width / 2;
            const screenY = this.y * scale + height / 2;

            const size = Math.max(0.2, this.baseSize * scale);
            const depthAlpha = Math.min(1, Math.max(0.08, (1 - this.z / 1000) * 0.9));

            ctx.beginPath();
            ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
            ctx.fillStyle = this.colorPrefix + depthAlpha + ')';
            ctx.fill();

            this.projX = screenX;
            this.projY = screenY;
            this.projScale = scale;
            this.alpha = depthAlpha;
        }
    }

    // Initialize 3D particle cloud
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle3D());
    }

    // Ripple click class
    class Ripple {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 0;
            this.maxRadius = 240;
            this.alpha = 0.8;
            this.speed = 4;
        }

        update() {
            this.radius += this.speed;
            this.alpha = Math.max(0, 1 - (this.radius / this.maxRadius));
        }

        draw() {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 242, 254, ${this.alpha * 0.6})`;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00f2fe';
            ctx.stroke();
            ctx.restore();
        }
    }

    // Mouse listeners
    window.addEventListener('mousemove', (e) => {
        mouse.targetX = e.clientX - width / 2;
        mouse.targetY = e.clientY - height / 2;
    });

    window.addEventListener('click', (e) => {
        ripples.push(new Ripple(e.clientX, e.clientY));
    });

    // Resize handler
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    // Animation Loop
    function animateParticles() {
        ctx.clearRect(0, 0, width, height);

        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        // Render Ripples
        for (let r = ripples.length - 1; r >= 0; r--) {
            ripples[r].update();
            ripples[r].draw();
            if (ripples[r].alpha <= 0) {
                ripples.splice(r, 1);
            }
        }

        // Update & Render Particles
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
        }

        // Draw faint connecting lines between neighbor particles
        const maxDist = isMobile ? 50 : 75;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];

                if (Math.abs(p1.z - p2.z) < 180) {
                    const dx = p1.projX - p2.projX;
                    const dy = p1.projY - p2.projY;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < maxDist) {
                        const lineAlpha = (1 - dist / maxDist) * 0.15 * p1.alpha;
                        ctx.beginPath();
                        ctx.moveTo(p1.projX, p1.projY);
                        ctx.lineTo(p2.projX, p2.projY);
                        ctx.strokeStyle = `rgba(0, 242, 254, ${lineAlpha})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }
            }
        }

        requestAnimationFrame(animateParticles);
    }
    requestAnimationFrame(animateParticles);


    // ==========================================================================
    // 2. CUSTOM CURSOR
    // ==========================================================================
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');

    if (!isMobile && cursorDot && cursorRing) {
        let cursorX = window.innerWidth / 2;
        let cursorY = window.innerHeight / 2;
        let ringX = cursorX;
        let ringY = cursorY;

        window.addEventListener('mousemove', (e) => {
            cursorX = e.clientX;
            cursorY = e.clientY;
            cursorDot.style.left = `${cursorX}px`;
            cursorDot.style.top = `${cursorY}px`;
        });

        function renderRing() {
            ringX += (cursorX - ringX) * 0.18;
            ringY += (cursorY - ringY) * 0.18;
            cursorRing.style.left = `${ringX}px`;
            cursorRing.style.top = `${ringY}px`;
            requestAnimationFrame(renderRing);
        }
        requestAnimationFrame(renderRing);

        // Hover expand cursor on interactive targets
        const hoverTargets = document.querySelectorAll('a, button, .tilt-card, .btn, .avatar-frame');
        hoverTargets.forEach(target => {
            target.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            target.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });
    }


    // ==========================================================================
    // 3. 3D TILT EFFECT ON CARDS & AVATAR
    // ==========================================================================
    const tiltCards = document.querySelectorAll('.tilt-card');

    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -12;
            const rotateY = ((x - centerX) / centerX) * 12;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
        });
    });


    // ==========================================================================
    // 4. SCROLL ANIMATION (INTERSECTION OBSERVER)
    // ==========================================================================
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));


    // ==========================================================================
    // 5. NAVBAR SCROLL EFFECT & MOBILE MENU
    // ==========================================================================
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });
    }

    // Close menu when clicking link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('open')) {
                navMenu.classList.remove('open');
            }
        });
    });

    // Active Section Tracking
    const sections = document.querySelectorAll('section');
    window.addEventListener('scroll', () => {
        let currentSection = '';
        const scrollPosition = window.pageYOffset + 200;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });

});