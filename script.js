// Game state
const state = {
    player: {
        name: "",
        character: "",
        score: 0,
        correctAnswers: 0
    },
    game: {
        questionSet: "",
        difficulty: "",
        currentQuestion: 0,
        questions: [],
        timer: null,
        timeLeft: 10,
        maxTime: 10,
        isMultiplayer: false
    }
};

// Leaderboard data (would typically come from a database)
let leaderboard = [
    { name: "Alex", character: "wizard", score: 950 },
    { name: "Sam", character: "scientist", score: 820 },
    { name: "Jordan", character: "astronaut", score: 780 }
];

// Element references
const screens = {
    welcome: document.getElementById("welcome-screen"),
    howToPlay: document.getElementById("how-to-play-screen"),
    characterSelect: document.getElementById("character-select-screen"),
    gameSetup: document.getElementById("game-setup-screen"),
    createGame: document.getElementById("create-game-screen"),
    joinGame: document.getElementById("join-game-screen"),
    gameLobby: document.getElementById("game-lobby-screen"),
    quiz: document.getElementById("quiz-screen"),
    results: document.getElementById("results-screen")
};

// Navigation functions
function showScreen(screenId) {
    console.log("Showing screen:", screenId);
    Object.values(screens).forEach(screen => {
        if (screen) {
            screen.classList.remove("active");
        } else {
            console.warn(`Screen element not found for: ${screenId}`);
        }
    });
    
    if (screens[screenId]) {
        screens[screenId].classList.add("active");
    } else {
        console.error(`Cannot show screen: ${screenId} - element not found`);
    }
}

// Load questions based on selected category and difficulty
function loadQuestions() {
    state.game.questions = questionSets[state.game.questionSet][state.game.difficulty].sort(() => Math.random() - 0.5);
    const totalQuestionsElement = document.getElementById("total-questions");
    const resultsTotalQuestionsElement = document.getElementById("results-total-questions");
    
    if (totalQuestionsElement) {
        totalQuestionsElement.textContent = state.game.questions.length;
    }
    
    if (resultsTotalQuestionsElement) {
        resultsTotalQuestionsElement.textContent = state.game.questions.length;
    }
}

// Start the quiz (single player)
function startQuiz() {
    state.game.currentQuestion = 0;
    state.player.score = 0;
    state.player.correctAnswers = 0;
    state.game.isMultiplayer = false;
    
    showCurrentQuestion();
    showScreen("quiz-screen");
    
    // Hide multiplayer elements
    const liveScoreboard = document.getElementById("live-scoreboard");
    if (liveScoreboard) {
        liveScoreboard.style.display = "none";
    }
}

// Display current question (single player)
function showCurrentQuestion() {
    const questionData = state.game.questions[state.game.currentQuestion];
    
    const questionNumberElement = document.getElementById("question-number");
    const scoreElement = document.getElementById("score");
    const questionTextElement = document.getElementById("question-text");
    const optionsContainer = document.getElementById("options-container");
    const feedbackElement = document.getElementById("feedback");
    const progressBarFill = document.getElementById("progress-bar-fill");
    
    if (questionNumberElement) {
        questionNumberElement.textContent = state.game.currentQuestion + 1;
    }
    
    if (scoreElement) {
        scoreElement.textContent = state.player.score;
    }
    
    if (questionTextElement) {
        questionTextElement.textContent = questionData.question;
    }
    
    if (optionsContainer) {
        optionsContainer.innerHTML = "";
        
        // Shuffle options
        const shuffledOptions = [...questionData.options].sort(() => Math.random() - 0.5);
        
        // Create option elements
        shuffledOptions.forEach(option => {
            const optionElement = document.createElement("div");
            optionElement.className = "option";
            optionElement.textContent = option;
            optionElement.addEventListener("click", () => selectAnswer(option));
            optionsContainer.appendChild(optionElement);
        });
    }
    
    // Reset feedback and progress bar
    if (feedbackElement) {
        feedbackElement.textContent = "";
    }
    
    if (progressBarFill) {
        progressBarFill.style.width = "0%";
    }
    
    // Start timer
    startTimer();
}

