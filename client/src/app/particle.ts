
const gravity = 0.25;

export function emitParticle(
  amount: number,
  startBounds: DOMRect,
  container: HTMLElement,
) {

  // Size based on the magnitude of the amount
  const mag = Math.floor(Math.log10(amount)) + 1;

  // Start from the center of the bounding element
  const startX = startBounds.left + startBounds.width / 2;
  const startY = startBounds.top + startBounds.height / 2;

  // Create the element
  const particle = document.createElement('img');
  particle.src = 'assets/feuer-fire.gif';
  container.appendChild(particle);

  const size = mag * 32;
  particle.style.position = 'absolute';
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.left = `${startX - size / 2}px`;
  particle.style.top = `${startY - size / 2}px`;

  let speedY = -(Math.random() * 12);
  const speedX = Math.random() * 10 - 5;

  function update() {
    speedY += gravity;

    // Move it
    particle.style.top = `${particle.offsetTop + speedY}px`;
    particle.style.left = `${particle.offsetLeft + speedX}px`;

    // Is it still on the screen?
    if (particle.offsetTop < container.offsetHeight) {
      requestAnimationFrame(update);
    } else {
      particle.remove(); // Remove if it fell off
    }
  }

  requestAnimationFrame(update); // Animate
}
