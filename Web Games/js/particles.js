class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, radius: 120 };
    this.colors = [
      'rgba(124, 58, 237, 0.5)',
      'rgba(6, 182, 212, 0.4)',
      'rgba(244, 114, 182, 0.35)',
      'rgba(52, 211, 153, 0.3)',
    ];
    this.resize();
    this.init();
    this.bindEvents();
    this.animate();
  }
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  init() {
    this.particles = [];
    const count = Math.min(Math.floor((this.canvas.width * this.canvas.height) / 14000), 80);
    for (let i = 0; i < count; i++) this.particles.push(this.createParticle());
  }
  createParticle() {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      opacity: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.005,
    };
  }
  bindEvents() {
    window.addEventListener('resize', () => { this.resize(); this.init(); });
    window.addEventListener('mousemove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
    window.addEventListener('mouseout', () => { this.mouse.x = null; this.mouse.y = null; });
  }
  update() {
    for (const p of this.particles) {
      p.x += p.speedX; p.y += p.speedY; p.pulse += p.pulseSpeed;
      if (this.mouse.x !== null) {
        const dx = p.x - this.mouse.x, dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          p.x += (dx / dist) * force * 1.5;
          p.y += (dy / dist) * force * 1.5;
        }
      }
      if (p.x < -10) p.x = this.canvas.width + 10;
      if (p.x > this.canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = this.canvas.height + 10;
      if (p.y > this.canvas.height + 10) p.y = -10;
    }
  }
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.update();
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          this.ctx.save();
          this.ctx.globalAlpha = (1 - dist / 140) * 0.1;
          this.ctx.strokeStyle = 'rgba(124,58,237,0.8)';
          this.ctx.lineWidth = 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
          this.ctx.restore();
        }
      }
    }
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = p.opacity + Math.sin(p.pulse) * 0.15;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
    requestAnimationFrame(() => this.animate());
  }
}
document.addEventListener('DOMContentLoaded', () => { new ParticleSystem('particles-canvas'); });
