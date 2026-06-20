const firstCube = document.querySelector('.first-cube');
const secondCube = document.querySelector('.second-cube');
const thirdCube = document.querySelector('.third-cube');
const fourthCube = document.querySelector('.fourth-cube');

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
let fourthX = 400, fourthY = 100; // Changed starting position to be further apart
let fourthDx = -2, fourthDy = 3;
let fourthRotationX = 0, fourthRotationY = 0;
let fourthDRx = 0.5, fourthDRy = 0.6;

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
    
    // Check collision between first and third cube
    const thirdDistance = Math.sqrt((x - thirdX) ** 2 + (y - thirdY) ** 2);
    if (thirdDistance < 200) {
        // Calculate relative velocity using previous positions to get correct direction
        const vx = (x - prevX) - (thirdX - prevThirdX);
        const vy = (y - prevY) - (thirdY - prevThirdY);

        // Elastic collision response
        const mass1 = 1;
        const mass2 = 1;

        const u1x = dx;
        const u1y = dy;
        const u2x = thirdDx;
        const u2y = thirdDy;

        const v1x = ((mass1 - mass2) * u1x + 2 * mass2 * u2x) / (mass1 + mass2);
        const v1y = ((mass1 - mass2) * u1y + 2 * mass2 * u2y) / (mass1 + mass2);
        const v2x = ((mass2 - mass1) * u2x + 2 * mass1 * u1x) / (mass1 + mass2);
        const v2y = ((mass2 - mass1) * u2y + 2 * mass1 * u1y) / (mass1 + mass2);

        // Apply new velocities immediately
        dx = v1x;
        dy = v1y;
        thirdDx = v2x;
        thirdDy = v2y;

        // Add a minimum distance threshold to prevent continuous collisions
        if (thirdDistance < 50) {
            // Move cubes apart to prevent overlap - this should be done BEFORE applying new positions
            const angle = Math.atan2(y - thirdY, x - thirdX);
            const moveX = Math.cos(angle) * 10; // Increased separation distance
            const moveY = Math.sin(angle) * 10;
            
            // Apply separation immediately to prevent sticking
            x += moveX;
            y += moveY;
            thirdX -= moveX;
            thirdY -= moveY;
        }
    }
    
    // Check collision between second and third cube
    const secondThirdDistance = Math.sqrt((secondX - thirdX) ** 2 + (secondY - thirdY) ** 2);
    if (secondThirdDistance < 200) {
        // Calculate relative velocity using previous positions to get correct direction
        const vx = (secondX - prevSecondX) - (thirdX - prevThirdX);
        const vy = (secondY - prevSecondY) - (thirdY - prevThirdY);

        // Elastic collision response
        const mass1 = 1;
        const mass2 = 1;

        const u1x = secondDx;
        const u1y = secondDy;
        const u2x = thirdDx;
        const u2y = thirdDy;

        const v1x = ((mass1 - mass2) * u1x + 2 * mass2 * u2x) / (mass1 + mass2);
        const v1y = ((mass1 - mass2) * u1y + 2 * mass2 * u2y) / (mass1 + mass2);
        const v2x = ((mass2 - mass1) * u2x + 2 * mass1 * u1x) / (mass1 + mass2);
        const v2y = ((mass2 - mass1) * u2y + 2 * mass1 * u1y) / (mass1 + mass2);

        // Apply new velocities immediately
        secondDx = v1x;
        secondDy = v1y;
        thirdDx = v2x;
        thirdDy = v2y;

        // Add a minimum distance threshold to prevent continuous collisions
        if (secondThirdDistance < 50) {
            // Move cubes apart to prevent overlap - this should be done BEFORE applying new positions
            const angle = Math.atan2(secondY - thirdY, secondX - thirdX);
            const moveX = Math.cos(angle) * 10; // Increased separation distance
            const moveY = Math.sin(angle) * 10;
            
            // Apply separation immediately to prevent sticking
            secondX += moveX;
            secondY += moveY;
            thirdX -= moveX;
            thirdY -= moveY;
        }
    }
    
    // Check collision between first and fourth cube
    const fourthDistance = Math.sqrt((x - fourthX) ** 2 + (y - fourthY) ** 2);
    if (fourthDistance < 200) {
        // Calculate relative velocity using previous positions to get correct direction
        const vx = (x - prevX) - (fourthX - prevFourthX);
        const vy = (y - prevY) - (fourthY - prevFourthY);

        // Elastic collision response
        const mass1 = 1;
        const mass2 = 1;

        const u1x = dx;
        const u1y = dy;
        const u2x = fourthDx;
        const u2y = fourthDy;

        const v1x = ((mass1 - mass2) * u1x + 2 * mass2 * u2x) / (mass1 + mass2);
        const v1y = ((mass1 - mass2) * u1y + 2 * mass2 * u2y) / (mass1 + mass2);
        const v2x = ((mass2 - mass1) * u2x + 2 * mass1 * u1x) / (mass1 + mass2);
        const v2y = ((mass2 - mass1) * u2y + 2 * mass1 * u1y) / (mass1 + mass2);

        // Apply new velocities immediately
        dx = v1x;
        dy = v1y;
        fourthDx = v2x;
        fourthDy = v2y;

        // Add a minimum distance threshold to prevent continuous collisions
        if (fourthDistance < 50) {
            // Move cubes apart to prevent overlap - this should be done BEFORE applying new positions
            const angle = Math.atan2(y - fourthY, x - fourthX);
            const moveX = Math.cos(angle) * 10; // Increased separation distance
            const moveY = Math.sin(angle) * 10;
            
            // Apply separation immediately to prevent sticking
            x += moveX;
            y += moveY;
            fourthX -= moveX;
            fourthY -= moveY;
        }
    }
    
    // Check collision between second and fourth cube
    const secondFourthDistance = Math.sqrt((secondX - fourthX) ** 2 + (secondY - fourthY) ** 2);
    if (secondFourthDistance < 200) {
        // Calculate relative velocity using previous positions to get correct direction
        const vx = (secondX - prevSecondX) - (fourthX - prevFourthX);
        const vy = (secondY - prevSecondY) - (fourthY - prevFourthY);

        // Elastic collision response
        const mass1 = 1;
        const mass2 = 1;

        const u1x = secondDx;
        const u1y = secondDy;
        const u2x = fourthDx;
        const u2y = fourthDy;

        const v1x = ((mass1 - mass2) * u1x + 2 * mass2 * u2x) / (mass1 + mass2);
        const v1y = ((mass1 - mass2) * u1y + 2 * mass2 * u2y) / (mass1 + mass2);
        const v2x = ((mass2 - mass1) * u2x + 2 * mass1 * u1x) / (mass1 + mass2);
        const v2y = ((mass2 - mass1) * u2y + 2 * mass1 * u1y) / (mass1 + mass2);

        // Apply new velocities immediately
        secondDx = v1x;
        secondDy = v1y;
        fourthDx = v2x;
        fourthDy = v2y;

        // Add a minimum distance threshold to prevent continuous collisions
        if (secondFourthDistance < 50) {
            // Move cubes apart to prevent overlap - this should be done BEFORE applying new positions
            const angle = Math.atan2(secondY - fourthY, secondX - fourthX);
            const moveX = Math.cos(angle) * 10; // Increased separation distance
            const moveY = Math.sin(angle) * 10;
            
            // Apply separation immediately to prevent sticking
            secondX += moveX;
            secondY += moveY;
            fourthX -= moveX;
            fourthY -= moveY;
        }
    }
    
    // Check collision between third and fourth cube
    const thirdFourthDistance = Math.sqrt((thirdX - fourthX) ** 2 + (thirdY - fourthY) ** 2);
    if (thirdFourthDistance < 200) {
        // Calculate relative velocity using previous positions to get correct direction
        const vx = (thirdX - prevThirdX) - (fourthX - prevFourthX);
        const vy = (thirdY - prevThirdY) - (fourthY - prevFourthY);

        // Elastic collision response
        const mass1 = 1;
        const mass2 = 1;

        const u1x = thirdDx;
        const u1y = thirdDy;
        const u2x = fourthDx;
        const u2y = fourthDy;

        const v1x = ((mass1 - mass2) * u1x + 2 * mass2 * u2x) / (mass1 + mass2);
        const v1y = ((mass1 - mass2) * u1y + 2 * mass2 * u2y) / (mass1 + mass2);
        const v2x = ((mass2 - mass1) * u2x + 2 * mass1 * u1x) / (mass1 + mass2);
        const v2y = ((mass2 - mass1) * u2y + 2 * mass1 * u1y) / (mass1 + mass2);

        // Apply new velocities immediately
        thirdDx = v1x;
        thirdDy = v1y;
        fourthDx = v2x;
        fourthDy = v2y;

        // Add a minimum distance threshold to prevent continuous collisions
        if (thirdFourthDistance < 50) {
            // Move cubes apart to prevent overlap - this should be done BEFORE applying new positions
            const angle = Math.atan2(thirdY - fourthY, thirdX - fourthX);
            const moveX = Math.cos(angle) * 10; // Increased separation distance
            const moveY = Math.sin(angle) * 10;
            
            // Apply separation immediately to prevent sticking
            thirdX += moveX;
            thirdY += moveY;
            fourthX -= moveX;
            fourthY -= moveY;
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

  thirdCube.addEventListener('click', function() {
      // Change direction on click
      thirdDx = -thirdDx;
      thirdDy = -thirdDy;
  });
  
  fourthCube.addEventListener('click', function() {
      // Change direction on click
      fourthDx = -fourthDx;
      fourthDy = -fourthDy;
  });
});

animate();