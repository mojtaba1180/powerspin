/**
 * Game settings
 */
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 450;

// Initial configuration for Plinko multipliers
const PLINKO_CONFIG = {
  low: {
    8: [
      { value: 0.5, color: "#6A15C5" },
      { value: 1, color: "#6A15C5" },
      { value: 2, color: "#6A15C5" },
      { value: 3, color: "#6A15C5" },
      { value: 5, color: "#6A15C5" },
    ],
    16: [
      { value: 0.3, color: "#6A15C5" },
      { value: 0.5, color: "#6A15C5" },
      { value: 1, color: "#6A15C5" },
      { value: 2, color: "#6A15C5" },
      { value: 5, color: "#6A15C5" },
    ],
  },
  medium: {
    8: [
      { value: 1, color: "#6A15C5" },
      { value: 2, color: "#6A15C5" },
      { value: 5, color: "#6A15C5" },
      { value: 10, color: "#6A15C5" },
    ],
    16: [
      { value: 0.3, color: "#6A15C5" },
      { value: 0.7, color: "#6A15C5" },
      { value: 1, color: "#6A15C5" },
      { value: 2, color: "#6A15C5" },
      { value: 3, color: "#6A15C5" },
    ],
  },
  high: {
    8: [
      { value: 0.5, color: "#6A15C5" },
      { value: 1.5, color: "#6A15C5" },
      { value: 3, color: "#6A15C5" },
      { value: 10, color: "#6A15C5" },
    ],
    16: [
      { value: 0.3, color: "#6A15C5" },
      { value: 0.5, color: "#6A15C5" },
      { value: 1, color: "#6A15C5" },
      { value: 1.5, color: "#6A15C5" },
      { value: 3, color: "#6A15C5" },
    ],
  },
};

/**
 * Initial game state
 */
const gameState = {
  mode: "manual",
  betAmount: 10,
  risk: "low",
  rows: 8,
  isRunning: false,
  balance: 1000,
  sound: true,
};

// DOM elements for the control panel
const balanceDisplay = document.getElementById("balanceDisplay");
const betInput = document.getElementById("betInput");
const riskSelect = document.getElementById("riskSelect");
const rowsSelect = document.getElementById("rowsSelect");
const sendBallButton = document.getElementById("sendBallButton");
const canvas = document.getElementById("gameCanvas");

// Update the balance display
function updateBalanceDisplay() {
  if (balanceDisplay) {
    balanceDisplay.textContent = gameState.balance.toFixed(2);
  }
}

// Update the rows options based on the selected risk level
function updateRowsOptions() {
  if (!rowsSelect) return;
  rowsSelect.innerHTML = "";
  const riskConfig = PLINKO_CONFIG[gameState.risk];
  for (const key in riskConfig) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = key;
    if (parseInt(key, 10) === gameState.rows) {
      opt.selected = true;
    }
    rowsSelect.appendChild(opt);
  }
}

updateRowsOptions();
updateBalanceDisplay();

/**
 * Matter.js settings
 */
const engine = Matter.Engine.create({
  gravity: { x: 0, y: 1, scale: 0.001 },
});
const render = Matter.Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    wireframes: false,
    background: "#1314100",
  },
});
const runner = Matter.Runner.create();
Matter.Runner.run(runner, engine);
Matter.Render.run(render);

/**
 * Helper function: Create a mirrored multipliers array.
 * Example: [0.5, 1, 2] => [2, 1, 0.5, 1, 2]
 */
function createMirroredMultipliers(multipliers) {
  const mirrored = multipliers.slice();
  const reversed = multipliers.slice().reverse();
  reversed.pop(); // Remove duplicate center value
  return reversed.concat(mirrored);
}

/**
 * Helper function: Calculate the ball radius based on the number of rows.
 */
function getBallRadius(rows) {
  const minRows = 8;
  const maxRows = 20;
  const minRadius = 4;
  const maxRadius = 10;
  const clamped = Math.min(Math.max(rows, minRows), maxRows);
  const t = (clamped - minRows) / (maxRows - minRows);
  return maxRadius - t * (maxRadius - minRadius);
}

