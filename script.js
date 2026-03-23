// Water CAPTCHA Game
// This game asks players to select all clean water images from a 3x3 grid.

const TIME_LIMIT = 60;
const STARTING_SCORE = 100;

// Image paths from the local img folder.
const images = [
	{ src: "img/Clean Water Clean river.jpg", type: "clean", label: "Clean river" },
	{ src: "img/Clean Water Water droplet.jpg", type: "clean", label: "Water droplet" },
	{ src: "img/Clean Water Safe faucet.jpg", type: "clean", label: "Safe faucet" },
	{ src: "img/Clean Water Protected well.jpg", type: "clean", label: "Protected well" },
	{ src: "img/Unsafe Water Polluted stream.jpg", type: "dirty", label: "Polluted stream" },
	{ src: "img/Unsafe Water Trash in water.jpg", type: "dirty", label: "Trash in water" },
	{ src: "img/Unsafe Water Unsafe puddle.jpg", type: "dirty", label: "Unsafe puddle" },
	{ src: "img/water-can.png", type: "dirty", label: "Unsafe water can" },
	{ src: "img/Other Item Bicycle.jpg", type: "neutral", label: "Bicycle" },
	{ src: "img/Other Item Notebook.jpg", type: "neutral", label: "Notebook" },
	{ src: "img/Other Item Backpack.jpg", type: "neutral", label: "Backpack" },
	{ src: "img/Other Item Street sign.jpg", type: "neutral", label: "Street sign" }
];

const state = {
	score: STARTING_SCORE,
	elapsedSeconds: 0,
	timerIntervalId: null,
	gameActive: false,
	currentTiles: [],
	selectedTileIndexes: new Set()
};

const elements = {};

function initGame() {
	elements.grid = document.getElementById("grid");
	elements.startButton = document.getElementById("startButton");
	elements.verifyButton = document.getElementById("verifyButton");
	elements.reloadButton = document.getElementById("reloadButton");
	elements.timerDisplay = document.getElementById("timerDisplay");
	elements.scoreDisplay = document.getElementById("scoreDisplay");
	elements.centerMessage = document.getElementById("centerMessage");
	elements.statusHeadline = document.getElementById("statusHeadline");
	elements.statusMessage = document.getElementById("statusMessage");
	elements.awarenessCheck = document.getElementById("awarenessCheck");
	elements.robotCheck = document.getElementById("robotCheck");
	elements.awarenessStatusIcon = document.getElementById("awarenessStatusIcon");
	elements.robotStatusIcon = document.getElementById("robotStatusIcon");
	elements.jerryAlert = document.getElementById("jerryAlert");
	elements.jerryAlertText = document.getElementById("jerryAlertText");
	elements.jerryWater = document.getElementById("jerryWater");
	elements.challengePanel = document.querySelector(".panel-center");

	elements.startButton.addEventListener("click", startGame);
	elements.verifyButton.addEventListener("click", validateSelection);
	elements.reloadButton.addEventListener("click", generateGrid);
	elements.awarenessCheck.addEventListener("change", updateChecklistIcons);
	elements.robotCheck.addEventListener("change", updateChecklistIcons);
	elements.appContainer = document.querySelector(".app-container");

	updateChecklistIcons();
	updateTimer();
	updateScore(0);
	showJerryCanAlert("Check both boxes, then start the challenge.", "info", 24);
}

function startGame() {
	if (state.timerIntervalId) {
		clearInterval(state.timerIntervalId);
	}

	state.score = STARTING_SCORE;
	state.elapsedSeconds = 0;
	state.gameActive = true;
	state.selectedTileIndexes.clear();
	elements.appContainer.classList.add("active");
	elements.verifyButton.disabled = false;
	elements.reloadButton.disabled = false;
	elements.centerMessage.textContent = "Challenge started. Select all clean water images, then press Verify.";
	elements.statusHeadline.textContent = "In progress";
	elements.statusMessage.textContent = "Find every clean image and avoid dirty or unrelated images.";
	showJerryCanAlert("Jerry can filled. Challenge started.", "success", 70);
	scrollToChallengePanel();

	generateGrid();
	updateTimer();
	updateScore(0);

	// Every second, time increases and score decreases by 1 point.
	state.timerIntervalId = setInterval(() => {
		state.elapsedSeconds += 1;
		updateTimer();
		updateScore(-1);

		if (state.elapsedSeconds >= TIME_LIMIT) {
			endGame(false, true);
		}
	}, 1000);
}

