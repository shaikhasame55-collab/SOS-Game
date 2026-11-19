const ROWS = 8;
const COLS = 8;

let lastMove = null;
let board = [];
let currentPlayer = 1;
let selectedLetter = "S";
let scores = [0, 0];
let gameOver = false;
let sosLines = [];
let gameMode = "two";
let difficulty = "easy";
let computerThinking = false;

// PAGE ELEMENTS
const welcomePage = document.getElementById("welcomePage");
const homePage = document.getElementById("homePage");
const gamePage = document.getElementById("gamePage");
const boardElement = document.getElementById("board");
const message = document.getElementById("message");

// SOUND SETTINGS
let musicOn = true;
let effectsOn = true;
let audioContext = null;
let musicTimer = null;
let musicNoteIndex = 0;

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

// GAME SOUND
function playSound(type) {
  if (!effectsOn) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (type === "win") {
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      gain.connect(ctx.destination);

      const start = ctx.currentTime + index * 0.18;
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.65);

      oscillator.start(start);
      oscillator.stop(start + 0.65);
    });
    return;
  }

  const sounds = {
    click: [500, 0.08],
    sos: [850, 0.25]
  };

  const sound = sounds[type];
  if (!sound) return;

  const [frequency, duration] = sound;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(ctx.destination);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

// BACKGROUND MUSIC
function playMusicNote() {
  if (!musicOn) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    261.63, 329.63, 392, 329.63,
    293.66, 349.23, 440, 349.23,
    261.63, 329.63, 392, 329.63
  ];

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = notes[musicNoteIndex % notes.length];
  musicNoteIndex++;

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  gain.gain.setValueAtTime(0.099, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);

  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.85);
}

function startMusic() {
  if (!musicOn || musicTimer !== null) return;

  getAudioContext();
  musicNoteIndex = 0;
  playMusicNote();

  musicTimer = setInterval(() => {
    if (musicOn) playMusicNote();
  }, 900);
}

function stopMusic() {
  if (musicTimer !== null) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

// ALL BUTTON CLICK SOUND
document.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;

  playSound("click");
  if (musicOn) startMusic();
});

// PAGE 1 TO PAGE 2
document.getElementById("startGame").onclick = () => {
  welcomePage.style.display = "none";
  homePage.style.display = "block";
  if (musicOn) startMusic();
};

// MUSIC BUTTON
document.getElementById("musicToggle").onclick = () => {
  musicOn = !musicOn;

  if (musicOn) {
    startMusic();
    document.getElementById("musicToggle").textContent = "🎵 Music ON";
  } else {
    stopMusic();
    document.getElementById("musicToggle").textContent = "🔇 Music OFF";
  }
};

// GAME SOUND BUTTON
document.getElementById("effectToggle").onclick = () => {
  effectsOn = !effectsOn;
  document.getElementById("effectToggle").textContent =
    effectsOn ? "🔊 Game Sound ON" : "🔇 Game Sound OFF";
};

// TWO PLAYER MODE
document.getElementById("twoMode").onclick = event => {
  event.preventDefault();

  gameMode = "two";
  computerThinking = false;
  document.getElementById("difficultyArea").style.display = "none";
  homePage.style.display = "none";
  gamePage.style.display = "block";
  newGame();
};

// COMPUTER MODE
document.getElementById("computerMode").onclick = event => {
  event.preventDefault();

  gameMode = "computer";
  computerThinking = false;
  document.getElementById("difficultyArea").style.display = "block";
  message.textContent = "Choose your computer difficulty!";
};

// DIFFICULTY SELECTION
document.querySelectorAll(".level-btn").forEach(button => {
  button.onclick = event => {
    event.preventDefault();

    gameMode = "computer";
    computerThinking = false;
    difficulty = button.dataset.level;

    document.querySelectorAll(".level-btn").forEach(btn => {
      btn.classList.remove("selected");
    });

    button.classList.add("selected");

    homePage.style.display = "none";
    gamePage.style.display = "block";
    newGame();
  };
});

// BACK BUTTON
document.getElementById("backButton").onclick = () => {
  gamePage.style.display = "none";
  homePage.style.display = "block";
  computerThinking = false;
};

