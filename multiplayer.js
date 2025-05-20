/**
 * SIMPLIFIED MULTIPLAYER IMPLEMENTATION
 * 
 * This script provides a focused, simplified implementation of multiplayer
 * functionality that addresses the most common issues. Rather than trying
 * to fix all the complex interactions in the existing code, this provides
 * a clean approach that you can use to replace your current multiplayer.js.
 */

// Multiplayer functionality for QuizQuest
const multiplayer = {
    // Game state
    gameId: null,
    isHost: false,
    userId: null,
    players: {},
    gameRef: null,
    playersRef: null,
    
    // Initialize multiplayer
    init: function() {
        console.log("Initializing simplified multiplayer");
        
        try {
            // Check if Firebase is available
            if (!firebase || !firebase.auth || !firebase.database) {
                console.error("Firebase is not properly loaded");
                alert("Firebase is not properly loaded. Multiplayer features will not work.");
                return;
            }
            
            // Set up anonymous authentication
            firebase.auth().signInAnonymously()
                .then(userCredential => {
                    this.userId = userCredential.user.uid;
                    console.log("Anonymous auth successful, userId:", this.userId);
                    
                    // Add toast container
                    this.setupToastContainer();
                    
                    // Set up event listeners
                    this.setupEventListeners();
                })
                .catch(error => {
                    console.error("Authentication error:", error);
                    alert("Authentication error: " + error.message);
                });
        } catch (error) {
            console.error("Error initializing multiplayer:", error);
            alert("Error initializing multiplayer: " + error.message);
        }
    },
    
    // Set up event listeners for multiplayer buttons
    setupEventListeners: function() {
        // Create Game button
        const createGameBtn = document.getElementById("create-game-btn");
        if (createGameBtn) {
            createGameBtn.addEventListener("click", () => {
                console.log("Create game button clicked");
                document.getElementById("create-game-screen").classList.add("active");
                document.getElementById("welcome-screen").classList.remove("active");
            });
        }
        
        // Join Game button
        const joinGameBtn = document.getElementById("join-game-btn");
        if (joinGameBtn) {
            joinGameBtn.addEventListener("click", () => {
                console.log("Join game button clicked");
                document.getElementById("join-game-screen").classList.add("active");
                document.getElementById("welcome-screen").classList.remove("active");
            });
        }
        
        // Create Game form
        const createGameForm = document.getElementById("create-game-form");
        if (createGameForm) {
            createGameForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.createGame();
            });
        }
        
        // Join Game form
        const joinGameForm = document.getElementById("join-game-form");
        if (joinGameForm) {
            joinGameForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.joinGame();
            });
        }
        
        // Back buttons
        const createGameBackBtn = document.getElementById("create-game-back-btn");
        if (createGameBackBtn) {
            createGameBackBtn.addEventListener("click", () => {
                document.getElementById("welcome-screen").classList.add("active");
                document.getElementById("create-game-screen").classList.remove("active");
            });
        }
        
        const joinGameBackBtn = document.getElementById("join-game-back-btn");
        if (joinGameBackBtn) {
            joinGameBackBtn.addEventListener("click", () => {
                document.getElementById("welcome-screen").classList.add("active");
                document.getElementById("join-game-screen").classList.remove("active");
            });
        }
        
        // Copy code button
        const copyCodeBtn = document.getElementById("copy-code-btn");
        if (copyCodeBtn) {
            copyCodeBtn.addEventListener("click", () => {
                this.copyGameCode();
            });
        }
        
        // Start Game button
        const startGameBtn = document.getElementById("start-game-btn");
        if (startGameBtn) {
            startGameBtn.addEventListener("click", () => {
                this.startGame();
            });
        }
        
        // Cancel Game button
        const cancelGameBtn = document.getElementById("cancel-game-btn");
        if (cancelGameBtn) {
            cancelGameBtn.addEventListener("click", () => {
                this.cancelGame();
            });
        }
        
        // Leave Game button
        const leaveGameBtn = document.getElementById("leave-game-btn");
        if (leaveGameBtn) {
            leaveGameBtn.addEventListener("click", () => {
                this.leaveGame();
            });
        }
        
        // Return to Lobby button
        const returnToLobbyBtn = document.getElementById("return-to-lobby-btn");
        if (returnToLobbyBtn) {
            returnToLobbyBtn.addEventListener("click", () => {
                this.returnToLobby();
            });
        }
    },
    
    // Create a new multiplayer game
    createGame: function() {
        if (!this.userId) {
            this.showToast("Please wait, authentication in progress...", "warning");
            return;
        }
        
        // Get form values
        const hostName = document.getElementById("host-name").value;
        const questionSet = document.getElementById("mp-question-set").value;
        const difficulty = document.getElementById("mp-difficulty").value;
        
        // Generate a random game code
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
            character: "",
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
                console.log("Game created successfully:", gameCode);
                this.gameId = gameCode;
                this.isHost = true;
                
                // Set up presence monitoring
                this.setupPresence();
                
                // Set up game listeners
                this.setupGameListeners();
                
                // Show game lobby
                this.showGameLobby();
            })
            .catch(error => {
                console.error("Error creating game:", error);
                this.showToast("Error creating game: " + error.message, "error");
            });
    },
    
    // Join an existing multiplayer game
    joinGame: function() {
        if (!this.userId) {
            this.showToast("Please wait, authentication in progress...", "warning");
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
                    character: "",
                    score: 0,
                    correctAnswers: 0,
                    isHost: false,
                    joinedAt: firebase.database.ServerValue.TIMESTAMP,
                    connected: true
                };
                
                this.gameId = gameCode;
                this.isHost = false;
                
                // Add player to the game
                return firebase.database().ref(`quizquest/games/${gameCode}/players/${this.userId}`).set(playerData);
            })
            .then(() => {
                console.log("Successfully joined game:", this.gameId);
                
                // Set up presence monitoring
                this.setupPresence();
                
                // Set up game listeners
                this.setupGameListeners();
                
                // Show game lobby
                this.showGameLobby();
            })
            .catch(error => {
                console.error("Error joining game:", error);
                this.showToast("Error joining game: " + error.message, "error");
            });
    },
    
    // Show the game lobby
    showGameLobby: function() {
        // Update the game code display
        const lobbyGameCode = document.getElementById("lobby-game-code");
        if (lobbyGameCode) {
            lobbyGameCode.textContent = this.gameId;
        }
        
        // Clear the player list
        const lobbyPlayerList = document.getElementById("lobby-player-list");
        if (lobbyPlayerList) {
            lobbyPlayerList.innerHTML = "";
        }
        
        // Show/hide host controls
        const hostControls = document.getElementById("host-controls");
        const playerWaiting = document.getElementById("player-waiting");
        
        if (hostControls && playerWaiting) {
            if (this.isHost) {
                hostControls.style.display = "block";
                playerWaiting.style.display = "none";
            } else {
                hostControls.style.display = "none";
                playerWaiting.style.display = "block";
            }
        }
        
        // Show the lobby screen
        const allScreens = document.querySelectorAll(".screen");
        allScreens.forEach(screen => screen.classList.remove("active"));
        
        const lobbyScreen = document.getElementById("game-lobby-screen");
        if (lobbyScreen) {
            lobbyScreen.classList.add("active");
        }
    },
    
    // Set up game listeners
    setupGameListeners: function() {
        if (!this.gameRef) {
            console.error("Game reference not set up");
            return;
        }
        
        // Set up players reference
        this.playersRef = this.gameRef.child("players");
        
        // Listen for player list changes
        this.playersRef.on("value", snapshot => {
            const players = snapshot.val();
            if (players) {
                this.players = players;
                this.updatePlayerList(players);
            }
        });
        
        // Listen for game settings changes
        this.gameRef.child("settings").on("value", snapshot => {
            const settings = snapshot.val();
            if (settings) {
                const lobbyQuestionSet = document.getElementById("lobby-question-set");
                const lobbyDifficulty = document.getElementById("lobby-difficulty");
                
                if (lobbyQuestionSet) {
                    lobbyQuestionSet.textContent = this.getQuestionSetName(settings.questionSet);
                }
                
                if (lobbyDifficulty) {
                    lobbyDifficulty.textContent = 
                        settings.difficulty.charAt(0).toUpperCase() + settings.difficulty.slice(1);
                }
            }
        });
        
        // Listen for game status changes
        this.gameRef.child("status").on("value", snapshot => {
            const status = snapshot.val();
            console.log("Game status changed to:", status);
            
            if (status === "playing") {
                this.handleGameStart();
            } else if (status === "ended") {
                this.handleGameEnd();
            }
        });
    },
    
    // Update the player list UI
    updatePlayerList: function(players) {
        const playerListElement = document.getElementById("lobby-player-list");
        if (!playerListElement) return;
        
        playerListElement.innerHTML = "";
        
        Object.keys(players).forEach(playerId => {
            const player = players[playerId];
            
            // Skip disconnected players
            if (!player.connected) return;
            
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
            const connectedPlayers = Object.values(players).filter(p => p.connected);
            const startGameBtn = document.getElementById("start-game-btn");
            
            if (startGameBtn) {
                startGameBtn.disabled = connectedPlayers.length < 2;
            }
        }
    },
    
    // Start game (host only)
    startGame: function() {
        if (!this.isHost) {
            console.log("Only host can start the game");
            return;
        }
        
        console.log("Starting game...");
        
        // Disable start button to prevent double-clicks
        const startGameBtn = document.getElementById("start-game-btn");
        if (startGameBtn) {
            startGameBtn.disabled = true;
            startGameBtn.textContent = "Starting...";
        }
        
        // Get game settings and load questions
        this.gameRef.child("settings").once("value")
            .then(snapshot => {
                const settings = snapshot.val();
                if (!settings) {
                    throw new Error("Game settings not found");
                }
                
                // Get questions for the selected category and difficulty
                const questions = window.questionSets[settings.questionSet][settings.difficulty];
                if (!questions || !questions.length) {
                    throw new Error("No questions found for selected category/difficulty");
                }
                
                // Shuffle questions
                const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
                
                // Get connected players
                return this.playersRef.once("value")
                    .then(playersSnapshot => {
                        const players = playersSnapshot.val();
                        const connectedPlayers = Object.values(players).filter(p => p.connected);
                        
                        if (connectedPlayers.length < 2) {
                            throw new Error("At least 2 connected players are required to start");
                        }
                        
                        // Update the game to start
                        return this.gameRef.update({
                            questions: shuffledQuestions,
                            currentQuestion: 0,
                            status: "playing",
                            startedAt: firebase.database.ServerValue.TIMESTAMP
                        });
                    });
            })
            .then(() => {
                console.log("Game started successfully");
            })
            .catch(error => {
                console.error("Error starting game:", error);
                this.showToast("Error starting game: " + error.message, "error");
                
                // Re-enable start button
                if (startGameBtn) {
                    startGameBtn.disabled = false;
                    startGameBtn.textContent = "Start Game";
                }
            });
    },
    
    // Handle game start
    handleGameStart: function() {
        console.log("Game started, redirecting to character selection");
        
        // Ensure we're in multiplayer mode
        window.state.game.isMultiplayer = true;
        
        // Take players to character selection screen
        const allScreens = document.querySelectorAll(".screen");
        allScreens.forEach(screen => screen.classList.remove("active"));
        
        const charScreen = document.getElementById("character-select-screen");
        if (charScreen) {
            charScreen.classList.add("active");
            
            // Add a multiplayer indicator
            const mpIndicator = document.createElement("div");
            mpIndicator.style.backgroundColor = "#4a3aff";
            mpIndicator.style.color = "white";
            mpIndicator.style.padding = "10px";
            mpIndicator.style.margin = "10px 0";
            mpIndicator.style.borderRadius = "8px";
            mpIndicator.style.textAlign = "center";
            mpIndicator.style.fontWeight = "bold";
            mpIndicator.textContent = "MULTIPLAYER MODE: Select Your Character";
            
            // Insert at the beginning
            if (charScreen.firstChild) {
                charScreen.insertBefore(mpIndicator, charScreen.firstChild);
            } else {
                charScreen.appendChild(mpIndicator);
            }
            
            // Set up character selection
            const characters = charScreen.querySelectorAll(".character");
            characters.forEach(char => {
                // Remove any existing listeners by cloning
                const newChar = char.cloneNode(true);
                char.parentNode.replaceChild(newChar, char);
                
                // Add multiplayer character selection
                newChar.addEventListener("click", () => {
                    const character = newChar.dataset.character;
                    console.log("Selected character:", character);
                    
                    // Visual feedback
                    characters.forEach(c => c.style.border = "none");
                    newChar.style.border = "4px solid gold";
                    
                    // Update character in Firebase
                    if (this.gameRef && this.userId) {
                        this.gameRef.child(`players/${this.userId}/character`).set(character)
                            .then(() => {
                                console.log("Character updated in Firebase");
                                
                                // Add waiting message
                                const waitMsg = document.createElement("div");
                                waitMsg.style.backgroundColor = "#38b2ac";
                                waitMsg.style.color = "white";
                                waitMsg.style.padding = "10px";
                                waitMsg.style.margin = "10px 0";
                                waitMsg.style.borderRadius = "8px";
                                waitMsg.style.textAlign = "center";
                                waitMsg.id = "char-waiting-msg";
                                waitMsg.textContent = "Character selected! Waiting for other players...";
                                
                                // Remove existing message if any
                                const existingMsg = document.getElementById("char-waiting-msg");
                                if (existingMsg) {
                                    existingMsg.remove();
                                }
                                
                                charScreen.appendChild(waitMsg);
                                
                                // Check if all players have selected characters
                                this.checkAllCharactersSelected();
                            })
                            .catch(error => {
                                console.error("Error updating character:", error);
                                this.showToast("Error selecting character: " + error.message, "error");
                            });
                    }
                });
            });
        }
    },
    
    // Check if all players have selected characters
    checkAllCharactersSelected: function() {
        if (!this.playersRef) return;
        
        this.playersRef.once("value")
            .then(snapshot => {
                const players = snapshot.val();
                if (!players) return;
                
                // Check only connected players
                const connectedPlayers = Object.values(players).filter(p => p.connected);
                const allSelected = connectedPlayers.every(p => p.character);
                
                console.log("All characters selected:", allSelected);
                
                if (allSelected) {
                    // If all players have selected characters, load the quiz
                    this.loadMultiplayerQuiz();
                } else if (this.isHost) {
                    // If host, update waiting message with names of players who haven't selected
                    const waitingPlayers = connectedPlayers
                        .filter(p => !p.character)
                        .map(p => p.name)
                        .join(", ");
                    
                    const waitMsg = document.getElementById("char-waiting-msg");
                    if (waitMsg) {
                        waitMsg.textContent = `Waiting for players to select: ${waitingPlayers}`;
                    }
                }
            })
            .catch(error => {
                console.error("Error checking character selection:", error);
            });
    },
    
    // Load multiplayer quiz
    loadMultiplayerQuiz: function() {
        console.log("Loading multiplayer quiz");
        
        // Get game data
        this.gameRef.once("value")
            .then(snapshot => {
                const gameData = snapshot.val();
                if (!gameData || !gameData.questions) {
                    throw new Error("Game data or questions not found");
                }
                
                // Set up the game state
                window.state.game.questions = gameData.questions;
                window.state.game.currentQuestion = gameData.currentQuestion || 0;
                window.state.game.isMultiplayer = true;
                
                // Set up listener for question changes
                this.gameRef.child("currentQuestion").on("value", snapshot => {
                    const questionIndex = snapshot.val();
                    if (questionIndex === null || questionIndex === undefined) return;
                    
                    console.log("Question changed to:", questionIndex);
                    window.state.game.currentQuestion = questionIndex;
                    
                    // Clear any existing timers
                    if (window.state.game.timer) {
                        clearInterval(window.state.game.timer);
                        window.state.game.timer = null;
                    }
                    
                    // Show the current question
                    this.showQuestion();
                });
                
                // Show the quiz screen
                const allScreens = document.querySelectorAll(".screen");
                allScreens.forEach(screen => screen.classList.remove("active"));
                
                const quizScreen = document.getElementById("quiz-screen");
                if (quizScreen) {
                    quizScreen.classList.add("active");
                    
                    // Show live scoreboard
                    const liveScoreboard = document.getElementById("live-scoreboard");
                    if (liveScoreboard) {
                        liveScoreboard.style.display = "block";
                    }
                    
                    // Show the first question
                    this.showQuestion();
                    
                    // Set up scoreboard update
                    this.updateLiveScoreboard();
                }
            })
            .catch(error => {
                console.error("Error loading quiz:", error);
                this.showToast("Error loading quiz: " + error.message, "error");
            });
    },
    
    // Show the current question
    showQuestion: function() {
        console.log("Showing question:", window.state.game.currentQuestion);
        
        const questions = window.state.game.questions;
        const currentIndex = window.state.game.currentQuestion;
        
        if (!questions || currentIndex >= questions.length) {
            console.error("Invalid question data");
            return;
        }
        
        const questionData = questions[currentIndex];
        
        // Update UI elements
        const questionNumber = document.getElementById("question-number");
        const totalQuestions = document.getElementById("total-questions");
        const questionText = document.getElementById("question-text");
        const optionsContainer = document.getElementById("options-container");
        const feedback = document.getElementById("feedback");
        const progressBar = document.getElementById("progress-bar-fill");
        
        if (questionNumber) questionNumber.textContent = currentIndex + 1;
        if (totalQuestions) totalQuestions.textContent = questions.length;
        if (questionText) questionText.textContent = questionData.question;
        if (feedback) feedback.textContent = "";
        if (progressBar) progressBar.style.width = "0%";
        
        // Generate options
        if (optionsContainer) {
            optionsContainer.innerHTML = "";
            
            // Shuffle options
            const shuffledOptions = [...questionData.options].sort(() => Math.random() - 0.5);
            
            // Create option elements
            shuffledOptions.forEach(option => {
                const optionEl = document.createElement("div");
                optionEl.className = "option";
                optionEl.textContent = option;
                
                optionEl.addEventListener("click", () => {
                    this.selectAnswer(option, questionData);
                });
                
                optionsContainer.appendChild(optionEl);
            });
        }
        
        // Start timer
        this.startTimer();
    },
    
    // Start the timer
    startTimer: function() {
        // Reset timer
        window.state.game.timeLeft = window.state.game.maxTime;
        
        // Update UI
        const timerEl = document.getElementById("timer");
        const progressBar = document.getElementById("progress-bar-fill");
        
        if (timerEl) timerEl.textContent = window.state.game.timeLeft;
        if (progressBar) progressBar.style.width = "100%";
        
        // Clear any existing timer
        if (window.state.game.timer) {
            clearInterval(window.state.game.timer);
        }
        
        // Set new timer
        window.state.game.timer = setInterval(() => {
            window.state.game.timeLeft--;
            
            // Update UI
            if (timerEl) timerEl.textContent = window.state.game.timeLeft;
            if (progressBar) {
                const percentage = (window.state.game.timeLeft / window.state.game.maxTime) * 100;
                progressBar.style.width = `${percentage}%`;
            }
            
            // Check if time's up
            if (window.state.game.timeLeft <= 0) {
                clearInterval(window.state.game.timer);
                this.handleTimeout();
            }
        }, 1000);
    },
    
    // Handle timeout
    handleTimeout: function() {
        console.log("Time's up!");
        
        // Get current question
        const questionData = window.state.game.questions[window.state.game.currentQuestion];
        
        // Show correct answer
        const options = document.querySelectorAll(".option");
        options.forEach(option => {
            if (option.textContent === questionData.answer) {
                option.classList.add("correct");
            }
            option.style.pointerEvents = "none";
        });
        
        // Update feedback
        const feedback = document.getElementById("feedback");
        if (feedback) {
            feedback.textContent = "Time's up!";
            feedback.style.color = "#f56565";
        }
        
        // Mark player as answered
        if (this.gameRef && this.userId) {
            this.gameRef.child(`players/${this.userId}/answered`).set(true)
                .then(() => {
                    console.log("Player marked as answered after timeout");
                    
                    // Check if all players have answered
                    this.checkAllAnswered();
                })
                .catch(error => {
                    console.error("Error marking player as answered:", error);
                });
        }
    },
    
    // Select an answer
    selectAnswer: function(selected, questionData) {
        console.log("Selected answer:", selected);
        
        // Clear timer
        if (window.state.game.timer) {
            clearInterval(window.state.game.timer);
            window.state.game.timer = null;
        }
        
        // Check if answer is correct
        const isCorrect = selected === questionData.answer;
        
        // Calculate score
        const timeBonus = window.state.game.timeLeft * 10;
        const pointsEarned = isCorrect ? (100 + timeBonus) : 0;
        
        // Show visual feedback
        const options = document.querySelectorAll(".option");
        options.forEach(option => {
            if (option.textContent === selected) {
                option.classList.add(isCorrect ? "correct" : "incorrect");
            } else if (option.textContent === questionData.answer) {
                option.classList.add("correct");
            }
            option.style.pointerEvents = "none";
        });
        
        // Update feedback
        const feedback = document.getElementById("feedback");
        if (feedback) {
            if (isCorrect) {
                feedback.textContent = `Correct! +${pointsEarned} points`;
                feedback.style.color = "#48bb78";
            } else {
                feedback.textContent = "Incorrect!";
                feedback.style.color = "#f56565";
            }
        }
        
        // Update player score in Firebase
        if (this.gameRef && this.userId) {
            const updates = {
                [`players/${this.userId}/answered`]: true
            };
            
            if (isCorrect) {
                updates[`players/${this.userId}/score`] = firebase.database.ServerValue.increment(pointsEarned);
                updates[`players/${this.userId}/correctAnswers`] = firebase.database.ServerValue.increment(1);
            }
            
            this.gameRef.update(updates)
                .then(() => {
                    console.log("Answer recorded, points earned:", pointsEarned);
                    
                    // Check if all players have answered
                    this.checkAllAnswered();
                })
                .catch(error => {
                    console.error("Error recording answer:", error);
                });
        }
    },
    
    // Check if all players have answered
    checkAllAnswered: function() {
        if (!this.playersRef) return;
        
        this.playersRef.once("value")
            .then(snapshot => {
                const players = snapshot.val();
                if (!players) return;
                
                // Check only connected players
                const connectedPlayers = Object.values(players).filter(p => p.connected);
                const allAnswered = connectedPlayers.every(p => p.answered);
                
                console.log("All players answered:", allAnswered);
                
                if (allAnswered && this.isHost) {
                    console.log("All players have answered, advancing to next question");
                    
                    // Reset answered flags
                    const updates = {};
                    Object.keys(players).forEach(playerId => {
                        updates[`players/${playerId}/answered`] = false;
                    });
                    
                    this.gameRef.update(updates)
                        .then(() => {
                            console.log("Reset player answered flags");
                            
                            // Wait 2 seconds before advancing to next question
                            setTimeout(() => {
                                this.advanceQuestion();
                            }, 2000);
                        })
                        .catch(error => {
                            console.error("Error resetting answered flags:", error);
                        });
                }
            })
            .catch(error => {
                console.error("Error checking if all players answered:", error);
            });
    },
    
    // Advance to next question (host only)
    advanceQuestion: function() {
        if (!this.isHost || !this.gameRef) return;
        
        this.gameRef.child("currentQuestion").once("value")
            .then(snapshot => {
                const currentQuestion = snapshot.val();
                
                // Get total questions
                return this.gameRef.child("questions").once("value")
                    .then(questionsSnapshot => {
                        const questions = questionsSnapshot.val();
                        if (!questions) return;
                        
                        const nextQuestion = currentQuestion + 1;
                        
                        // Check if this was the last question
                        if (nextQuestion >= questions.length) {
                            console.log("All questions completed, ending game");
                            return this.gameRef.child("status").set("ended");
                        } else {
                            console.log(`Advancing to question ${nextQuestion} of ${questions.length}`);
                            return this.gameRef.child("currentQuestion").set(nextQuestion);
                        }
                    });
            })
            .catch(error => {
                console.error("Error advancing question:", error);
            });
    },
    
    // Update live scoreboard
    updateLiveScoreboard: function() {
        if (!this.playersRef) return;
        
        // Set up listener for player score changes
        this.playersRef.on("value", snapshot => {
            const players = snapshot.val();
            if (!players) return;
            
            // Get the scoreboard element
            const scoreboardElement = document.getElementById("live-player-scores");
            if (!scoreboardElement) return;
            
            // Clear current scoreboard
            scoreboardElement.innerHTML = "";
            
            // Convert to array and sort by score
            const playersArray = Object.values(players).filter(p => p.connected);
            playersArray.sort((a, b) => b.score - a.score);
            
            // Add each player to the scoreboard
            playersArray.forEach(player => {
                const scoreItem = document.createElement("div");
                scoreItem.className = "live-score-item";
                
                // Get character emoji
                let characterEmoji = "👤";
                if (player.character) {
                    switch (player.character) {
                        case "wizard": characterEmoji = "🧙"; break;
                        case "astronaut": characterEmoji = "👨‍🚀"; break;
                        case "scientist": characterEmoji = "👩‍🔬"; break;
                        case "athlete": characterEmoji = "🏃"; break;
                    }
                }
                
                // Background color for the player's character
                const characterColor = player.character === "wizard" ? "#4a3aff" :
                                      player.character === "astronaut" ? "#ff6b6b" :
                                      player.character === "scientist" ? "#38b2ac" :
                                      player.character === "athlete" ? "#f6ad55" : "#718096";
                
                // Create player info section
                const playerInfo = document.createElement("div");
                playerInfo.className = "player-info";
                playerInfo.innerHTML = `
                    <div class="player-character" style="background-color: ${characterColor}">
                        ${characterEmoji}
                    </div>
                    <div class="player-name">${player.name} ${player.isHost ? '(Host)' : ''}</div>
                `;
                
                // Create score section
                const scoreValue = document.createElement("div");
                scoreValue.className = "score-value";
                scoreValue.textContent = player.score;
                
                // Add to item and scoreboard
                scoreItem.appendChild(playerInfo);
                scoreItem.appendChild(scoreValue);
                scoreboardElement.appendChild(scoreItem);
            });
        });
    },
    
    // Handle game end
    handleGameEnd: function() {
        console.log("Game ended");
        
        // Clear any timers and listeners
        if (window.state.game.timer) {
            clearInterval(window.state.game.timer);
            window.state.game.timer = null;
        }
        
        // Remove question listener
        if (this.gameRef) {
            this.gameRef.child("currentQuestion").off("value");
        }
        
        // Get final player stats
        this.playersRef.once("value")
            .then(snapshot => {
                const players = snapshot.val();
                if (!players) return;
                
                // Get current player's stats
                const currentPlayer = players[this.userId];
                if (!currentPlayer) return;
                
                // Update results screen
                const finalScore = document.getElementById("final-score");
                const correctAnswers = document.getElementById("correct-answers");
                const totalQuestions = document.getElementById("results-total-questions");
                const returnToLobbyBtn = document.getElementById("return-to-lobby-btn");
                
                if (finalScore) finalScore.textContent = currentPlayer.score;
                if (correctAnswers) correctAnswers.textContent = currentPlayer.correctAnswers;
                if (totalQuestions && window.state.game.questions) {
                    totalQuestions.textContent = window.state.game.questions.length;
                }
                
                // Show multiplayer buttons
                if (returnToLobbyBtn) {
                    returnToLobbyBtn.style.display = "inline-block";
                }
                
                // Update leaderboard
                const leaderboard = document.getElementById("leaderboard");
                if (leaderboard) {
                    leaderboard.innerHTML = "";
                    
                    // Sort players by score
                    const sortedPlayers = Object.values(players)
                        .filter(p => p.connected)
                        .sort((a, b) => b.score - a.score);
                    
                    // Create leaderboard items
                    sortedPlayers.forEach((player, index) => {
                        const item = document.createElement("div");
                        item.className = "leaderboard-item";
                        
                        // Get character emoji
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
                        
                        leaderboard.appendChild(item);
                    });
                }
                
                // Show results screen
                const allScreens = document.querySelectorAll(".screen");
                allScreens.forEach(screen => screen.classList.remove("active"));
                
                const resultsScreen = document.getElementById("results-screen");
                if (resultsScreen) {
                    resultsScreen.classList.add("active");
                }
            })
            .catch(error => {
                console.error("Error handling game end:", error);
            });
    },
    
    // Return to lobby after game
    returnToLobby: function() {
        console.log("Returning to lobby");
        
        if (this.isHost) {
            // Reset game for a new round
            this.gameRef.update({
                status: "waiting",
                currentQuestion: null,
                questions: null
            })
            .then(() => {
                return this.playersRef.once("value");
            })
            .then(snapshot => {
                const players = snapshot.val();
                if (!players) return;
                
                // Reset player stats
                const updates = {};
                Object.keys(players).forEach(playerId => {
                    updates[`players/${playerId}/score`] = 0;
                    updates[`players/${playerId}/correctAnswers`] = 0;
                    updates[`players/${playerId}/answered`] = false;
                    updates[`players/${playerId}/character`] = "";
                });
                
                return this.gameRef.update(updates);
            })
            .then(() => {
                console.log("Game reset for new round");
                this.showGameLobby();
            })
            .catch(error => {
                console.error("Error returning to lobby:", error);
                this.showToast("Error returning to lobby: " + error.message, "error");
            });
        } else {
            // For non-host players, just go back to lobby
            this.showGameLobby();
        }
    },
    
    // Cancel game (host only)
    cancelGame: function() {
        if (!this.isHost || !this.gameRef) return;
        
        this.gameRef.remove()
            .then(() => {
                console.log("Game cancelled");
                this.cleanupGame();
                
                // Return to welcome screen
                const allScreens = document.querySelectorAll(".screen");
                allScreens.forEach(screen => screen.classList.remove("active"));
                
                const welcomeScreen = document.getElementById("welcome-screen");
                if (welcomeScreen) {
                    welcomeScreen.classList.add("active");
                }
            })
            .catch(error => {
                console.error("Error cancelling game:", error);
                this.showToast("Error cancelling game: " + error.message, "error");
            });
    },
    
    // Leave game (non-host player)
    leaveGame: function() {
        if (this.isHost) return;
        
        if (this.gameRef && this.userId) {
            this.gameRef.child(`players/${this.userId}`).remove()
                .then(() => {
                    console.log("Left game");
                    this.cleanupGame();
                    
                    // Return to welcome screen
                    const allScreens = document.querySelectorAll(".screen");
                    allScreens.forEach(screen => screen.classList.remove("active"));
                    
                    const welcomeScreen = document.getElementById("welcome-screen");
                    if (welcomeScreen) {
                        welcomeScreen.classList.add("active");
                    }
                })
                .catch(error => {
                    console.error("Error leaving game:", error);
                    this.showToast("Error leaving game: " + error.message, "error");
                });
        }
    },
    
    // Set up presence monitoring
    setupPresence: function() {
        if (!this.gameRef || !this.userId) return;
        
        // Set up onDisconnect to mark player as disconnected
        const playerRef = this.gameRef.child(`players/${this.userId}`);
        playerRef.onDisconnect().update({
            connected: false
        });
        
        // If host, set game to ended if host disconnects
        if (this.isHost) {
            this.gameRef.child("status").onDisconnect().set("ended");
        }
    },
    
    // Clean up game references and listeners
    cleanupGame: function() {
        console.log("Cleaning up game references");
        
        // Clear timers
        if (window.state.game.timer) {
            clearInterval(window.state.game.timer);
            window.state.game.timer = null;
        }
        
        // Remove Firebase listeners
        if (this.gameRef) {
            this.gameRef.off();
        }
        
        if (this.playersRef) {
            this.playersRef.off();
        }
        
        // Cancel any onDisconnect operations
        if (this.gameRef && this.userId) {
            this.gameRef.child(`players/${this.userId}`).onDisconnect().cancel();
        }
        
        // Reset state
        this.gameId = null;
        this.isHost = false;
        this.players = {};
        this.gameRef = null;
        this.playersRef = null;
    },
    
    // Copy game code to clipboard
    copyGameCode: function() {
        const codeElement = document.getElementById("lobby-game-code");
        if (!codeElement) return;
        
        const gameCode = codeElement.textContent;
        
        // Try to copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(gameCode)
                .then(() => {
                    this.showToast("Game code copied to clipboard!", "success");
                })
                .catch(error => {
                    console.error("Error copying code:", error);
                    this.showToast("Could not copy code: " + error.message, "error");
                });
        } else {
            // Fallback for browsers without clipboard API
            const tempInput = document.createElement("input");
            tempInput.value = gameCode;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand("copy");
            document.body.removeChild(tempInput);
            this.showToast("Game code copied to clipboard!", "success");
        }
    },
    
    // Get question set name
    getQuestionSetName: function(key) {
        const names = {
            'general': 'General Knowledge',
            'science': 'Science',
            'history': 'History',
            'math': 'Mathematics'
        };
        return names[key] || key;
    },
    
    // Helper function to generate a random game code
    generateGameCode: function() {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar-looking characters
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    },
    
    // Toast notification system
    setupToastContainer: function() {
        if (!document.querySelector('.toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }
    },
    
    showToast: function(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            this.setupToastContainer();
            return this.showToast(message, type);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }
};

// Initialize multiplayer on page load
document.addEventListener('DOMContentLoaded', () => {
    multiplayer.init();
    
    // Make showMultiplayerQuestion globally available
    window.showMultiplayerQuestion = function() {
        multiplayer.showQuestion();
    };
});
