document.getElementById('yr').textContent = new Date().getFullYear();

const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
const gameOverlay = document.getElementById('game-overlay');
const gameStart = document.getElementById('game-start');
const gameMessage = document.getElementById('game-message');
const gameDescription = document.getElementById('game-description');
const gameScore = document.getElementById('game-score');
const gameBest = document.getElementById('game-best');
const gameLive = document.getElementById('game-live');
const gameWidth = canvas.width;
const gameHeight = canvas.height;
const bee = { x: 88, y: 205, velocity: 0, radius: 15 };
const shelfWidth = 58;
const shelfGap = 142;
const shelves = [];
const mascotImage = new Image();
let score = 0;
let bestScore = 0;
let playing = false;
let previousFrame = 0;
let frameId = 0;

mascotImage.addEventListener('load', () => {
  drawScene();
});
mascotImage.addEventListener('error', () => {
  console.error('Unable to load the beeyyo mascot image for the game.');
});
mascotImage.src = 'assets/beeyyo_mascot.png';

function drawScene() {
  const sky = context.createLinearGradient(0, 0, 0, gameHeight);
  sky.addColorStop(0, '#fffaf0');
  sky.addColorStop(1, '#ffe8a0');
  context.fillStyle = sky;
  context.fillRect(0, 0, gameWidth, gameHeight);

  context.fillStyle = 'rgba(255, 255, 255, 0.78)';
  [[48, 86, 24], [72, 82, 19], [252, 128, 22], [277, 124, 17]].forEach(([x, y, radius]) => {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  });

  context.fillStyle = 'rgba(255, 199, 46, 0.42)';
  context.beginPath();
  context.arc(305, 66, 24, 0, Math.PI * 2);
  context.fill();

  shelves.forEach((shelf) => {
    const topHeight = shelf.gapY - shelfGap / 2;
    const bottomY = shelf.gapY + shelfGap / 2;
    drawShelf(shelf.x, 0, shelfWidth, topHeight, true);
    drawShelf(shelf.x, bottomY, shelfWidth, gameHeight - bottomY, false);
  });

  context.fillStyle = '#f7bd00';
  context.fillRect(0, gameHeight - 22, gameWidth, 22);
  context.fillStyle = '#ffdb69';
  context.fillRect(0, gameHeight - 22, gameWidth, 5);
  drawBee();
}

function drawShelf(x, y, width, height, bottomCap) {
  context.fillStyle = '#ffc72e';
  context.fillRect(x, y, width, height);
  context.fillStyle = '#ffe396';
  context.fillRect(x + 7, y, 10, height);
  context.fillStyle = '#e2a600';
  context.fillRect(x, bottomCap ? height - 12 : y, width, 12);
  context.strokeStyle = 'rgba(109, 72, 0, 0.2)';
  context.lineWidth = 2;
  context.strokeRect(x + 1, y + 1, width - 2, Math.max(0, height - 2));
  context.fillStyle = 'rgba(255, 255, 255, 0.72)';
  context.beginPath();
  context.arc(x + 37, y + (bottomCap ? Math.max(24, height - 34) : 32), 7, 0, Math.PI * 2);
  context.fill();
}

function drawBee() {
  context.save();
  context.translate(bee.x, bee.y);
  context.rotate(Math.max(-0.45, Math.min(0.55, bee.velocity / 650)));

  if (mascotImage.complete && mascotImage.naturalWidth) {
    context.drawImage(mascotImage, -39, -26, 78, 52);
  }
  context.restore();
}

function addShelf() {
  const minimum = 100;
  const maximum = gameHeight - 100;
  shelves.push({
    x: gameWidth + 18,
    gapY: minimum + Math.random() * (maximum - minimum),
    passed: false
  });
}

function updateScore() {
  gameScore.textContent = score;
  gameBest.textContent = bestScore;
}

function endGame() {
  playing = false;
  cancelAnimationFrame(frameId);
  bestScore = Math.max(bestScore, score);
  updateScore();
  gameOverlay.hidden = false;
  gameMessage.textContent = score > 0 ? 'Nice flying!' : 'So close!';
  gameDescription.textContent = `You scored ${score}. Give it another buzz?`;
  gameStart.textContent = 'Play again';
  gameLive.textContent = `Game over. Your score is ${score}.`;
}

function isCollision(shelf) {
  const overlapsX = bee.x + bee.radius > shelf.x && bee.x - bee.radius < shelf.x + shelfWidth;
  const gapTop = shelf.gapY - shelfGap / 2;
  const gapBottom = shelf.gapY + shelfGap / 2;
  return overlapsX && (bee.y - bee.radius < gapTop || bee.y + bee.radius > gapBottom);
}

function gameLoop(timestamp) {
  if (!playing) return;
  const delta = Math.min((timestamp - (previousFrame || timestamp)) / 1000, 0.032);
  previousFrame = timestamp;

  bee.velocity += 920 * delta;
  bee.y += bee.velocity * delta;

  shelves.forEach((shelf) => {
    shelf.x -= 155 * delta;
    if (!shelf.passed && shelf.x + shelfWidth < bee.x) {
      shelf.passed = true;
      score += 1;
      updateScore();
      gameLive.textContent = `Score ${score}.`;
    }
  });
  while (shelves.length && shelves[0].x + shelfWidth < 0) shelves.shift();
  if (!shelves.length || shelves[shelves.length - 1].x < gameWidth - 205) addShelf();

  drawScene();
  if (bee.y - bee.radius < 0 || bee.y + bee.radius > gameHeight - 22 || shelves.some(isCollision)) {
    endGame();
    return;
  }
  frameId = requestAnimationFrame(gameLoop);
}

function flap() {
  if (playing) bee.velocity = -330;
}

function startGame() {
  cancelAnimationFrame(frameId);
  score = 0;
  bee.y = 205;
  bee.velocity = 0;
  shelves.length = 0;
  addShelf();
  updateScore();
  gameOverlay.hidden = true;
  playing = true;
  previousFrame = 0;
  canvas.focus({ preventScroll: true });
  gameLive.textContent = 'Game started. Tap or press Space to flap.';
  frameId = requestAnimationFrame(gameLoop);
}

gameStart.addEventListener('click', startGame);
canvas.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  flap();
});
canvas.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp') {
    event.preventDefault();
    flap();
  }
});
drawScene();