// Timer functionality
function startTimer() {
    state.game.timeLeft = state.game.maxTime;
    const timerElement = document.getElementById("timer");
    const progressBarFill = document.getElementById("progress-bar-fill");
    
    if (timerElement) {
        timerElement.textContent = state.game.timeLeft;
    }
    
    // Clear any existing timer
    if (state.game.timer) {
        clearInterval(state.game.timer);
    }
    
    // Update progress bar
    if (progressBarFill) {
        progressBarFill.style.width = "100%";
    }
    
    // Set new timer
    state.game.timer = setInterval(() => {
        state.game.timeLeft--;
        
        if (timerElement) {
            timerElement.textContent = state.game.timeLeft;
        }
        
        // Update progress bar
        if (progressBarFill) {
            const percentage = (state.game.timeLeft / state.game.maxTime) * 100;
            progressBarFill.style.width = `${percentage}%`;
        }
        
        if (state.game.timeLeft <= 0) {
            clearInterval(state.game.timer);
            handleTimeout();
        }
    }, 1000);
}

// Handle when time runs out
function handleTimeout() {
    const optionsElements = document.querySelectorAll(".option");
    const feedbackElement = document.getElementById("feedback");
    
    optionsElements.forEach(option => {
        if (option.textContent === state.game.questions[state.game.currentQuestion].answer) {
            option.classList.add("correct");
        }
        option.style.pointerEvents = "none";
    });
    
    if (feedbackElement) {
        feedbackElement.textContent = "Time's up!";
        feedbackElement.style.color = "#f56565";
    }
    
    setTimeout(nextQuestion, 2000);
}

// Handle answer selection
function selectAnswer(selected) {
    clearInterval(state.game.timer);
    
    const currentQuestion = state.game.questions[state.game.currentQuestion];
    const isCorrect = selected === currentQuestion.answer;
    
    // Calculate score based on time left
    const timeBonus = state.game.timeLeft * 10;
    
    // Update options display
    const optionsElements = document.querySelectorAll(".option");
    const scoreElement = document.getElementById("score");
    const feedbackElement = document.getElementById("feedback");
    
    optionsElements.forEach(option => {
        if (option.textContent === selected) {
            option.classList.add(isCorrect ? "correct" : "incorrect");
        } else if (option.textContent === currentQuestion.answer) {
            option.classList.add("correct");
        }
        option.style.pointerEvents = "none";
    });
    
    // Update player stats
    if (isCorrect) {
        const pointsEarned = 100 + timeBonus;
        state.player.score += pointsEarned;
        state.player.correctAnswers++;
        
        if (scoreElement) {
            scoreElement.textContent = state.player.score;
        }
        
        if (feedbackElement) {
            feedbackElement.textContent = `Correct! +${pointsEarned} points`;
            feedbackElement.style.color = "#48bb78";
        }
    } else {
        if (feedbackElement) {
            feedbackElement.textContent = "Incorrect!";
            feedbackElement.style.color = "#f56565";
        }
    }
    
    // Move to next question after delay
    setTimeout(nextQuestion, 2000);
}

// Move to next question or end game
function nextQuestion() {
    state.game.currentQuestion++;
    
    if (state.game.currentQuestion < state.game.questions.length) {
        showCurrentQuestion();
    } else {
        endGame();
    }
}

// End the game and show results
function endGame() {
    // Update final stats
    const finalScoreElement = document.getElementById("final-score");
    const correctAnswersElement = document.getElementById("correct-answers");
    const returnToLobbyBtn = document.getElementById("return-to-lobby-btn");
    
    if (finalScoreElement) {
        finalScoreElement.textContent = state.player.score;
    }
    
    if (correctAnswersElement) {
        correctAnswersElement.textContent = state.player.correctAnswers;
    }
    
    // Add player to leaderboard (single player only)
    if (!state.game.isMultiplayer) {
        leaderboard.push({
            name: state.player.name,
            character: state.player.character,
            score: state.player.score
        });
        
        // Sort leaderboard
        leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        if (leaderboard.length > 10) {
            leaderboard = leaderboard.slice(0, 10);
        }
        
        // Display leaderboard
        displayLeaderboard();
        
        // Hide multiplayer buttons
        if (returnToLobbyBtn) {
            returnToLobbyBtn.style.display = "none";
        }
    }
    
    // Show results screen
    showScreen("results-screen");
}

// Display leaderboard
function displayLeaderboard() {
    const leaderboardElement = document.getElementById("leaderboard");
    
    if (!leaderboardElement) {
        console.error("Leaderboard element not found");
        return;
    }
    
    leaderboardElement.innerHTML = "";
    
    leaderboard.forEach((entry, index) => {
        const item = document.createElement("div");
        item.className = "leaderboard-item";
        
        let characterEmoji = "👤";
        switch (entry.character) {
            case "wizard": characterEmoji = "🧙"; break;
            case "astronaut": characterEmoji = "👨‍🚀"; break;
            case "scientist": characterEmoji = "👩‍🔬"; break;
            case "athlete": characterEmoji = "🏃"; break;
        }
        
        item.innerHTML = `
            <div>${index + 1}. ${characterEmoji} ${entry.name}</div>
            <div>${entry.score}</div>
        `;
        
        leaderboardElement.appendChild(item);
    });
}

