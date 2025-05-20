// Multiplayer functionality for QuizQuest
const multiplayer = {
    // Game state
    gameId: null,
    isHost: false,
    players: {},
    gameRef: null,
    playersRef: null,
    currentPlayerRef: null,
    userId: null,
    
    // Initialize multiplayer
    init: function() {
        console.log("Initializing multiplayer functionality");
        
        try {
            // Check if Firebase is properly loaded
            if (typeof firebase === 'undefined') {
                console.error("Firebase is not defined. Make sure Firebase scripts are loaded properly.");
                return;
            }
            
            console.log("Firebase detected, checking Firebase Auth...");
            
            // Try to initialize Firebase Auth
            const firebaseAuth = firebase.auth();
            console.log("Firebase Auth initialized successfully");
            
            // Set up Firebase authentication (anonymous)
            firebaseAuth.signInAnonymously()
                .then((userCredential) => {
                    this.userId = userCredential.user.uid;
                    console.log("Anonymous auth successful, userId:", this.userId);
                })
                .catch((error) => {
                    console.error("Authentication error:", error);
                    this.showToast("Authentication error. Please try again.", "error");
                });
                
            // Set up event listeners for multiplayer buttons
            this.setupEventListeners();
            
            // Set up toast notification container
            this.setupToastContainer();
        } catch (error) {
            console.error("Error initializing multiplayer:", error);
        }
    },
    
    // Set up event listeners for multiplayer-specific buttons
    setupEventListeners: function() {
        // Main menu buttons
        document.getElementById("single-player-btn").addEventListener("click", () => {
            showScreen("character-select-screen");
        });
        
        document.getElementById("create-game-btn").addEventListener("click", () => {
            showScreen("create-game-screen");
        });
        
        document.getElementById("join-game-btn").addEventListener("click", () => {
            showScreen("join-game-screen");
        });
        
        // Create game form submission
        document.getElementById("create-game-form").addEventListener("submit", (e) => {
            e.preventDefault();
            this.createGame();
        });
        
        // Join game form submission
        document.getElementById("join-game-form").addEventListener("submit", (e) => {
            e.preventDefault();
            this.joinGame();
        });
        
        // Back buttons
        document.getElementById("create-game-back-btn").addEventListener("click", () => {
            showScreen("welcome-screen");
        });
        
        document.getElementById("join-game-back-btn").addEventListener("click", () => {
            showScreen("welcome-screen");
        });
        
        // Copy game code button
        document.getElementById("copy-code-btn").addEventListener("click", () => {
            this.copyGameCode();
        });
        
        // Host controls
        document.getElementById("start-game-btn").addEventListener("click", () => {
            this.startGame();
        });
        
        document.getElementById("cancel-game-btn").addEventListener("click", () => {
            this.cancelGame();
        });
        
        // Player controls
        document.getElementById("leave-game-btn").addEventListener("click", () => {
            this.leaveGame();
        });
        
        // Return to lobby button (multiplayer results screen)
        document.getElementById("return-to-lobby-btn").addEventListener("click", () => {
            this.returnToLobby();
        });
    },
    
    // Create a new multiplayer game
    createGame: function() {
        try {
            if (!this.userId) {
                this.showToast("Authentication error. Please try again.", "error");
                return;
            }
            
            // Get form values
            const hostName = document.getElementById("host-name").value;
            const questionSet = document.getElementById("mp-question-set").value;
            const difficulty = document.getElementById("mp-difficulty").value;
            
            // Generate a random 6-letter game code
            const gameCode = this.generateGameCode();
            
            // Set up game data
            const gameData = {
                host: this.userId,
                hostName: hostName,
                status: "waiting",
                settings: {
                    questionSet: questionSet,
                    difficulty: difficulty
                },
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                players: {}
            };
            
            // Add the host as a player
            gameData.players[this.userId] = {
                name: hostName,
                character: "",  // Will be set later in character selection
                score: 0,
                correctAnswers: 0,
                isHost: true,
                joinedAt: firebase.database.ServerValue.TIMESTAMP,
                connected: true
            };
            
            // Create the game in Firebase
            this.gameRef = firebase.database().ref(`quizquest/games/${gameCode}`);
            
            this.gameRef.set(gameData)
                .then(() => {
                    console.log("Game created successfully with code:", gameCode);
                    this.gameId = gameCode;
                    this.isHost = true;
                    this.showGameLobby();
                })
                .catch(error => {
                    console.error("Error creating game:", error);
                    this.showToast("Error creating game. Please try again.", "error");
                });
                
            // Set up presence monitoring for the host
            this.setupPresence();
        } catch (error) {
            console.error("Error creating game:", error);
            this.showToast("An error occurred. Please try again.", "error");
        }
    },
    
    // Join an existing multiplayer game
    joinGame: function() {
        try {
            if (!this.userId) {
                this.showToast("Authentication error. Please try again.", "error");
                return;
            }
            
            // Get form values
            const playerName = document.getElementById("join-name").value;
            const gameCode = document.getElementById("game-code").value.trim().toUpperCase();
            
            if (gameCode.length !== 6) {
                this.showToast("Invalid game code. Please enter a 6-character code.", "error");
                return;
            }
            
            // Check if the game exists
            this.gameRef = firebase.database().ref(`quizquest/games/${gameCode}`);
            
            this.gameRef.once("value")
                .then(snapshot => {
                    const gameData = snapshot.val();
                    
                    if (!gameData) {
                        this.showToast("Game not found. Please check the code and try again.", "error");
                        return;
                    }
                    
                    if (gameData.status !== "waiting") {
                        this.showToast("This game has already started or ended.", "error");
                        return;
                    }
                    
                    // Add the player to the game
                    const playerData = {
                        name: playerName,
                        character: "",  // Will be set later in character selection
                        score: 0,
                        correctAnswers: 0,
                        isHost: false,
                        joinedAt: firebase.database.ServerValue.TIMESTAMP,
                        connected: true
                    };
                    
                    this.gameId = gameCode;
                    this.isHost = false;
                    
                    // Add player to the game
                    const playerRef = firebase.database().ref(`quizquest/games/${gameCode}/players/${this.userId}`);
                    playerRef.set(playerData)
                        .then(() => {
                            console.log("Successfully joined game:", gameCode);
                            this.showGameLobby();
                        })
                        .catch(error => {
                            console.error("Error joining game:", error);
                            this.showToast("Error joining game. Please try again.", "error");
                        });
                        
                    // Set up presence monitoring for the player
                    this.setupPresence();
                })
                .catch(error => {
                    console.error("Error checking game:", error);
                    this.showToast("Error connecting to game. Please try again.", "error");
                });
        } catch (error) {
            console.error("Error joining game:", error);
            this.showToast("An error occurred. Please try again.", "error");
        }
    },
    
    // Show the game lobby screen
    showGameLobby: function() {
        // Update the game code display
        document.getElementById("lobby-game-code").textContent = this.gameId;
        
        // Clear the player list
        document.getElementById("lobby-player-list").innerHTML = "";
        
        // Show/hide host controls
        if (this.isHost) {
            document.getElementById("host-controls").style.display = "block";
            document.getElementById("player-waiting").style.display = "none";
        } else {
            document.getElementById("host-controls").style.display = "none";
            document.getElementById("player-waiting").style.display = "block";
        }
        
        // Set up real-time listeners for game state
        this.setupGameListeners();
        
        // Show the lobby screen
        showScreen("game-lobby-screen");
    },
    
    // Set up Firebase listeners for game state
    setupGameListeners: function() {
        console.log("Setting up game listeners");
        
        // Listen for game settings changes
        this.gameRef.child("settings").on("value", snapshot => {
            const settings = snapshot.val();
            if (settings) {
                const lobbyQuestionSetElement = document.getElementById("lobby-question-set");
                const lobbyDifficultyElement = document.getElementById("lobby-difficulty");
                
                if (lobbyQuestionSetElement) {
                    lobbyQuestionSetElement.textContent = 
                        this.getQuestionSetName(settings.questionSet);
                }
                
                if (lobbyDifficultyElement) {
                    lobbyDifficultyElement.textContent = 
                        settings.difficulty.charAt(0).toUpperCase() + settings.difficulty.slice(1);
                }
            }
        });
        
        // Listen for player list changes
        this.playersRef = this.gameRef.child("players");
        this.playersRef.on("value", snapshot => {
            const players = snapshot.val();
            if (players) {
                this.players = players;
                this.updatePlayerList(players);
            }
        });
        
        // Listen for game status changes
        this.gameRef.child("status").on("value", snapshot => {
            const status = snapshot.val();
            console.log("Game status changed to:", status);
            
            if (status === "playing") {
                console.log("Game status is 'playing', calling handleGameStart()");
                this.handleGameStart();
            } else if (status === "ended") {
                console.log("Game status is 'ended', calling handleGameEnd()");
                this.handleGameEnd();
            }
        });
    },
    
    // Update the player list UI
    updatePlayerList: function(players) {
        if (!players) return;
        
        this.players = players;
        const playerListElement = document.getElementById("lobby-player-list");
        playerListElement.innerHTML = "";
        
        Object.keys(players).forEach(playerId => {
            const player = players[playerId];
            const playerItem = document.createElement("div");
            playerItem.className = "player-item";
            
            // Player character emoji (or default if not selected yet)
            let characterEmoji = "👤";
            let characterColor = "#718096";
            
            if (player.character) {
                switch (player.character) {
                    case "wizard": 
                        characterEmoji = "🧙"; 
                        characterColor = "#4a3aff";
                        break;
                    case "astronaut": 
                        characterEmoji = "👨‍🚀"; 
                        characterColor = "#ff6b6b";
                        break;
                    case "scientist": 
                        characterEmoji = "👩‍🔬"; 
                        characterColor = "#38b2ac";
                        break;
                    case "athlete": 
                        characterEmoji = "🏃"; 
                        characterColor = "#f6ad55";
                        break;
                }
            }
            
            playerItem.innerHTML = `
                <div class="player-character" style="background-color: ${characterColor}">
                    ${characterEmoji}
                </div>
                <div class="player-name">${player.name}</div>
                ${player.isHost ? '<div class="player-host-badge">Host</div>' : ''}
            `;
            
            playerListElement.appendChild(playerItem);
        });
        
        // If host, enable start button only if there are at least 2 players
        if (this.isHost) {
            const playerCount = Object.keys(players).length;
            document.getElementById("start-game-btn").disabled = playerCount < 2;
        }
    },
    
    // Start the multiplayer game (host only)
    startGame: function() {
        if (!this.isHost) {
            console.log("Only the host can start the game");
            return;
        }
        
        console.log("Host attempting to start the game");
        
        // Visually indicate we're processing
        const startGameBtn = document.getElementById("start-game-btn");
        if (startGameBtn) {
            startGameBtn.textContent = "Starting...";
            startGameBtn.disabled = true;
        }
        
        // Check if all players who have selected a character
        this.playersRef.once("value")
            .then(snapshot => {
                const players = snapshot.val();
                console.log("Players before game start:", players);
                
                // Only check if players have selected characters if we're beyond character selection
                // At this point we only care if there are enough players
                const playerCount = Object.keys(players).length;
                if (playerCount < 2) {
                    console.log("Not enough players to start game");
                    this.showToast("At least 2 players are required to start the game.", "warning");
                    
                    // Reset button
                    if (startGameBtn) {
                        startGameBtn.textContent = "Start Game";
                        startGameBtn.disabled = false;
                    }
                    return;
                }
                
                console.log("Sufficient players to start game, proceeding...");
                
                // Get game settings
                this.gameRef.child("settings").once("value")
                    .then(snapshot => {
                        const settings = snapshot.val();
                        
                        // Load and shuffle questions
                        const questions = questionSets[settings.questionSet][settings.difficulty];
                        const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
                        
                        console.log("Questions loaded and shuffled");
                        
                        // Store question indices in the game
                        this.gameRef.child("questions").set(shuffledQuestions)
                            .then(() => {
                                console.log("Questions saved to Firebase");
                                
                                // Update all players to reset character selection
                                const playerUpdates = {};
                                Object.keys(players).forEach(playerId => {
                                    playerUpdates[`players/${playerId}/character`] = "";
                                    playerUpdates[`players/${playerId}/answered`] = false;
                                });
                                
                                // Update game status to playing and reset other game state
                                const updates = {
                                    ...playerUpdates,
                                    "status": "playing",
                                    "currentQuestion": 0,
                                    "startedAt": firebase.database.ServerValue.TIMESTAMP
                                };
                                
                                this.gameRef.update(updates)
                                    .then(() => {
                                        console.log("Game successfully started, status updated to 'playing'");
                                        
                                        // The status change should trigger handleGameStart in all clients
                                        // But let's also call it directly for the host
                                        this.handleGameStart();
                                    })
                                    .catch(error => {
                                        console.error("Error updating game status:", error);
                                        this.showToast("Error starting game. Please try again.", "error");
                                        
                                        // Reset button
                                        if (startGameBtn) {
                                            startGameBtn.textContent = "Start Game";
                                            startGameBtn.disabled = false;
                                        }
                                    });
                            })
                            .catch(error => {
                                console.error("Error saving questions:", error);
                                this.showToast("Error starting game. Please try again.", "error");
                                
                                // Reset button
                                if (startGameBtn) {
                                    startGameBtn.textContent = "Start Game";
                                    startGameBtn.disabled = false;
                                }
                            });
                    })
                    .catch(error => {
                        console.error("Error getting game settings:", error);
                        this.showToast("Error starting game. Please try again.", "error");
                        
                        // Reset button
                        if (startGameBtn) {
                            startGameBtn.textContent = "Start Game";
                            startGameBtn.disabled = false;
                        }
                    });
            })
            .catch(error => {
                console.error("Error checking players:", error);
                this.showToast("Error starting game. Please try again.", "error");
                
                // Reset button
                if (startGameBtn) {
                    startGameBtn.textContent = "Start Game";
                    startGameBtn.disabled = false;
                }
            });
    },
    
    // Handle the game starting
    handleGameStart: function() {
        console.log("handleGameStart called - transitioning to character selection");
        
        try {
            // Make sure we're in multiplayer mode
            state.game.isMultiplayer = true;
            
            // Transition to character selection screen
            if (window.showScreen) {
                console.log("Calling showScreen('character-select-screen')");
                window.showScreen("character-select-screen");
            } else {
                console.error("showScreen function not available");
                alert("Error: Cannot navigate to character selection. Please refresh the page.");
                return;
            }
            
            // Add multiplayer indicator to character selection screen
            const characterScreen = document.getElementById("character-select-screen");
            if (characterScreen) {
                // Remove any existing multiplayer indicator
                const existingIndicator = document.getElementById("mp-character-indicator");
                if (existingIndicator) {
                    existingIndicator.remove();
                }
                
                // Add new indicator
                const mpIndicator = document.createElement("div");
                mpIndicator.id = "mp-character-indicator";
                mpIndicator.style.backgroundColor = "#4a3aff";
                mpIndicator.style.color = "white";
                mpIndicator.style.padding = "10px";
                mpIndicator.style.textAlign = "center";
                mpIndicator.style.borderRadius = "5px";
                mpIndicator.style.margin = "10px 0";
                mpIndicator.style.fontWeight = "bold";
                mpIndicator.textContent = "MULTIPLAYER GAME - Select Your Character";
                
                // Insert at the beginning of the screen
                if (characterScreen.firstChild) {
                    characterScreen.insertBefore(mpIndicator, characterScreen.firstChild);
                } else {
                    characterScreen.appendChild(mpIndicator);
                }
            }
            
            // Update event listeners for character selection
            console.log("Setting up character click handlers");
            const characters = document.querySelectorAll(".character");
            characters.forEach(char => {
                // Remove any existing click listeners
                const newChar = char.cloneNode(true);
                char.parentNode.replaceChild(newChar, char);
                
                // Add new click listener
                newChar.addEventListener("click", () => {
                    const character = newChar.dataset.character;
                    console.log("Character clicked:", character);
                    this.selectCharacter(character);
                });
            });
        } catch (error) {
            console.error("Error in handleGameStart:", error);
            alert("An error occurred starting the game. See console for details.");
        }
    },
    
    // Select a character in multiplayer mode
    selectCharacter: function(character) {
        console.log("Selecting character in multiplayer mode:", character);
        
        // Update character in Firebase
        this.gameRef.child(`players/${this.userId}/character`).set(character)
            .then(() => {
                console.log("Character selection saved to Firebase");
                
                // Show visual confirmation
                document.querySelectorAll(".character").forEach(char => {
                    if (char.dataset.character === character) {
                        char.style.border = "5px solid gold";
                    } else {
                        char.style.border = "none";
                    }
                });
                
                // Add waiting message
                const characterScreen = document.getElementById("character-select-screen");
                if (characterScreen) {
                    let waitingMsg = document.getElementById("character-waiting-msg");
                    if (!waitingMsg) {
                        waitingMsg = document.createElement("div");
                        waitingMsg.id = "character-waiting-msg";
                        waitingMsg.style.backgroundColor = "#38b2ac";
                        waitingMsg.style.color = "white";
                        waitingMsg.style.padding = "10px";
                        waitingMsg.style.textAlign = "center";
                        waitingMsg.style.borderRadius = "5px";
                        waitingMsg.style.margin = "10px 0";
                        characterScreen.appendChild(waitingMsg);
                    }
                    waitingMsg.textContent = "Character selected! Waiting for other players...";
                }
                
                // Prepare for multiplayer quiz
                this.checkAllPlayersReady();
            })
            .catch(error => {
                console.error("Error selecting character:", error);
                alert("Error selecting character. Please try again.");
            });
    },
    
    // Check if all players have selected characters
    checkAllPlayersReady: function() {
        console.log("Checking if all players have selected characters");
        
        this.playersRef.once("value")
            .then(snapshot => {
                const players = snapshot.val();
                console.log("Current players:", players);
                
                const allReady = Object.values(players).every(player => player.character);
                console.log("All players ready:", allReady);
                
                if (allReady) {
                    console.log("All players have selected characters, proceeding to game");
                    this.prepareMultiplayerQuiz();
                } else {
                    console.log("Waiting for all players to select characters");
                    
                    // If host, show which players haven't selected
                    if (this.isHost) {
                        const notReady = Object.entries(players)
                            .filter(([_, player]) => !player.character)
                            .map(([_, player]) => player.name);
                            
                        console.log("Players not ready:", notReady);
                        
                        // Update waiting message with names
                        const waitingMsg = document.getElementById("character-waiting-msg");
                        if (waitingMsg) {
                            waitingMsg.innerHTML = `Waiting for players to select characters: <br>${notReady.join(", ")}`;
                        }
                    }
                }
            })
            .catch(error => {
                console.error("Error checking player readiness:", error);
            });
    },
    
    // Prepare for multiplayer quiz
    prepareMultiplayerQuiz: function() {
        console.log("Preparing for multiplayer quiz");
        
        // Ensure we're in multiplayer mode
        state.game.isMultiplayer = true;
        
        // Get game settings and questions
        this.gameRef.once("value")
            .then(snapshot => {
                const gameData = snapshot.val();
                if (!gameData) {
                    console.error("Game data not found");
                    return;
                }
                
                console.log("Game data retrieved:", {
                    status: gameData.status,
                    currentQuestion: gameData.currentQuestion,
                    hasQuestions: !!gameData.questions,
                    questionCount: gameData.questions ? gameData.questions.length : 0
                });
                
                if (!gameData.questions || !gameData.settings) {
                    console.error("Required game data missing", {
                        hasQuestions: !!gameData.questions,
                        hasSettings: !!gameData.settings
                    });
                    return;
                }
                
                // Store questions in local state
                state.game.questions = gameData.questions;
                state.game.questionSet = gameData.settings.questionSet;
                state.game.difficulty = gameData.settings.difficulty;
                
                console.log("Stored questions in local state:", {
                    questionCount: state.game.questions.length,
                    questionSet: state.game.questionSet,
                    difficulty: state.game.difficulty
                });
                
                // Set up listener for current question changes
                this.gameRef.child("currentQuestion").on("value", snapshot => {
                    const questionIndex = snapshot.val();
                    if (questionIndex === null || questionIndex === undefined) {
                        console.error("Received null/undefined question index");
                        return;
                    }
                    
                    console.log("Current question changed to:", questionIndex);
                    state.game.currentQuestion = questionIndex;
                    
                    // Clear any existing timers to prevent issues
                    if (state.game.timer) {
                        clearInterval(state.game.timer);
                        state.game.timer = null;
                        console.log("Cleared existing timer before showing new question");
                    }
                    
                    // Show the current question
                    this.showMultiplayerQuestion();
                });
                
                // Show the quiz screen
                showScreen("quiz-screen");
                
                // Show live scoreboard
                const liveScoreboard = document.getElementById("live-scoreboard");
                if (liveScoreboard) {
                    liveScoreboard.style.display = "block";
                }
                
                // Update live scoreboard
                this.updateLiveScoreboard();
                
                console.log("Multiplayer quiz preparation complete");
            })
            .catch(error => {
                console.error("Error preparing multiplayer quiz:", error);
            });
    },
    
    // Show the current question in multiplayer
    showMultiplayerQuestion: function() {
        const questionData = state.game.questions[state.game.currentQuestion];
        
        document.getElementById("question-number").textContent = state.game.currentQuestion + 1;
        document.getElementById("total-questions").textContent = state.game.questions.length;
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
            optionElement.addEventListener("click", () => this.selectMultiplayerAnswer(option));
            optionsContainer.appendChild(optionElement);
        });
        
        // Start timer
        this.startMultiplayerTimer();
    },
    
    // Start timer for multiplayer question
    startMultiplayerTimer: function() {
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
                this.handleMultiplayerTimeout();
            }
        }, 1000);
    },
    
    // Handle timeout in multiplayer
    handleMultiplayerTimeout: function() {
        const options = document.querySelectorAll(".option");
        options.forEach(option => {
            if (option.textContent === state.game.questions[state.game.currentQuestion].answer) {
                option.classList.add("correct");
            }
            option.style.pointerEvents = "none";
        });
        
        document.getElementById("feedback").textContent = "Time's up!";
        document.getElementById("feedback").style.color = "#f56565";
        
        // Update player stats in Firebase
        this.gameRef.child(`players/${this.userId}/answered`).set(true);
        
        // Check if all players have answered
        this.checkAllPlayersAnswered();
    },
    
    // Select answer in multiplayer
    selectMultiplayerAnswer: function(selected) {
        clearInterval(state.game.timer);
        
        const currentQuestion = state.game.questions[state.game.currentQuestion];
        const isCorrect = selected === currentQuestion.answer;
        
        // Calculate score based on time left
        const timeBonus = state.game.timeLeft * 10;
        const pointsEarned = isCorrect ? (100 + timeBonus) : 0;
        
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
        
        // Update feedback
        if (isCorrect) {
            document.getElementById("feedback").textContent = `Correct! +${pointsEarned} points`;
            document.getElementById("feedback").style.color = "#48bb78";
        } else {
            document.getElementById("feedback").textContent = "Incorrect!";
            document.getElementById("feedback").style.color = "#f56565";
        }
        
        // Update player stats in Firebase
        const updates = {
            [`players/${this.userId}/answered`]: true,
            [`players/${this.userId}/score`]: firebase.database.ServerValue.increment(pointsEarned)
        };
        
        if (isCorrect) {
            updates[`players/${this.userId}/correctAnswers`] = firebase.database.ServerValue.increment(1);
        }
        
        this.gameRef.update(updates)
            .then(() => {
                console.log("Answer submitted:", selected, "Points earned:", pointsEarned);
                
                // Check if all players have answered
                this.checkAllPlayersAnswered();
            })
            .catch(error => {
                console.error("Error submitting answer:", error);
            });
    },
    
    // Check if all players have answered
    checkAllPlayersAnswered: function() {
        this.playersRef.once("value")
            .then(snapshot => {
                const players = snapshot.val();
                const allAnswered = Object.values(players).every(player => player.answered);
                
                if (allAnswered) {
                    // Reset answered flags and move to next question (host only)
                    if (this.isHost) {
                        // Reset answered flags for all players
                        Object.keys(players).forEach(playerId => {
                            this.gameRef.child(`players/${playerId}/answered`).set(false);
                        });
                        
                        // Move to next question or end game
                        setTimeout(() => {
                            this.moveToNextQuestion();
                        }, 2000);
                    }
                }
            });
    },
    
    // Move to next question in multiplayer (host only)
    moveToNextQuestion: function() {
        if (!this.isHost) return;
        
        this.gameRef.child("currentQuestion").once("value")
            .then(snapshot => {
                const currentQuestion = snapshot.val();
                const nextQuestion = currentQuestion + 1;
                
                if (nextQuestion < state.game.questions.length) {
                    this.gameRef.child("currentQuestion").set(nextQuestion);
                } else {
                    this.endMultiplayerGame();
                }
            });
    },
    
    // End the multiplayer game (host only)
    endMultiplayerGame: function() {
        console.log("Host ending multiplayer game");
        
        if (!this.isHost) {
            console.log("Only host can end the game");
            return;
        }
        
        this.gameRef.child("status").set("ended")
            .then(() => {
                console.log("Game status updated to 'ended'");
            })
            .catch(error => {
                console.error("Error ending game:", error);
            });
    },
    
    // Handle game end
    handleGameEnd: function() {
        console.log("Handling game end");
        
        // Clear any existing timers
        if (state.game.timer) {
            clearInterval(state.game.timer);
            state.game.timer = null;
            console.log("Cleared timer at game end");
        }
        
        // Remove question change listener
        if (this.gameRef) {
            this.gameRef.child("currentQuestion").off("value");
            console.log("Removed currentQuestion listener");
        }
        
        // Get final player stats
        this.playersRef.once("value")
            .then(snapshot => {
                const players = snapshot.val();
                if (!players) {
                    console.error("No players found when ending game");
                    return;
                }
                
                console.log("Final player stats:", players);
                
                // Update final stats for current player
                const currentPlayer = players[this.userId];
                if (!currentPlayer) {
                    console.error("Current player not found in results");
                    return;
                }
                
                const finalScoreElement = document.getElementById("final-score");
                const correctAnswersElement = document.getElementById("correct-answers");
                const resultsTotalQuestionsElement = document.getElementById("results-total-questions");
                const returnToLobbyBtn = document.getElementById("return-to-lobby-btn");
                
                if (finalScoreElement) {
                    finalScoreElement.textContent = currentPlayer.score;
                }
                
                if (correctAnswersElement) {
                    correctAnswersElement.textContent = currentPlayer.correctAnswers;
                }
                
                if (resultsTotalQuestionsElement && state.game.questions) {
                    resultsTotalQuestionsElement.textContent = state.game.questions.length;
                }
                
                // Show multiplayer-specific elements
                if (returnToLobbyBtn) {
                    returnToLobbyBtn.style.display = "inline-block";
                }
                
                // Update leaderboard with all players
                const leaderboardElement = document.getElementById("leaderboard");
                if (leaderboardElement) {
                    leaderboardElement.innerHTML = "";
                    
                    // Convert players object to array and sort by score
                    const playersArray = Object.entries(players).map(([id, player]) => ({
                        id,
                        ...player
                    }));
                    
                    // Sort by score (highest first)
                    playersArray.sort((a, b) => b.score - a.score);
                    
                    // Create leaderboard items
                    playersArray.forEach((player, index) => {
                        const item = document.createElement("div");
                        item.className = "leaderboard-item";
                        
                        let characterEmoji = "👤";
                        if (player.character) {
                            switch (player.character) {
                                case "wizard": characterEmoji = "🧙"; break;
                                case "astronaut": characterEmoji = "👨‍🚀"; break;
                                case "scientist": characterEmoji = "👩‍🔬"; break;
                                case "athlete": characterEmoji = "🏃"; break;
                            }
                        }
                        
                        item.innerHTML = `
                            <div>${index + 1}. ${characterEmoji} ${player.name} ${player.isHost ? '(Host)' : ''}</div>
                            <div>${player.score}</div>
                        `;
                        
                        leaderboardElement.appendChild(item);
                    });
                }
                
                // Show results screen
                showScreen("results-screen");
                console.log("Game end complete, showing results screen");
            })
            .catch(error => {
                console.error("Error handling game end:", error);
            });
    }, => {
                    const item = document.createElement("div");
                    item.className = "leaderboard-item";
                    
                    let characterEmoji = "👤";
                    if (player.character) {
                        switch (player.character) {
                            case "wizard": characterEmoji = "🧙"; break;
                            case "astronaut": characterEmoji = "👨‍🚀"; break;
                            case "scientist": characterEmoji = "👩‍🔬"; break;
                            case "athlete": characterEmoji = "🏃"; break;
                        }
                    }
                    
                    item.innerHTML = `
                        <div>${index + 1}. ${characterEmoji} ${player.name} ${player.isHost ? '(Host)' : ''}</div>
                        <div>${player.score}</div>
                    `;
                    
                    leaderboardElement.appendChild(item);
                });
                
                // Show results screen
                showScreen("results-screen");
            });
    },
    
    // Return to lobby after game (only valid for "ended" status)
    returnToLobby: function() {
        // Reset game state for a new round
        if (this.isHost) {
            this.gameRef.update({
                status: "waiting",
                currentQuestion: null,
                questions: null
            })
            .then(() => {
                // Reset all player scores and answers
                this.playersRef.once("value")
                    .then(snapshot => {
                        const players = snapshot.val();
                        const updates = {};
                        
                        Object.keys(players).forEach(playerId => {
                            updates[`players/${playerId}/score`] = 0;
                            updates[`players/${playerId}/correctAnswers`] = 0;
                            updates[`players/${playerId}/answered`] = false;
                        });
                        
                        return this.gameRef.update(updates);
                    })
                    .then(() => {
                        console.log("Game reset for a new round");
                        showScreen("game-lobby-screen");
                    });
            })
            .catch(error => {
                console.error("Error returning to lobby:", error);
            });
        } else {
            // For non-host players, just go back to the lobby
            showScreen("game-lobby-screen");
        }
    },
    
    // Cancel game (host only)
    cancelGame: function() {
        if (!this.isHost) return;
        
        this.gameRef.remove()
            .then(() => {
                console.log("Game cancelled");
                this.cleanupGame();
                showScreen("welcome-screen");
            })
            .catch(error => {
                console.error("Error cancelling game:", error);
            });
    },
    
    // Leave game (non-host player)
    leaveGame: function() {
        if (this.isHost) return;
        
        this.gameRef.child(`players/${this.userId}`).remove()
            .then(() => {
                console.log("Left game");
                this.cleanupGame();
                showScreen("welcome-screen");
            })
            .catch(error => {
                console.error("Error leaving game:", error);
            });
    },
    
    // Cleanup game references and listeners
    cleanupGame: function() {
        // Remove all event listeners
        if (this.gameRef) {
            this.gameRef.off();
        }
        
        if (this.playersRef) {
            this.playersRef.off();
        }
        
        // Reset state
        this.gameId = null;
        this.isHost = false;
        this.players = {};
        this.gameRef = null;
        this.playersRef = null;
    },
    
    // Set up presence management for disconnections
    setupPresence: function() {
        try {
            if (!this.gameId || !this.userId) return;
            
            // Set up onDisconnect to mark player as disconnected
            this.currentPlayerRef = firebase.database().ref(`quizquest/games/${this.gameId}/players/${this.userId}`);
            this.currentPlayerRef.onDisconnect().update({
                connected: false
            });
            
            // If host disconnects, mark game as ended
            if (this.isHost) {
                const statusRef = firebase.database().ref(`quizquest/games/${this.gameId}/status`);
                statusRef.onDisconnect().set("ended");
            }
        } catch (error) {
            console.error("Error setting up presence:", error);
        }
    },
    
    // Update the live scoreboard during the game
    updateLiveScoreboard: function() {
        // Listen for score changes
        this.playersRef.on("value", snapshot => {
            const players = snapshot.val();
            if (!players) return;
            
            const scoreboardElement = document.getElementById("live-player-scores");
            scoreboardElement.innerHTML = "";
            
            // Convert to array and sort by score
            const playersArray = Object.values(players);
            playersArray.sort((a, b) => b.score - a.score);
            
            // Create score items
            playersArray.forEach(player => {
                const item = document.createElement("div");
                item.className = "live-score-item";
                
                // Character emoji
                let characterEmoji = "👤";
                if (player.character) {
                    switch (player.character) {
                        case "wizard": characterEmoji = "🧙"; break;
                        case "astronaut": characterEmoji = "👨‍🚀"; break;
                        case "scientist": characterEmoji = "👩‍🔬"; break;
                        case "athlete": characterEmoji = "🏃"; break;
                    }
                }
                
                // Create player info section
                const playerInfo = document.createElement("div");
                playerInfo.className = "player-info";
                playerInfo.innerHTML = `
                    <div class="player-character" style="background-color: ${
                        player.character === "wizard" ? "#4a3aff" :
                        player.character === "astronaut" ? "#ff6b6b" :
                        player.character === "scientist" ? "#38b2ac" :
                        player.character === "athlete" ? "#f6ad55" : "#718096"
                    }">${characterEmoji}</div>
                    <div class="player-name">${player.name}</div>
                `;
                
                // Create score section
                const scoreValue = document.createElement("div");
                scoreValue.className = "score-value";
                scoreValue.textContent = player.score;
                
                // Add to item
                item.appendChild(playerInfo);
                item.appendChild(scoreValue);
                
                // Add to scoreboard
                scoreboardElement.appendChild(item);
            });
        });
    },
    
    // Helper function to generate a random 6-letter game code
    generateGameCode: function() {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar-looking characters
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    },
    
    // Helper function to get readable question set name
    getQuestionSetName: function(key) {
        const names = {
            'general': 'General Knowledge',
            'science': 'Science',
            'history': 'History',
            'math': 'Mathematics'
        };
        return names[key] || key;
    },
    
    // Copy the game code to clipboard
    copyGameCode: function() {
        const gameCode = document.getElementById("lobby-game-code").textContent;
        
        navigator.clipboard.writeText(gameCode)
            .then(() => {
                this.showToast("Game code copied to clipboard!", "success");
            })
            .catch(err => {
                console.error("Could not copy text: ", err);
                this.showToast("Failed to copy game code", "error");
            });
    },
    
    // Toast notification system
    setupToastContainer: function() {
        // Create toast container if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
    },
    
    showToast: function(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container');
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Remove after animation completes
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }
};

// Initialize multiplayer on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize multiplayer functionality
    multiplayer.init();
    
    // Make showMultiplayerQuestion globally available
    window.showMultiplayerQuestion = function() {
        multiplayer.showMultiplayerQuestion();
    };
});
