const firstCube = document.querySelector('.first-cube');
const secondCube = document.querySelector('.second-cube');
const thirdCube = document.querySelector('.third-cube');
const fourthCube = document.querySelector('.fourth-cube');

// Add audio element
const audio = new Audio('vapor_music.mp3');
audio.loop = true;
audio.volume = 0.3;

// Play music when page loads
window.addEventListener('load', () => {
    audio.play().catch(e => console.log("Audio play failed:", e));
});

// First cube variables (moved outside animate function)
let x = 100, y = 100; // Changed starting position
let dx = 4, dy = 4;
let rotationX = 0, rotationY = 0;
let dRx = 0.5, dRy = 0.5;

// Second cube variables (moved outside animate function)
let secondX = 500, secondY = 300; // Changed starting position to be further apart
let secondDx = -3, secondDy = 3;
let secondRotationX = 0, secondRotationY = 0;
let secondDRx = 0.3, secondDRy = 0.8;

// Third cube variables (moved outside animate function)
let thirdX = 300, thirdY = 200; // Changed starting position to be further apart
let thirdDx = 2, thirdDy = -4;
let thirdRotationX = 0, thirdRotationY = 0;
let thirdDRx = 0.7, thirdDRy = 0.4;

// Fourth cube variables (moved outside animate function)
let fourthX = 700, fourthY = 100; // Changed starting position to be further apart
let fourthDx = -2, fourthDy = 3;
let fourthRotationX = 0, fourthRotationY = 0;
let fourthDRx = 0.5, fourthDRy = 0.6;

// Reusable collision calculation function
function calculateCollision(mass1, mass2, u1x, u1y, u2x, u2y) {
    const v1x = ((mass1 - mass2) * u1x + 2 * mass2 * u2x) / (mass1 + mass2);
    const v1y = ((mass1 - mass2) * u1y + 2 * mass2 * u2y) / (mass1 + mass2);
    const v2x = ((mass2 - mass1) * u2x + 2 * mass1 * u1x) / (mass1 + mass2);
    const v2y = ((mass2 - mass1) * u2y + 2 * mass1 * u1y) / (mass1 + mass2);
    return { v1x, v1y, v2x, v2y };
}