// NEW GAME
function newGame() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(""));
  currentPlayer = 1;
  selectedLetter = "S";
  scores = [0, 0];
  gameOver = false;
  computerThinking = false;
  sosLines = [];
  lastMove = null;

  document.getElementById("moveCount").textContent = "0";
  document.getElementById("gameResult").style.display = "none";
  message.textContent = "Choose S or O and tap any empty box!";

  updateUI();
  renderBoard();
  updateProgress();
}

// SCORE POPUP
function showScorePopup(points) {
  const popup = document.createElement("div");
  popup.className = "score-popup";
  popup.textContent = `+${points} POINTS! 🎉`;
  document.querySelector(".game-container").appendChild(popup);

  setTimeout(() => popup.remove(), 1200);
}

// UPDATE SCORE AND TURN
function updateUI() {
  document.getElementById("score1").textContent = scores[0];
  document.getElementById("score2").textContent = scores[1];

  document.getElementById("turn").textContent =
    gameOver
      ? "Game Over"
      : gameMode === "computer" && currentPlayer === 2
        ? "🤖 Computer's Turn"
        : `Player ${currentPlayer}'s Turn`;

  const player1Card = document.getElementById("player1Card");
  const player2Card = document.getElementById("player2Card");

  player1Card.classList.toggle("active", !gameOver && currentPlayer === 1);
  player2Card.classList.toggle("active", !gameOver && currentPlayer === 2);

  document.getElementById("player2Name").textContent =
    gameMode === "computer" ? "Computer" : "Player 2";

  document.getElementById("player1Status").textContent =
    gameOver ? "Finished" : currentPlayer === 1 ? "Your Turn" : "Waiting";

  document.getElementById("player2Status").textContent =
    gameOver ? "Finished" : currentPlayer === 2 ? "Playing" : "Waiting";

  document.getElementById("chooseS").classList.toggle(
    "selected",
    selectedLetter === "S"
  );

  document.getElementById("chooseO").classList.toggle(
    "selected",
    selectedLetter === "O"
  );
}

// LETTER BUTTONS
document.getElementById("chooseS").onclick = () => {
  if (computerThinking || gameOver ||
      (gameMode === "computer" && currentPlayer === 2)) return;

  selectedLetter = "S";
  updateUI();
};

document.getElementById("chooseO").onclick = () => {
  if (computerThinking || gameOver ||
      (gameMode === "computer" && currentPlayer === 2)) return;

  selectedLetter = "O";
  updateUI();
};

// PROGRESS BAR
function updateProgress() {
  const filledCells = board.flat().filter(cell => cell !== "").length;
  const percentage = Math.round((filledCells / (ROWS * COLS)) * 100);

  document.getElementById("progressBar").style.width = percentage + "%";
  document.getElementById("progressText").textContent =
    percentage + "% Completed";
}

// DISPLAY BOARD
function renderBoard() {
  boardElement.style.position = "relative";
  boardElement.innerHTML = "";

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("button");
      cell.className = "cell";

      if (board[r][c]) {
        cell.textContent = board[r][c];

        if (board[r][c] === "S") {
          cell.classList.add("s-cell");
        } else if (board[r][c] === "O") {
          cell.classList.add("o-cell");
        }

        cell.classList.add(board[r][c].toLowerCase());

        if (lastMove && lastMove.row === r && lastMove.col === c) {
          cell.classList.add("new-letter");
        }
      }

      cell.onclick = () => {
        if (computerThinking ||
            (gameMode === "computer" && currentPlayer === 2)) return;

        placeLetter(r, c);
      };

      boardElement.appendChild(cell);
    }
  }

  drawSOSLines();
}

// FIND SOS
function findNewSOS(row, col) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  const found = [];

  for (const [dr, dc] of directions) {
    for (let start = -2; start <= 0; start++) {
      const r1 = row + start * dr;
      const c1 = col + start * dc;
      const r2 = r1 + dr;
      const c2 = c1 + dc;
      const r3 = r1 + 2 * dr;
      const c3 = c1 + 2 * dc;

      if (
        r1 < 0 || r1 >= ROWS ||
        c1 < 0 || c1 >= COLS ||
        r3 < 0 || r3 >= ROWS ||
        c3 < 0 || c3 >= COLS
      ) continue;

      if (
        board[r1][c1] === "S" &&
        board[r2][c2] === "O" &&
        board[r3][c3] === "S"
      ) {
        found.push({ r1, c1, r2, c2, r3, c3 });
      }
    }
  }

  return found;
}

