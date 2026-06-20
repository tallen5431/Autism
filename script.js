const firstCube = document.querySelector('.first-cube');
const secondCube = document.querySelector('.second-cube');

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

function animate() {
    // Store previous positions for collision detection
    const prevX = x;
    const prevY = y;
    const prevSecondX = secondX;
    const prevSecondY = secondY;
    
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
    
    // Collision detection - use previous positions for accurate detection
    const distance = Math.sqrt((x - secondX) ** 2 + (y - secondY) ** 2);
    if (distance < 200) {
        // Calculate relative velocity using previous positions to get correct direction
        const vx = (x - prevX) - (secondX - prevSecondX);
        const vy = (y - prevY) - (secondY - prevSecondY);

        // Elastic collision response
        const mass1 = 1;
        const mass2 = 1;

        const u1x = dx;
        const u1y = dy;
        const u2x = secondDx;
        const u2y = secondDy;

        const v1x = ((mass1 - mass2) * u1x + 2 * mass2 * u2x) / (mass1 + mass2);
        const v1y = ((mass1 - mass2) * u1y + 2 * mass2 * u2y) / (mass1 + mass2);
        const v2x = ((mass2 - mass1) * u2x + 2 * mass1 * u1x) / (mass1 + mass2);
        const v2y = ((mass2 - mass1) * u2y + 2 * mass1 * u1y) / (mass1 + mass2);

        // Apply new velocities immediately
        dx = v1x;
        dy = v1y;
        secondDx = v2x;
        secondDy = v2y;

        // Add a minimum distance threshold to prevent continuous collisions
        if (distance < 50) {
            // Move cubes apart to prevent overlap - this should be done BEFORE applying new positions
            const angle = Math.atan2(y - secondY, x - secondX);
            const moveX = Math.cos(angle) * 10; // Increased separation distance
            const moveY = Math.sin(angle) * 10;
            
            // Apply separation immediately to prevent sticking
            x += moveX;
            y += moveY;
            secondX -= moveX;
            secondY -= moveY;
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
  });

  secondCube.addEventListener('click', function() {
      // Change direction on click
      secondDx = -secondDx;
      secondDy = -secondDy;
  });
});

animate();