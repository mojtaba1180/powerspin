/**
 * Approaches to prevent the ball from flying off-screen:
 *
 * Approach #1: Place the ball directly above the target zone (no horizontal velocity).
 *   - If a target zone is selected, set the ball's x-position exactly to that zone's x.
 *   - This guarantees the ball drops straight down into the chosen zone.
 *
 * Approach #2: Clamp the horizontal velocity (used in the code below).
 *   - The ball always starts from the center at the top.
 *   - If a target zone is selected, apply a small horizontal velocity toward that zone.
 *   - Limit (clamp) the maximum horizontal speed so the ball does not shoot off-screen.
 *
 * Important note about multiple zones with the same multiplier:
 *   - gameState.targetZone represents the index of the zone, not the multiplier value.
 *   - For example, if the array of zones is:
 *       Index:  0   1   2   3   4   5   6   7   8   9
 *       Value: 1x  2x  5x  2x  5x  1x  1x 10x  1x  1x
 *     If you want the first 1x zone, set gameState.targetZone = 0.
 *     For the 10x zone, set gameState.targetZone = 7, etc.
 */

// -------------------------------------------------
// Plinko Game with Target Zone Selection (Approach #2)
// -------------------------------------------------

// -------------------------
// Game Settings & Constants
// -------------------------
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 450;

// Plinko multiplier configurations
const PLINKO_CONFIG = {
  low: {
    8: [
      { value: 1, color: "#6A15C5" },
      { value: 2, color: "#6A15C5" },
      { value: 5, color: "#6A15C5" },
      { value: 2, color: "#6A15C5" },
      { value: 5, color: "#6A15C5" },
      { value: 1, color: "#6A15C5" },
      { value: 1, color: "#6A15C5" },
      { value: 10, color: "#6A15C5" },
      { value: 1, color: "#6A15C5" },
      { value: 1, color: "#6A15C5" },
    ],
  },
};

// -------------------------
// Game State & DOM Elements
// -------------------------
const gameState = {
  mode: "manual",
  betAmount: 10,
  risk: "low",
  rows: 8,
  isRunning: false,
  balance: 1000,
  sound: true,
  targetZone: 6, // The index of the target multiplier zone
};

// for change target multiplier zone
//  const forceMagnitude = 0.00005 * dx; for setting this value

const balanceDisplay = document.getElementById("balanceDisplay");
const betInput = document.getElementById("betInput");
const riskSelect = document.getElementById("riskSelect");
const rowsSelect = document.getElementById("rowsSelect");
const sendBallButton = document.getElementById("sendBallButton");
const canvas = document.getElementById("gameCanvas");

// -------------------------
// Helper Functions
// -------------------------

// Update the displayed balance
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

// Create a mirrored multipliers array (disabled here, returns original)
function createMirroredMultipliers(multipliers) {
  return multipliers;
}

// Calculate ball radius based on the number of rows
function getBallRadius(rows) {
  const minRows = 8;
  const maxRows = 20;
  const minRadius = 4;
  const maxRadius = 10;
  const clamped = Math.min(Math.max(rows, minRows), maxRows);
  const t = (clamped - minRows) / (maxRows - minRows);
  return maxRadius - t * (maxRadius - minRadius);
}

// -------------------------
// Matter.js Setup
// -------------------------
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

// Global variable to store multiplier zones
window.multiplierZones = [];
let zoneTextAfterRenderHandler = null;