function scrollToChallengePanel() {
	if (!elements.challengePanel) {
		return;
	}

	const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	// Wait a moment so layout updates before scrolling to the challenge panel.
	setTimeout(() => {
		elements.challengePanel.scrollIntoView({
			behavior: prefersReducedMotion ? "auto" : "smooth",
			block: "start"
		});
	}, 120);
}

function generateGrid() {
	if (!state.gameActive) {
		return;
	}

	state.selectedTileIndexes.clear();
	elements.grid.innerHTML = "";

	const cleanPool = images.filter((image) => image.type === "clean");
	const dirtyPool = images.filter((image) => image.type === "dirty");
	const neutralPool = images.filter((image) => image.type === "neutral");

	// Ensure each round has clean, dirty, and neutral options.
	const cleanCount = 3;
	const dirtyCount = 3;
	const neutralCount = 3;

	const roundTiles = [
		...pickRandomItems(cleanPool, cleanCount),
		...pickRandomItems(dirtyPool, dirtyCount),
		...pickRandomItems(neutralPool, neutralCount)
	];

	state.currentTiles = shuffleTiles(roundTiles);

	state.currentTiles.forEach((tileData, index) => {
		const tileButton = document.createElement("button");
		tileButton.type = "button";
		tileButton.className = "tile";
		tileButton.setAttribute("role", "gridcell");
		tileButton.dataset.index = String(index);
		tileButton.dataset.type = tileData.type;
		tileButton.setAttribute("aria-label", `Challenge tile: ${tileData.label}`);

		const tileImage = document.createElement("img");
		tileImage.src = tileData.src;
		tileImage.alt = tileData.label;

		const tileFallback = document.createElement("span");
		tileFallback.className = "tile-fallback";
		tileFallback.textContent = `${formatTypeLabel(tileData.type)}: ${tileData.label}`;

		// If a placeholder image is missing, show a text fallback instead of a broken icon.
		tileImage.addEventListener("error", () => {
			tileButton.classList.add("fallback-active");
			tileImage.setAttribute("aria-hidden", "true");
		});

		tileButton.appendChild(tileImage);
		tileButton.appendChild(tileFallback);
		tileButton.addEventListener("click", handleTileClick);
		elements.grid.appendChild(tileButton);
	});

	elements.centerMessage.textContent = "New grid loaded. Select all clean water images.";
	showJerryCanAlert("Find all the clean water.", "info", 35);
}

function shuffleTiles(tiles) {
	const shuffled = [...tiles];

	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const randomIndex = Math.floor(Math.random() * (index + 1));
		[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
	}

	return shuffled;
}

function handleTileClick(event) {
	if (!state.gameActive) {
		return;
	}

	const tile = event.currentTarget;
	const index = Number(tile.dataset.index);

	tile.classList.remove("correct", "wrong");

	if (state.selectedTileIndexes.has(index)) {
		state.selectedTileIndexes.delete(index);
		tile.classList.remove("selected");
	} else {
		state.selectedTileIndexes.add(index);
		tile.classList.add("selected");
	}
}

function validateSelection() {
	if (!state.gameActive) {
		return;
	}

	const cleanIndexes = state.currentTiles
		.map((tile, index) => ({ tile, index }))
		.filter((item) => item.tile.type === "clean")
		.map((item) => item.index);

	const wrongSelected = [...state.selectedTileIndexes].filter((index) => {
		return state.currentTiles[index].type !== "clean";
	});

	const missedClean = cleanIndexes.filter((index) => {
		return !state.selectedTileIndexes.has(index);
	});

	const allCleanSelected = missedClean.length === 0;
	const noWrongSelected = wrongSelected.length === 0;

	if (allCleanSelected && noWrongSelected) {
		showFeedback(cleanIndexes, []);
		endGame(true, false);
		return;
	}

	const deduction = (wrongSelected.length * 10) + (missedClean.length * 5);
	updateScore(-deduction);
	showFeedback(cleanIndexes, wrongSelected);

	elements.centerMessage.textContent = `Not quite right. Missed clean: ${missedClean.length}. Incorrect selections: ${wrongSelected.length}.`;
	elements.statusHeadline.textContent = "Try again";
	elements.statusMessage.textContent = "Review the highlights, adjust your choices, then verify again or reload the grid.";
	showJerryCanAlert("Incorrect selection. Adjust and verify again.", "warning", 45);
}

function updateScore(pointsDelta) {
	state.score = Math.max(0, state.score + pointsDelta);
	elements.scoreDisplay.textContent = String(state.score);

	if (state.score <= 0 && state.gameActive) {
		endGame(false, false);
	}
}