/**
 * buildScene function:
 * - Clears and builds the game scene including walls, pegs, and multiplier zones.
 *
 * The startY value has been adjusted so that the game board is positioned inside the canvas.
 */
// Global variable to store the reference to the afterRender event handler
let zoneTextAfterRenderHandler = null;

function buildScene() {
  // Clear previous objects from the world
  Matter.World.clear(engine.world, false);

  // Base dimensions and scene settings
  const padding = 40;
  const boardWidth = CANVAS_WIDTH - padding * 2;
  const pegGap = boardWidth / (gameState.rows + 2);
  // Reduced multiplierHeight to 30 to make the zones more rectangular
  const multiplierHeight = 30;
  const totalRows = gameState.rows;
  // Adjust startY so that the board fits within the canvas (items stick to the ground)
  const startY = 50; // Adjusted for better vertical positioning

  // Calculate board height based on rows and peg gap
  const boardHeight = (totalRows + 1) * pegGap + multiplierHeight;
  const wallThickness = 0;
  const wallHeight = Math.max(CANVAS_HEIGHT, boardHeight + 10);
  const wallY = wallHeight / 2;
  const walls = [
    Matter.Bodies.rectangle(
      -wallThickness / 2,
      wallY,
      wallThickness,
      wallHeight,
      { isStatic: true },
    ),
    Matter.Bodies.rectangle(
      CANVAS_WIDTH + wallThickness / 2,
      wallY,
      wallThickness,
      wallHeight,
      { isStatic: true },
    ),
    Matter.Bodies.rectangle(
      CANVAS_WIDTH / 2,
      wallHeight,
      CANVAS_WIDTH + wallThickness * 2,
      wallThickness,
      { isStatic: true },
    ),
  ];

  // Create pegs
  const pegs = [];
  for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
    const pegsInRow = rowIndex + 3;
    const rowWidth = (pegsInRow - 1) * pegGap;
    const startX = (CANVAS_WIDTH - rowWidth) / 2;
    for (let col = 0; col < pegsInRow; col++) {
      const px = startX + col * pegGap;
      const py = startY + rowIndex * pegGap;
      const peg = Matter.Bodies.circle(px, py, 4, {
        isStatic: true,
        render: { fillStyle: "#ffffff" },
        friction: 0.2,
        restitution: 0.1,
      });
      pegs.push(peg);
    }
  }

  // Get multiplier configuration and create multiplier zones
  const baseMultipliers = PLINKO_CONFIG[gameState.risk][gameState.rows] || [];
  const multipliers = createMirroredMultipliers(baseMultipliers);
  const zoneWidth = boardWidth / multipliers.length;
  const lastPegY = startY + (totalRows - 1) * pegGap;
  const zoneY = lastPegY + pegGap / 2 + multiplierHeight / 2;
  const zones = multipliers.map((mult, i) => {
    return Matter.Bodies.rectangle(
      padding + i * zoneWidth + zoneWidth / 2,
      zoneY,
      zoneWidth,
      multiplierHeight,
      {
        isStatic: true,
        isSensor: true,
        label: "multiplier-" + mult.value,
        render: {
          fillStyle: "#1e033a",
          strokeStyle: "#6A15C5",
          lineWidth: 2,
          // Custom property for inset shadow gradient height
          gradientHeight: 20,
        },
      },
    );
  });

  // Add all objects to the world
  Matter.World.add(engine.world, [...walls, ...pegs, ...zones]);

  // Remove the previous afterRender listener if it exists
  if (zoneTextAfterRenderHandler) {
    Matter.Events.off(render, "afterRender", zoneTextAfterRenderHandler);
  }

  // Define a new afterRender event handler to draw text and inset shadow on each zone
  zoneTextAfterRenderHandler = function () {
    const ctx = render.context;
    const { bounds, options } = render;
    const width = options.width || 0;
    const height = options.height || 0;
    ctx.save();
    // Coordinate transformation for camera adjustments
    const scaleX = width / (bounds.max.x - bounds.min.x);
    const scaleY = height / (bounds.max.y - bounds.min.y);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-bounds.min.x, -bounds.min.y);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "white";
    zones.forEach((zone) => {
      // Draw the multiplier text
      const val = parseFloat(zone.label.split("-")[1]);
      ctx.fillText(val + "x", zone.position.x, zone.position.y);

      // Draw the inset shadow along the bottom of the zone
      const zWidth = zoneWidth; // Use the known zoneWidth
      const zHeight = multiplierHeight;
      const zX = zone.position.x - zWidth / 2;
      const zY = zone.position.y - zHeight / 2;
      const gradH = zone.render.gradientHeight || 20;

      ctx.save();
      // Clip to the zone rectangle to confine the gradient
      ctx.beginPath();
      ctx.rect(zX, zY, zWidth, zHeight);
      ctx.clip();

      // Create a vertical gradient starting from the bottom edge upward
      let grad = ctx.createLinearGradient(
        0,
        zY + zHeight,
        0,
        zY + zHeight - gradH,
      );
      grad.addColorStop(0, "#6A15C5"); // Full stroke color at the bottom
      grad.addColorStop(1, "rgba(106,21,197,0)"); // Transparent at the top of the gradient

      ctx.fillStyle = grad;
      ctx.fillRect(zX, zY, zWidth, zHeight);
      ctx.restore();
    });
    ctx.restore();
  };

  // Add the new afterRender listener
  Matter.Events.on(render, "afterRender", zoneTextAfterRenderHandler);

  // Set the viewport (camera view)
  Matter.Render.lookAt(render, {
    min: { x: -wallThickness, y: 0 },
    max: { x: CANVAS_WIDTH + wallThickness, y: wallHeight },
  });
}