// COUNT SOS CREATED BY A TEST MOVE
function getSOSCount(row, col, letter) {
  if (board[row][col] !== "") return 0;

  board[row][col] = letter;
  const count = findNewSOS(row, col).length;
  board[row][col] = "";

  return count;
}

// COUNT ALL IMMEDIATE SOS MOVES AVAILABLE
function countImmediateSOSMoves() {
  let total = 0;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== "") continue;

      const sCount = getSOSCount(r, c, "S");
      const oCount = getSOSCount(r, c, "O");

      if (sCount > 0 || oCount > 0) total++;
    }
  }

  return total;
}

// COMPUTER AI
function computerMove() {
  if (gameOver || gameMode !== "computer" || currentPlayer !== 2) {
    computerThinking = false;
    return;
  }

  const moves = [];

  // Computer checks every empty cell with both S and O.
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== "") continue;

      for (const letter of ["S", "O"]) {
        const ownSOS = getSOSCount(r, c, letter);

        board[r][c] = letter;
        const opponentThreats = countImmediateSOSMoves();
        board[r][c] = "";

        const centerBonus =
          8 - (Math.abs(r - (ROWS - 1) / 2) +
               Math.abs(c - (COLS - 1) / 2));

        moves.push({
          r,
          c,
          letter,
          ownSOS,
          opponentThreats,
          centerBonus
        });
      }
    }
  }

  if (moves.length === 0) {
    computerThinking = false;
    return;
  }

  let chosen;

  // Always take an available SOS.
  const bestSOS = Math.max(...moves.map(move => move.ownSOS));

  if (bestSOS > 0) {
    const scoringMoves = moves.filter(move => move.ownSOS === bestSOS);

    chosen = scoringMoves[
      Math.floor(Math.random() * scoringMoves.length)
    ];

  } else if (difficulty === "easy") {

    // Easy: random S/O and random empty cell.
    chosen = moves[Math.floor(Math.random() * moves.length)];

  } else {

    // Medium and Hard: avoid giving the player an easy SOS.
    const fewestThreats = Math.min(
      ...moves.map(move => move.opponentThreats)
    );

    let saferMoves = moves.filter(
      move => move.opponentThreats === fewestThreats
    );

    if (difficulty === "medium") {

      const randomPool = saferMoves.length > 1
        ? saferMoves
        : moves.filter(
            move => move.opponentThreats <= fewestThreats + 1
          );

      chosen = randomPool[
        Math.floor(Math.random() * randomPool.length)
      ];

    } else {

      // Hard: prefer safer moves near the center.
      const bestCenter = Math.max(
        ...saferMoves.map(move => move.centerBonus)
      );

      saferMoves = saferMoves.filter(
        move => move.centerBonus === bestCenter
      );

      chosen = saferMoves[
        Math.floor(Math.random() * saferMoves.length)
      ];
    }
  }

  computerThinking = false;

  // Computer uses its own letter. Player's selectedLetter stays unchanged.
  placeLetter(chosen.r, chosen.c, chosen.letter);
}

