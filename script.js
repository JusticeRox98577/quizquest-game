// Display leaderboard
function displayLeaderboard() {
    const leaderboardElement = document.getElementById("leaderboard");
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
    
    if (state.game.timer) {
        clearInterval(state.game.timer);
    }
}

// Initialize the game with enhanced event handling
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing game...");
    showScreen("welcome");
    
    // Re-attach all event listeners to ensure they're working
    function attachEventListeners() {
        // Navigation buttons
        document.getElementById("start-btn").addEventListener("click", () => {
            showScreen("characterSelect");
        });
        
        document.getElementById("how-to-play-btn").addEventListener("click", () => {
            showScreen("howToPlay");
        });
        
        document.getElementById("how-to-play-back-btn").addEventListener("click", () => {
            showScreen("welcome");
        });
        
        document.getElementById("character-back-btn").addEventListener("click", () => {
            showScreen("welcome");
        });
        
        document.getElementById("setup-back-btn").addEventListener("click", () => {
            showScreen("characterSelect");
        });
        
        document.getElementById("play-again-btn").addEventListener("click", () => {
            resetGame();
            showScreen("gameSetup");
        });
        
        document.getElementById("home-btn").addEventListener("click", () => {
            resetGame();
            showScreen("welcome");
        });
        
        // Character selection
        const characters = document.querySelectorAll(".character");
        characters.forEach(char => {
            char.addEventListener("click", () => {
                state.player.character = char.dataset.character;
                showScreen("gameSetup");
            });
        });
        
        // Game setup form submission
        document.getElementById("game-setup-form").addEventListener("submit", (e) => {
            e.preventDefault();
            
            state.player.name = document.getElementById("player-name").value;
            state.game.questionSet = document.getElementById("question-set").value;
            state.game.difficulty = document.getElementById("difficulty").value;
            
            loadQuestions();
            startQuiz();
        });
    }
    
    // Call the function to ensure all event listeners are attached
    attachEventListeners();
    
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
});// Handle when time runs out
function handleTimeout() {
    const options = document.querySelectorAll(".option");
    options.forEach(option => {
        if (option.textContent === state.game.questions[state.game.currentQuestion].answer) {
            option.classList.add("correct");
        }
        option.style.pointerEvents = "none";
    });
    
    document.getElementById("feedback").textContent = "Time's up!";
    document.getElementById("feedback").style.color = "#f56565";
    
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
        
        document.getElementById("score").textContent = state.player.score;
        document.getElementById("feedback").textContent = `Correct! +${pointsEarned} points`;
        document.getElementById("feedback").style.color = "#48bb78";
    } else {
        document.getElementById("feedback").textContent = "Incorrect!";
        document.getElementById("feedback").style.color = "#f56565";
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
    document.getElementById("final-score").textContent = state.player.score;
    document.getElementById("correct-answers").textContent = state.player.correctAnswers;
    
    // Add player to leaderboard
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
    
    // Show results screen
    showScreen("results");
}// Game state
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
        maxTime: 10
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
    quiz: document.getElementById("quiz-screen"),
    results: document.getElementById("results-screen")
};

// Navigation functions
function showScreen(screenId) {
    console.log("Showing screen:", screenId);
    Object.values(screens).forEach(screen => {
        screen.classList.remove("active");
    });
    
    screens[screenId].classList.add("active");
}

// Load questions based on selected category and difficulty
function loadQuestions() {
    state.game.questions = questionSets[state.game.questionSet][state.game.difficulty].sort(() => Math.random() - 0.5);
    document.getElementById("total-questions").textContent = state.game.questions.length;
    document.getElementById("results-total-questions").textContent = state.game.questions.length;
}

// Start the quiz
function startQuiz() {
    state.game.currentQuestion = 0;
    state.player.score = 0;
    state.player.correctAnswers = 0;
    
    showCurrentQuestion();
    showScreen("quiz");
}

// Display current question
function showCurrentQuestion() {
    const questionData = state.game.questions[state.game.currentQuestion];
    
    document.getElementById("question-number").textContent = state.game.currentQuestion + 1;
    document.getElementById("score").textContent = state.player.score;
    document.getElementById("question-text").textContent = questionData.question;
    
    const optionsContainer = document.getElementById("options-container");
    optionsContainer.innerHTML = "";
    
    // Reset feedback and progress bar
    document.getElementById("feedback").textContent = "";
    document.getElementById("progress-bar-fill").style.width = "0%";
    
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
    
    // Start timer
    startTimer();
}

// Timer functionality
function startTimer() {
    state.game.timeLeft = state.game.maxTime;
    document.getElementById("timer").textContent = state.game.timeLeft;
    
    // Clear any existing timer
    if (state.game.timer) {
        clearInterval(state.game.timer);
    }
    
    // Update progress bar
    const progressBarFill = document.getElementById("progress-bar-fill");
    progressBarFill.style.width = "100%";
    
    // Set new timer
    state.game.timer = setInterval(() => {
        state.game.timeLeft--;
        document.getElementById("timer").textContent = state.game.timeLeft;
        
        // Update progress bar
        const percentage = (state.game.timeLeft / state.game.maxTime) * 100;
        progressBarFill.style.width = `${percentage}%`;
        
        if (state.game.timeLeft <= 0) {
            clearInterval(state.game.timer);
            handleTimeout();
        }
    }, 1000);
}
