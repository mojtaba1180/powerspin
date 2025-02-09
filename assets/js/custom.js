function flipCoin() {
  const coin = document.getElementById("coin");
  const coinflipBg = document.getElementById("coinflip-bg");
  const bgGreen = document.getElementById("bg-green");
  const bgRed = document.getElementById("bg-red");
  const defaultBg = document.getElementById("default-bg");

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

  // After the flip is completed (2s delay), update the background based on the result
  setTimeout(() => {
    // Initially, show the default background and hide the others
    defaultBg.style.display = "block";
    bgGreen.style.display = "none";
    bgRed.style.display = "none";

    // Reset the animation classes to allow the transition again
    coinflipBg.classList.remove("coinflip-bg-green", "coinflip-bg-red");

    if (outcome === 0) {
      // Show red background for the front side (Red = outcome 0)
      coinflipBg.classList.add("coinflip-bg-green");
      bgGreen.style.display = "block"; // Show green background
      defaultBg.style.display = "none"; // Hide default background
    } else {
      // Show green background for the back side (Green = outcome 1)
      coinflipBg.classList.add("coinflip-bg-red");
      bgRed.style.display = "block"; // Show red background
      defaultBg.style.display = "none"; // Hide default background
    }
  }, 2000); // The timeout matches the coin flip animation duration (2 seconds)
}
