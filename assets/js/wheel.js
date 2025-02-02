// Global variables for the wheel instance, power, and spinning state
var theWheel;
var wheelPower = 0;
var wheelSpinning = false;

// Callback when the spin animation is finished.
function alertPrize(indicatedSegment) {
  console.log("You have won " + indicatedSegment.text);
  // You can also use alert() or any other method to notify the user.
}

// Initialize (or reinitialize) the wheel based on the canvas size.
function initWheel() {
  var canvas = document.getElementById("canvas");

  // Determine the viewport width.
  var viewportWidth = window.innerWidth;
  // Assume a desktop if viewport width is 768px or more.
  var isDesktop = viewportWidth >= 768;
  // Set a scale factor: 1.3 (30% larger) for desktop, otherwise 1.0.
  var scaleFactor = isDesktop ? 1.3 : 1.0;
  // Use a base maximum size of 500px (for mobile) and scale it up for desktop.
  var maxCanvasSize = 500 * scaleFactor;
  // Set the canvas size to 90% of the viewport width or the maxCanvasSize, whichever is smaller.
  var canvasSize = Math.min(viewportWidth * 0.9, maxCanvasSize);

  // Set the actual canvas dimensions (used for drawing).
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  // Calculate dynamic wheel dimensions relative to the canvas size.
  var outerRadius = canvasSize * 0.46; // Almost half the canvas size
  var innerRadius = canvasSize * 0.15; // Adjust for the hollow center
  var centerX = canvas.width / 2;
  var centerY = canvas.height / 2 + 20;

  // Optionally scale the font size based on the canvas size.
  var baseFontSize = Math.round(canvasSize * 0.05);

  // If a wheel already exists, stop its animation.
  if (theWheel) {
    theWheel.stopAnimation(false);
  }

  // Create a new Winwheel instance with the responsive parameters.
  theWheel = new Winwheel({
    canvasId: "canvas",
    outerRadius: outerRadius,
    innerRadius: innerRadius,
    centerX: centerX,
    centerY: centerY,
    textFontSize: baseFontSize,
    textOrientation: "vertical",
    textAlignment: "outer",
    numSegments: 23,
    segments: [
      { fillStyle: "#ee1c24", text: "300" },
      { fillStyle: "#3cb878", text: "450" },
      { fillStyle: "#f6989d", text: "600" },
      { fillStyle: "#00aef0", text: "750" },
      { fillStyle: "#f26522", text: "500" },
      {
        fillStyle: "#000000",
        text: "BANKRUPT",
        textFontSize: Math.round(canvasSize * 0.04),
        textFillStyle: "#ffffff",
      },
      { fillStyle: "#e70697", text: "3000" },
      { fillStyle: "#fff200", text: "600" },
      { fillStyle: "#f6989d", text: "700" },
      { fillStyle: "#ee1c24", text: "350" },
      { fillStyle: "#3cb878", text: "500" },
      { fillStyle: "#f26522", text: "800" },
      { fillStyle: "#a186be", text: "300" },
      { fillStyle: "#fff200", text: "400" },
      { fillStyle: "#00aef0", text: "650" },
      { fillStyle: "#ee1c24", text: "1000" },
      { fillStyle: "#f6989d", text: "500" },
      { fillStyle: "#f26522", text: "400" },
      { fillStyle: "#3cb878", text: "900" },
      {
        fillStyle: "#000000",
        text: "BANKRUPT",
        textFontSize: Math.round(canvasSize * 0.04),
        textFillStyle: "#ffffff",
      },
      { fillStyle: "#a186be", text: "600" },
      { fillStyle: "#fff200", text: "700" },
      { fillStyle: "#00aef0", text: "800" },
    ],
    animation: {
      type: "spinToStop",
      duration: 8,
      spins: 7,
      callbackFinished: alertPrize,
    },
  });
}

// Initialize the wheel on page load.
window.addEventListener("load", initWheel);

// Reinitialize the wheel when the window is resized (using debounce).
let resizeTimer;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(initWheel, 250);
});

// Power button click handler.
function powerSelected(powerLevel) {
  if (!wheelSpinning) {
    // Reset power button styles.
    wheelPower = powerLevel;
  }
}

// Spin button click handler.
function startSpin() {
  if (!wheelSpinning && wheelPower > 0) {
    // Adjust the number of spins based on the power level.
    if (wheelPower === 1) {
      theWheel.animation.spins = 3;
    } else if (wheelPower === 2) {
      theWheel.animation.spins = 6;
    } else if (wheelPower === 3) {
      theWheel.animation.spins = 9;
    }

    // Start the spin animation.
    theWheel.startAnimation();
    wheelSpinning = true;
  }
}

// Reset button click handler.
function resetWheel() {
  theWheel.stopAnimation(false); // Stop any ongoing animation.
  theWheel.rotationAngle = 0; // Reset rotation.
  theWheel.draw(); // Redraw the wheel.

  // Reset power selection.
  document.getElementById("pw1").classList.remove("active");
  document.getElementById("pw2").classList.remove("active");
  document.getElementById("pw3").classList.remove("active");

  wheelSpinning = false;
  wheelPower = 0;
}