// Add particle effect function
function createParticles(x, y, color) {
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '8px';
        particle.style.height = '8px';
        particle.style.borderRadius = '50%';
        particle.style.backgroundColor = color;
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1000';
        document.body.appendChild(particle);
        
        // Animate particle
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        let opacity = 1;
        const animate = () => {
            opacity -= 0.02;
            if (opacity <= 0) {
                particle.remove();
                return;
            }
            
            const currentX = parseFloat(particle.style.left);
            const currentY = parseFloat(particle.style.top);
            
            particle.style.left = (currentX + vx) + 'px';
            particle.style.top = (currentY + vy) + 'px';
            particle.style.opacity = opacity;
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
}

function animate() {
    // Store previous positions for collision detection
    const prevX = x;
    const prevY = y;
    const prevSecondX = secondX;
    const prevSecondY = secondY;
    const prevThirdX = thirdX;
    const prevThirdY = thirdY;
    const prevFourthX = fourthX;
    const prevFourthY = fourthY;
    
    // First cube animation
    if (x + 200 > window.innerWidth || x < 0) dx = -dx;
    if (y + 200 > window.innerHeight || y < 0) dy = -dy;
    
    x += dx;
    y += dy;
    
    rotationX += dRx;
    rotationY += dRy;
    
    firstCube.style.left = x + 'px';
    firstCube.style.top = y + 'px';
    firstCube.style.transform = 'rotateX(' + rotationX + 'deg) rotateY(' + rotationY + 'deg)';
    
    // Second cube animation (with different starting position and speed)
    if (secondX + 200 > window.innerWidth || secondX < 0) secondDx = -secondDx;
    if (secondY + 200 > window.innerHeight || secondY < 0) secondDy = -secondDy;
    
    secondX += secondDx;
    secondY += secondDy;
    
    secondRotationX += secondDRx;
    secondRotationY += secondDRy;
    
    secondCube.style.left = secondX + 'px';
    secondCube.style.top = secondY + 'px';
    secondCube.style.transform = 'rotateX(' + secondRotationX + 'deg) rotateY(' + secondRotationY + 'deg)';
    
    // Third cube animation
    if (thirdX + 200 > window.innerWidth || thirdX < 0) thirdDx = -thirdDx;
    if (thirdY + 200 > window.innerHeight || thirdY < 0) thirdDy = -thirdDy;
    
    thirdX += thirdDx;
    thirdY += thirdDy;
    
    thirdRotationX += thirdDRx;
    thirdRotationY += thirdDRy;
    
    thirdCube.style.left = thirdX + 'px';
    thirdCube.style.top = thirdY + 'px';
    thirdCube.style.transform = 'rotateX(' + thirdRotationX + 'deg) rotateY(' + thirdRotationY + 'deg)';
    
    // Fourth cube animation
    if (fourthX + 200 > window.innerWidth || fourthX < 0) fourthDx = -fourthDx;
    if (fourthY + 200 > window.innerHeight || fourthY < 0) fourthDy = -fourthDy;
    
    fourthX += fourthDx;
    fourthY += fourthDy;
    
    fourthRotationX += fourthDRx;
    fourthRotationY += fourthDRy;
    
    fourthCube.style.left = fourthX + 'px';
    fourthCube.style.top = fourthY + 'px';
    fourthCube.style.transform = 'rotateX(' + fourthRotationX + 'deg) rotateY(' + fourthRotationY + 'deg)';
    
    // Collision detection - only check unique pairs once
    const cubes = [
        { x: x, y: y, dx: dx, dy: dy, prevX: prevX, prevY: prevY, id: 0 },
        { x: secondX, y: secondY, dx: secondDx, dy: secondDy, prevX: prevSecondX, prevY: prevSecondY, id: 1 },
        { x: thirdX, y: thirdY, dx: thirdDx, dy: thirdDy, prevX: prevThirdX, prevY: prevThirdY, id: 2 },
        { x: fourthX, y: fourthY, dx: fourthDx, dy: fourthDy, prevX: prevFourthX, prevY: prevFourthY, id: 3 }
    ];
    
    // Check all unique pairs of cubes
    for (let i = 0; i < cubes.length; i++) {
        for (let j = i + 1; j < cubes.length; j++) {
            const cube1 = cubes[i];
            const cube2 = cubes[j];
            
            const distance = Math.sqrt((cube1.x - cube2.x) ** 2 + (cube1.y - cube2.y) ** 2);
            if (distance < 200) {
                // Create collision particles
                createParticles(cube1.x, cube1.y, '#ff00ff');
                
                // Calculate relative velocity using previous positions to get correct direction
                const vx = (cube1.x - cube1.prevX) - (cube2.x - cube2.prevX);
                const vy = (cube1.y - cube1.prevY) - (cube2.y - cube2.prevY);

                // Elastic collision response
                const mass1 = 1;
                const mass2 = 1;

                const u1x = cube1.dx;
                const u1y = cube1.dy;
                const u2x = cube2.dx;
                const u2y = cube2.dy;

                const { v1x, v1y, v2x, v2y } = calculateCollision(mass1, mass2, u1x, u1y, u2x, u2y);

                // Apply new velocities immediately
                if (cube1.id === 0) { dx = v1x; dy = v1y; }
                else if (cube1.id === 1) { secondDx = v1x; secondDy = v1y; }
                else if (cube1.id === 2) { thirdDx = v1x; thirdDy = v1y; }
                else { fourthDx = v1x; fourthDy = v1y; }
                
                if (cube2.id === 0) { dx = v2x; dy = v2y; }
                else if (cube2.id === 1) { secondDx = v2x; secondDy = v2y; }
                else if (cube2.id === 2) { thirdDx = v2x; thirdDy = v2y; }
                else { fourthDx = v2x; fourthDy = v2y; }

                // Add a minimum distance threshold to prevent continuous collisions
                if (distance < 150) {
                    // Move cubes apart to prevent overlap - this should be done BEFORE applying new positions
                    const angle = Math.atan2(cube1.y - cube2.y, cube1.x - cube2.x);
                    const moveX = Math.cos(angle) * 35; // Increased separation distance
                    const moveY = Math.sin(angle) * 35;

                    // Apply separation immediately to prevent sticking
                    if (cube1.id === 0) { x += moveX; y += moveY; }
                    else if (cube1.id === 1) { secondX += moveX; secondY += moveY; }
                    else if (cube1.id === 2) { thirdX += moveX; thirdY += moveY; }
                    else { fourthX += moveX; fourthY += moveY; }
                    
                    if (cube2.id === 0) { x -= moveX; y -= moveY; }
                    else if (cube2.id === 1) { secondX -= moveX; secondY -= moveY; }
                    else if (cube2.id === 2) { thirdX -= moveX; thirdY -= moveY; }
                    else { fourthX -= moveX; fourthY -= moveY; }
                }
            }
        }
    }
    
    requestAnimationFrame(animate);
}

document.addEventListener('DOMContentLoaded', function() {
  const cubes = document.querySelectorAll('.cube');

  firstCube.addEventListener('click', function() {
      // Change direction on click
      dx = -dx;
      dy = -dy;
      
      // Change image randomly
      const images = ['obama.png', 'trump.jpg', 'biden.jpg', 'rigby.jpg'];
      const randomImage = images[Math.floor(Math.random() * images.length)];
      this.querySelectorAll('.face img').forEach(img => {
          img.src = randomImage;
      });
      
      // Add glow effect
      this.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.8)';
      setTimeout(() => {
          this.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
      }, 500);
  });

  secondCube.addEventListener('click', function() {
      // Change direction on click
      secondDx = -secondDx;
      secondDy = -secondDy;
      
      // Change image randomly
      const images = ['obama.png', 'trump.jpg', 'biden.jpg', 'rigby.jpg'];
      const randomImage = images[Math.floor(Math.random() * images.length)];
      this.querySelectorAll('.face img').forEach(img => {
          img.src = randomImage;
      });
      
      // Add glow effect
      this.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.8)';
      setTimeout(() => {
          this.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
      }, 500);
  });

  thirdCube.addEventListener('click', function() {
      // Change direction on click
      thirdDx = -thirdDx;
      thirdDy = -thirdDy;
      
      // Change image randomly
      const images = ['obama.png', 'trump.jpg', 'biden.jpg', 'rigby.jpg'];
      const randomImage = images[Math.floor(Math.random() * images.length)];
      this.querySelectorAll('.face img').forEach(img => {
          img.src = randomImage;
      });
      
      // Add glow effect
      this.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.8)';
      setTimeout(() => {
          this.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
      }, 500);
  });
  
  fourthCube.addEventListener('click', function() {
      // Change direction on click
      fourthDx = -fourthDx;
      fourthDy = -fourthDy;
      
      // Change image randomly
      const images = ['obama.png', 'trump.jpg', 'biden.jpg', 'rigby.jpg'];
      const randomImage = images[Math.floor(Math.random() * images.length)];
      this.querySelectorAll('.face img').forEach(img => {
          img.src = randomImage;
      });
      
      // Add glow effect
      this.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.8)';
      setTimeout(() => {
          this.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
      }, 500);
  });
});

animate();