// Reset game state
function resetGame() {
    state.player.score = 0;
    state.player.correctAnswers = 0;
    state.game.currentQuestion = 0;
    state.game.questions = [];
    state.game.isMultiplayer = false;
    
    if (state.game.timer) {
        clearInterval(state.game.timer);
    }
}

// Re-attach all event listeners to ensure they're working
function attachSinglePlayerEventListeners() {
    console.log("Attaching single player event listeners");
    
    // Single player button (new in multiplayer version)
    const singlePlayerBtn = document.getElementById("single-player-btn");
    if (singlePlayerBtn) {
        singlePlayerBtn.addEventListener("click", () => {
            showScreen("character-select-screen");
        });
    } else {
        console.warn("Single player button not found");
    }
    
    // Navigation buttons
    const howToPlayBtn = document.getElementById("how-to-play-btn");
    if (howToPlayBtn) {
        howToPlayBtn.addEventListener("click", () => {
            showScreen("howToPlay");
        });
    } else {
        console.warn("How to play button not found");
    }
    
    const howToPlayBackBtn = document.getElementById("how-to-play-back-btn");
    if (howToPlayBackBtn) {
        howToPlayBackBtn.addEventListener("click", () => {
            showScreen("welcome-screen");
        });
    } else {
        console.warn("How to play back button not found");
    }
    
    const characterBackBtn = document.getElementById("character-back-btn");
    if (characterBackBtn) {
        characterBackBtn.addEventListener("click", () => {
            showScreen("welcome-screen");
        });
    } else {
        console.warn("Character back button not found");
    }
    
    const setupBackBtn = document.getElementById("setup-back-btn");
    if (setupBackBtn) {
        setupBackBtn.addEventListener("click", () => {
            showScreen("characterSelect");
        });
    } else {
        console.warn("Setup back button not found");
    }
    
    const playAgainBtn = document.getElementById("play-again-btn");
    if (playAgainBtn) {
        playAgainBtn.addEventListener("click", () => {
            resetGame();
            showScreen("gameSetup");
        });
    } else {
        console.warn("Play again button not found");
    }
    
    const homeBtn = document.getElementById("home-btn");
    if (homeBtn) {
        homeBtn.addEventListener("click", () => {
            resetGame();
            showScreen("welcome-screen");
        });
    } else {
        console.warn("Home button not found");
    }
    
    // Character selection for single player
    const characters = document.querySelectorAll(".character");
    characters.forEach(char => {
        char.addEventListener("click", () => {
            if (!state.game.isMultiplayer) {
                state.player.character = char.dataset.character;
                showScreen("gameSetup");
            }
        });
    });
    
    // Game setup form submission
    const gameSetupForm = document.getElementById("game-setup-form");
    if (gameSetupForm) {
        gameSetupForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            state.player.name = document.getElementById("player-name").value;
            state.game.questionSet = document.getElementById("question-set").value;
            state.game.difficulty = document.getElementById("difficulty").value;
            
            loadQuestions();
            startQuiz();
        });
    } else {
        console.warn("Game setup form not found");
    }
}

// Initialize the game with enhanced event handling
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing game...");
    showScreen("welcome-screen");
    
    // Call the function to ensure all event listeners are attached
    attachSinglePlayerEventListeners();
    
    // Add debugging info to help troubleshoot
    console.log("Game initialized and event listeners attached");
    
    // Try to persist leaderboard in localStorage
    try {
        const savedLeaderboard = localStorage.getItem('quizquest-leaderboard');
        if (savedLeaderboard) {
            leaderboard = JSON.parse(savedLeaderboard);
            console.log("Loaded leaderboard from localStorage");
        }
    } catch (error) {
        console.error("Error loading leaderboard from localStorage:", error);
    }
    
    // Save leaderboard to localStorage whenever it changes
    function saveLeaderboard() {
        try {
            localStorage.setItem('quizquest-leaderboard', JSON.stringify(leaderboard));
            console.log("Saved leaderboard to localStorage");
        } catch (error) {
            console.error("Error saving leaderboard to localStorage:", error);
        }
    }
    
    // Override the endGame function to save leaderboard
    const originalEndGame = endGame;
    endGame = function() {
        originalEndGame();
        if (!state.game.isMultiplayer) {
            saveLeaderboard();
        }
    };
    
    // Make global functions available for multiplayer.js
    window.showScreen = showScreen;
    window.state = state;
});