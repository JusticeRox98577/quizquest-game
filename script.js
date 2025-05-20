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

// Navigation functions
function showScreen(screenId) {
    console.log("Showing screen:", screenId);
    
    // Get all screen elements
    const allScreens = document.querySelectorAll(".screen");
    
    // First hide all screens
    allScreens.forEach(screen => {
        screen.classList.remove("active");
    });
    
    // Then show the requested screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add("active");
    } else {
        console.error(`Screen ${screenId} not found`);
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
    if (!state.game.questions || state.game.questions.length === 0) {
        console.error("No questions loaded");
        return;
    }
    
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
    } else {
        console.error("Options container not found");
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
    if (timerElement) {
        timerElement.textContent = state.game.timeLeft;
    }
    
    // Clear any existing timer
    if (state.game.timer) {
        clearInterval(state.game.timer);
    }
    
    // Update progress bar
    const progressBarFill = document.getElementById("progress-bar-fill");
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
    const options = document.querySelectorAll(".option");
    options.forEach(option => {
        if (option.textContent === state.game.questions[state.game.currentQuestion].answer) {
            option.classList.add("correct");
        }
        option.style.pointerEvents = "none";
    });
    
    const feedbackElement = document.getElementById("feedback");
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
    const options = document.querySelectorAll(".option");
    options.forEach(option => {
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
        
        const scoreElement = document.getElementById("score");
        if (scoreElement) {
            scoreElement.textContent = state.player.score;
        }
        
        const feedbackElement = document.getElementById("feedback");
        if (feedbackElement) {
            feedbackElement.textContent = `Correct! +${pointsEarned} points`;
            feedbackElement.style.color = "#48bb78";
        }
    } else {
        const feedbackElement = document.getElementById("feedback");
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
    if (finalScoreElement) {
        finalScoreElement.textContent = state.player.score;
    }
    
    const correctAnswersElement = document.getElementById("correct-answers");
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
        const returnToLobbyBtn = document.getElementById("return-to-lobby-btn");
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

// Set up event listeners for game
function setupGameListeners() {
    // Single player button
    const singlePlayerBtn = document.getElementById("single-player-btn");
    if (singlePlayerBtn) {
        singlePlayerBtn.addEventListener("click", () => {
            showScreen("character-select-screen");
        });
    }
    
    // How to play
    const howToPlayBtn = document.getElementById("how-to-play-btn");
    if (howToPlayBtn) {
        howToPlayBtn.addEventListener("click", () => {
            showScreen("how-to-play-screen");
        });
    }
    
    const howToPlayBackBtn = document.getElementById("how-to-play-back-btn");
    if (howToPlayBackBtn) {
        howToPlayBackBtn.addEventListener("click", () => {
            showScreen("welcome-screen");
        });
    }
    
    // Character selection
    const characterBackBtn = document.getElementById("character-back-btn");
    if (characterBackBtn) {
        characterBackBtn.addEventListener("click", () => {
            showScreen("welcome-screen");
        });
    }
    
    const characters = document.querySelectorAll(".character");
    characters.forEach(char => {
        char.addEventListener("click", () => {
            if (!state.game.isMultiplayer) {
                state.player.character = char.dataset.character;
                showScreen("game-setup-screen");
            }
        });
    });
    
    // Game setup
    const setupBackBtn = document.getElementById("setup-back-btn");
    if (setupBackBtn) {
        setupBackBtn.addEventListener("click", () => {
            showScreen("character-select-screen");
        });
    }
    
    const gameSetupForm = document.getElementById("game-setup-form");
    if (gameSetupForm) {
        gameSetupForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const playerNameInput = document.getElementById("player-name");
            const questionSetSelect = document.getElementById("question-set");
            const difficultySelect = document.getElementById("difficulty");
            
            if (playerNameInput && questionSetSelect && difficultySelect) {
                state.player.name = playerNameInput.value;
                state.game.questionSet = questionSetSelect.value;
                state.game.difficulty = difficultySelect.value;
                
                loadQuestions();
                startQuiz();
            }
        });
    }
    
    // Results screen
    const playAgainBtn = document.getElementById("play-again-btn");
    if (playAgainBtn) {
        playAgainBtn.addEventListener("click", () => {
            resetGame();
            showScreen("game-setup-screen");
        });
    }
    
    const homeBtn = document.getElementById("home-btn");
    if (homeBtn) {
        homeBtn.addEventListener("click", () => {
            resetGame();
            showScreen("welcome-screen");
        });
    }
}

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing game...");
    
    // Set up event listeners
    setupGameListeners();
    
    // Show welcome screen
    showScreen("welcome-screen");
    
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