function updateTimer() {
	const minutes = Math.floor(state.elapsedSeconds / 60);
	const seconds = state.elapsedSeconds % 60;
	const formattedMinutes = String(minutes).padStart(2, "0");
	const formattedSeconds = String(seconds).padStart(2, "0");

	elements.timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
}

function showFeedback(correctIndexes, wrongIndexes) {
	const tiles = elements.grid.querySelectorAll(".tile");

	tiles.forEach((tile) => {
		tile.classList.remove("correct", "wrong");
	});

	correctIndexes.forEach((index) => {
		tiles[index].classList.add("correct");
	});

	wrongIndexes.forEach((index) => {
		tiles[index].classList.add("wrong");
	});
}

function endGame(isSuccess, isTimeUp) {
	state.gameActive = false;

	if (state.timerIntervalId) {
		clearInterval(state.timerIntervalId);
		state.timerIntervalId = null;
	}

	elements.verifyButton.disabled = true;
	elements.reloadButton.disabled = true;
	elements.startButton.textContent = "Play Again";

	if (isSuccess) {
		elements.statusHeadline.textContent = "Verification Complete";
		elements.statusMessage.textContent = "You may now use this service.";
		elements.centerMessage.textContent = "Perfect selection. All clean water images were identified correctly.";
		showSuccessJerryAlert();
		return;
	}

	if (isTimeUp) {
		elements.statusHeadline.textContent = "Time expired";
		elements.statusMessage.textContent = "Challenge ended after 60 seconds. Press Play Again to retry.";
		elements.centerMessage.textContent = "Timer reached the limit before verification was complete.";
		showJerryCanAlert("Time is up. Jerry can is running low.", "error", 10);
		return;
	}

	elements.statusHeadline.textContent = "Verification failed";
	elements.statusMessage.textContent = "Score reached zero. Press Play Again to start a fresh challenge.";
	elements.centerMessage.textContent = "Challenge ended because the score dropped to zero.";
	showJerryCanAlert("Score reached zero. Try a fresh round.", "error", 8);
}

function pickRandomItems(pool, count) {
	const shuffledPool = shuffleTiles(pool);
	return shuffledPool.slice(0, count);
}

function formatTypeLabel(type) {
	if (type === "clean") {
		return "Clean Water";
	}

	if (type === "dirty") {
		return "Unsafe Water";
	}

	return "Other Item";
}

function updateChecklistIcons() {
	setChecklistIcon(elements.awarenessCheck, elements.awarenessStatusIcon);
	setChecklistIcon(elements.robotCheck, elements.robotStatusIcon);
}

function setChecklistIcon(checkboxElement, iconElement) {
	if (checkboxElement.checked) {
		iconElement.textContent = "✓";
		iconElement.classList.add("status-icon-check");
		iconElement.classList.remove("status-icon-x");
		return;
	}

	iconElement.textContent = "✕";
	iconElement.classList.add("status-icon-x");
	iconElement.classList.remove("status-icon-check");
}

function showSuccessJerryAlert() {
	const textContent = "Great Job!\nYou found all the\nclean water.\n\nYou have earned\nyour verification.";
	elements.jerryAlertText.textContent = textContent;
	elements.jerryWater.style.height = "100%";
	elements.jerryAlert.classList.remove("success", "warning", "error");
	elements.jerryAlert.classList.add("success");
	elements.jerryAlert.classList.add("show");
	elements.jerryAlert.setAttribute("aria-hidden", "false");

	clearTimeout(showJerryCanAlert.hideTimeoutId);
	showJerryCanAlert.hideTimeoutId = setTimeout(() => {
		elements.jerryAlert.classList.remove("show", "success", "warning", "error");
		elements.jerryAlert.setAttribute("aria-hidden", "true");
	}, 3000);
}

function showJerryCanAlert(message, tone, fillPercent) {
	const level = Math.min(100, Math.max(8, fillPercent));

	elements.jerryAlertText.textContent = message;
	elements.jerryWater.style.height = `${level}%`;
	elements.jerryAlert.classList.remove("success", "warning", "error");

	if (tone === "success" || tone === "warning" || tone === "error") {
		elements.jerryAlert.classList.add(tone);
	}

	elements.jerryAlert.classList.add("show");
	elements.jerryAlert.setAttribute("aria-hidden", "false");

	clearTimeout(showJerryCanAlert.hideTimeoutId);
	showJerryCanAlert.hideTimeoutId = setTimeout(() => {
		elements.jerryAlert.classList.remove("show", "success", "warning", "error");
		elements.jerryAlert.setAttribute("aria-hidden", "true");
	}, 2400);
}

document.addEventListener("DOMContentLoaded", initGame);
