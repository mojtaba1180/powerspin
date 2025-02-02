function flipCoin() {
  const coin = document.getElementById("coin");

  // Determine outcome randomly: outcome 0 = red (front), outcome 1 = green (back)
  const outcome = Math.random() < 0.5 ? 0 : 1;

  // Reset coin rotation (so repeated flips start from the same point)
  coin.style.transition = "none";
  coin.style.transform = "rotateY(0deg)";

  // Force a reflow to make sure the reset is applied
  void coin.offsetWidth;

  // Set number of spins for visual effect (e.g., 3 full spins)
  const spins = 3;
  let finalRotation;

  if (outcome === 0) {
    // For red side: total rotation should be an integer multiple of 360° (e.g., 3 * 360)
    finalRotation = spins * 360;
  } else {
    // For green side: add 180° so that the back face is shown (e.g., 3 * 360 + 180)
    finalRotation = spins * 360 + 180;
  }

  // Now animate the coin flip using CSS transition
  coin.style.transition = "transform 2s ease-out";
  coin.style.transform = "rotateY(" + finalRotation + "deg)";
}