// -------------------------
// Build the Game Scene
// -------------------------
function buildScene() {
  Matter.World.clear(engine.world, false);

  const padding = 40;
  const boardWidth = CANVAS_WIDTH - padding * 2;
  const pegGap = boardWidth / (gameState.rows + 2);
  const multiplierHeight = 30;
  const totalRows = gameState.rows;
  const startY = 50;

  const boardHeight = (totalRows + 1) * pegGap + multiplierHeight;
  const wallThickness = 0;
  const wallHeight = Math.max(CANVAS_HEIGHT, boardHeight + 10);
  const wallY = wallHeight / 2;

  // Create walls
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

  // Create multiplier zones
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
          gradientHeight: 20,
        },
      },
    );
  });

  window.multiplierZones = zones;

  // Update the target zone selection element
  const targetZoneSelect = document.getElementById("targetZoneSelect");
  if (targetZoneSelect) {
    targetZoneSelect.innerHTML = '<option value="">-- Select Zone --</option>';
    zones.forEach((zone, index) => {
      const opt = document.createElement("option");
      opt.value = index;
      const multiplierVal = zone.label.split("-")[1];
      opt.textContent = multiplierVal + "x";
      targetZoneSelect.appendChild(opt);
    });
  }

  Matter.World.add(engine.world, [...walls, ...pegs, ...zones]);

  // Remove previous afterRender handler
  if (zoneTextAfterRenderHandler) {
    Matter.Events.off(render, "afterRender", zoneTextAfterRenderHandler);
  }

  // Define an afterRender handler to draw zone text and gradient
  zoneTextAfterRenderHandler = function () {
    const ctx = render.context;
    const { bounds, options } = render;
    const width = options.width || 0;
    const height = options.height || 0;

    ctx.save();
    const scaleX = width / (bounds.max.x - bounds.min.x);
    const scaleY = height / (bounds.max.y - bounds.min.y);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-bounds.min.x, -bounds.min.y);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "white";

    zones.forEach((zone) => {
      const val = parseFloat(zone.label.split("-")[1]);
      ctx.fillText(val + "x", zone.position.x, zone.position.y);

      const zWidth = zoneWidth;
      const zHeight = multiplierHeight;
      const zX = zone.position.x - zWidth / 2;
      const zY = zone.position.y - zHeight / 2;
      const gradH = zone.render.gradientHeight || 20;

      ctx.save();
      ctx.beginPath();
      ctx.rect(zX, zY, zWidth, zHeight);
      ctx.clip();

      let grad = ctx.createLinearGradient(
        0,
        zY + zHeight,
        0,
        zY + zHeight - gradH,
      );
      grad.addColorStop(0, "#6A15C5");
      grad.addColorStop(1, "rgba(106,21,197,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(zX, zY, zWidth, zHeight);
      ctx.restore();
    });

    ctx.restore();
  };
  Matter.Events.on(render, "afterRender", zoneTextAfterRenderHandler);

  // Adjust the viewport
  Matter.Render.lookAt(render, {
    min: { x: -wallThickness, y: 0 },
    max: { x: CANVAS_WIDTH + wallThickness, y: wallHeight },
  });
}

// -------------------------
// Drop Ball Functionality (Clamped horizontal velocity)
// -------------------------
function dropBall() {
  if (gameState.balance < gameState.betAmount) {
    alert("Insufficient balance!");
    return;
  }
  gameState.balance -= gameState.betAmount;
  updateBalanceDisplay();

  const radius = getBallRadius(gameState.rows);
  let startX = CANVAS_WIDTH / 2;
  const startY = 5;

  // Set initial velocity with no horizontal component (we'll steer continuously)
  let initialVelocity = { x: 0, y: 2 };

  const ball = Matter.Bodies.circle(startX, startY, radius, {
    restitution: 0.3,
    friction: 0.3,
    frictionAir: 0.02,
    density: 0.1,
    render: {
      fillStyle: "#410b7b",
      strokeStyle: "#7819dd",
      lineWidth: 2,
      gradientHeight: 20,
    },
  });
  Matter.Body.setVelocity(ball, initialVelocity);
  Matter.World.add(engine.world, ball);

  // Continuous guidance: apply a small force on each update to steer the ball
  if (
    gameState.targetZone !== null &&
    window.multiplierZones &&
    window.multiplierZones[gameState.targetZone]
  ) {
    const guidanceHandler = function () {
      // Get the x-coordinate of the target zone's center
      const targetX = window.multiplierZones[gameState.targetZone].position.x;
      const dx = targetX - ball.position.x;
      // Apply a force proportional to the horizontal distance (adjust factor as needed)
      const forceMagnitude = 0.00005 * dx;
      Matter.Body.applyForce(ball, ball.position, { x: forceMagnitude, y: 0 });

      // Optionally, disable guidance when the ball is near the target zone vertically
      if (
        ball.position.y >
        window.multiplierZones[gameState.targetZone].position.y - 20
      ) {
        Matter.Events.off(engine, "beforeUpdate", guidanceHandler);
      }
    };
    Matter.Events.on(engine, "beforeUpdate", guidanceHandler);
  }

  // Collision handler: when the ball collides with a multiplier zone, calculate winnings
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
          updateBalanceDisplay();
          Matter.World.remove(engine.world, ball);
        }, 10);
        Matter.Events.off(engine, "collisionStart", collisionHandler);
      }
    });
  };
  Matter.Events.on(engine, "collisionStart", collisionHandler);
}

// -------------------------
// Control Panel Event Listeners
// -------------------------
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

const targetZoneSelect = document.getElementById("targetZoneSelect");
if (targetZoneSelect) {
  targetZoneSelect.addEventListener("change", function (e) {
    const val = e.target.value;
    gameState.targetZone = val === "" ? null : parseInt(val, 10);
  });
}

if (sendBallButton) {
  sendBallButton.addEventListener("click", dropBall);
}

// -------------------------
// Initialize the Scene
// -------------------------
buildScene();
updateBalanceDisplay();