/**
 * dropBall function:
 * - Checks the balance and game state
 * - Deducts the bet amount and sets the game state to running
 * - Creates the ball and adds it to the world
 * - Adds a collision listener for when the ball hits a multiplier zone
 */
function dropBall() {
  if (gameState.isRunning) return;
  if (gameState.balance < gameState.betAmount) {
    alert("Insufficient balance!");
    return;
  }
  // Deduct bet amount and update balance display
  gameState.balance -= gameState.betAmount;
  updateBalanceDisplay();
  gameState.isRunning = true;

  const radius = getBallRadius(gameState.rows);
  const xRand = (Math.random() - 0.5) * 20;
  // Create the ball at a visible position within the canvas (y = 5)
  const ball = Matter.Bodies.circle(CANVAS_WIDTH / 2 + xRand, 5, radius, {
    restitution: 0.7,
    friction: 4,
    frictionAir: 0.02,
    density: 0.1,
    render: {
      fillStyle: "#410b7b",
      strokeStyle: "#7819dd",
      lineWidth: 2,
      // Custom property for inset shadow gradient height
      gradientHeight: 20,
    },
  });
  Matter.Body.setVelocity(ball, { x: 0, y: 2 });
  Matter.World.add(engine.world, ball);

  const collisionHandler = function (evt) {
    evt.pairs.forEach((pair) => {
      const bodies = [pair.bodyA, pair.bodyB];
      const zone = bodies.find(
        (b) => b.label && b.label.startsWith("multiplier-"),
      );
      if (zone && bodies.includes(ball)) {
        const multiplier = parseFloat(zone.label.split("-")[1]);
        const profit = gameState.betAmount * multiplier;
        setTimeout(() => {
          gameState.balance += profit;
          gameState.isRunning = false;
          updateBalanceDisplay();
          Matter.World.remove(engine.world, ball);
          // Callback can be called here if needed
        }, 10);
        Matter.Events.off(engine, "collisionStart", collisionHandler);
      }
    });
  };
  Matter.Events.on(engine, "collisionStart", collisionHandler);
}

/**
 * Control panel event listeners
 */
if (betInput) {
  betInput.addEventListener("change", function (e) {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) {
      gameState.betAmount = val;
    }
  });
}

if (riskSelect) {
  riskSelect.addEventListener("change", function (e) {
    gameState.risk = e.target.value;
    updateRowsOptions();
    buildScene();
  });
}

if (rowsSelect) {
  rowsSelect.addEventListener("change", function (e) {
    gameState.rows = parseInt(e.target.value, 10);
    buildScene();
  });
}

if (sendBallButton) {
  sendBallButton.addEventListener("click", dropBall);
}

// Build the initial scene
buildScene();