// PLACE LETTER
function placeLetter(row, col, letter = selectedLetter) {
  if (gameOver || board[row][col] !== "") return;

  board[row][col] = letter;
  lastMove = { row, col };

  updateProgress();

  const moveCount = document.getElementById("moveCount");
  moveCount.textContent = Number(moveCount.textContent) + 1;

  const newLines = findNewSOS(row, col);

  if (newLines.length > 0) {
    playSound("sos");

    newLines.forEach(line => {
      sosLines.push({
        ...line,
        player: currentPlayer
      });
    });

    scores[currentPlayer - 1] += newLines.length * 10;
    showScorePopup(newLines.length * 10);

    message.textContent =
      `${gameMode === "computer" && currentPlayer === 2
        ? "🤖 Computer"
        : `Player ${currentPlayer}`} made ${newLines.length} SOS! +${newLines.length * 10} points! Extra turn!`;

  } else {

    currentPlayer = currentPlayer === 1 ? 2 : 1;

    message.textContent =
      gameMode === "computer" && currentPlayer === 2
        ? "🤖 Computer's Turn"
        : `Player ${currentPlayer}'s Turn`;
  }

  renderBoard();
  updateUI();
  gamePage.style.position = "relative";

  // GAME OVER
  if (board.every(row => row.every(cell => cell !== ""))) {
    gameOver = true;
    computerThinking = false;

    playSound("win");

    const result = document.getElementById("gameResult");
    const winner = document.getElementById("winnerText");
    const finalScores = document.getElementById("finalScores");

    if (scores[0] > scores[1]) {
      winner.textContent = "🏆 Player 1 Wins!";
    } else if (scores[1] > scores[0]) {
      winner.textContent =
        gameMode === "computer"
          ? "🤖 Computer Wins!"
          : "🏆 Player 2 Wins!";
    } else {
      winner.textContent = "🤝 It's a Draw!";
    }

    finalScores.textContent =
      gameMode === "computer"
        ? `You: ${scores[0]} points | Computer: ${scores[1]} points`
        : `Player 1: ${scores[0]} points | Player 2: ${scores[1]} points`;

    const boardRect = boardElement.getBoundingClientRect();

    result.style.position = "fixed";
    result.style.left =
      (boardRect.left + boardRect.width / 2) + "px";

    result.style.top =
      (boardRect.top + boardRect.height / 2) + "px";

    result.style.transform = "translate(-50%, -50%)";
    result.style.zIndex = "1000";
    result.style.display = "block";

    message.textContent = "Game Over!";
    updateUI();
    return;
  }

  // COMPUTER TURN
  if (
    !gameOver &&
    gameMode === "computer" &&
    currentPlayer === 2 &&
    !computerThinking
  ) {
    computerThinking = true;
    setTimeout(computerMove, 500);
  }
}

// DRAW SOS LINES
function drawSOSLines() {
  const boardRect = boardElement.getBoundingClientRect();
  const cells = [...boardElement.children];

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");

  svg.classList.add("sos-lines");

  svg.setAttribute(
    "viewBox",
    `0 0 ${boardRect.width} ${boardRect.height}`
  );

  svg.setAttribute("preserveAspectRatio", "none");

  Object.assign(svg.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    overflow: "visible",
    pointerEvents: "none",
    zIndex: "10"
  });

  sosLines.forEach(line => {
    const first = cells[line.r1 * COLS + line.c1];
    const last = cells[line.r3 * COLS + line.c3];

    if (!first || !last) return;

    const a = first.getBoundingClientRect();
    const b = last.getBoundingClientRect();

    const x1 = a.left + a.width / 2 - boardRect.left;
    const y1 = a.top + a.height / 2 - boardRect.top;

    const x2 = b.left + b.width / 2 - boardRect.left;
    const y2 = b.top + b.height / 2 - boardRect.top;

    const path = document.createElementNS(svgNS, "line");

    path.setAttribute("x1", x1);
    path.setAttribute("y1", y1);
    path.setAttribute("x2", x2);
    path.setAttribute("y2", y2);

    path.setAttribute(
      "stroke",
      line.player === 1 ? "#35d7ff" : "#ff4545"
    );

    path.setAttribute("stroke-width", "6");
    path.setAttribute("stroke-linecap", "round");

    svg.appendChild(path);
  });

  boardElement.querySelector(".sos-lines")?.remove();
  boardElement.appendChild(svg);
}

// RESTART BUTTON
document.getElementById("restart").onclick = newGame;

// INITIALIZE
newGame();

window.addEventListener("resize", drawSOSLines);

// RULES POPUP
const rulesButton = document.getElementById("rulesButton");
const rulesPopup = document.getElementById("rulesPopup");
const closeRules = document.getElementById("closeRules");

rulesButton.onclick = () => {
  rulesPopup.style.display = "flex";
};

closeRules.onclick = () => {
  rulesPopup.style.display = "none";
};

rulesPopup.onclick = event => {
  if (event.target === rulesPopup) {
    rulesPopup.style.display = "none";
  }
};

// ABOUT GAME POPUP
const aboutButton = document.getElementById("aboutButton");
const aboutPopup = document.getElementById("aboutPopup");
const closeAbout = document.getElementById("closeAbout");

aboutButton.onclick = () => {
  aboutPopup.style.display = "flex";
};

closeAbout.onclick = () => {
  aboutPopup.style.display = "none";
};

aboutPopup.onclick = event => {
  if (event.target === aboutPopup) {
    aboutPopup.style.display = "none";
  }
};
