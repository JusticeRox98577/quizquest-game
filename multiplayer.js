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
        // Listen for game settings changes
        this.gameRef.child("settings").on("value", snapshot => {
            const settings = snapshot.val();
            if (settings) {
                document.getElementById("lobby-question-set").textContent = 
                    this.getQuestionSetName(settings.questionSet);
                document.getElementById("lobby-difficulty").textContent = 
                    settings.difficulty.charAt(0).toUpperCase() + settings.difficulty.slice(1);
            }
        });
        
        // Listen for player list changes
        this.playersRef = this.gameRef.child("players");
        this.playersRef.on("value", snapshot => {
            this.updatePlayerList(snapshot.val());
        });
        
        // Listen for game status changes
        this.gameRef.child("status").on("value", snapshot => {
            const status = snapshot.val();
            if (status === "playing") {
                this.handleGameStart();
            } else if (status === "ended") {
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
        if (!this.isHost) return;
        
        // Get all players who have selected a character
        const readyPlayers = Object.values(this.players).filter(p => p.character);
        
        if (readyPlayers.length < Object.keys(this.players).length) {
            this.showToast("Not all players have selected a character.", "warning");
            return;
        }
        
        // Get game settings
        this.gameRef.child("settings").once("value")
            .then(snapshot => {
                const settings = snapshot.val();
                
                // Load and shuffle questions
                const questions = questionSets[settings.questionSet][settings.difficulty];
                const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
                
                // Store question indices in the game
                this.gameRef.child("questions").set(shuffledQuestions);
                
                // Update game status to playing
                this.gameRef.child("status").set("playing");
                this.gameRef.child("currentQuestion").set(0);
                this.gameRef.child("startedAt").set(firebase.database.ServerValue.TIMESTAMP);
            })
            .catch(error => {
                console.error("Error starting game:", error);
                this.showToast("Error starting game. Please try again.", "error");
            });
    },
    
    // Handle the game starting
    handleGameStart: function() {
        // Transition to character selection for all players
        showScreen("character-select-screen");
        
        // Update event listeners for character selection
        const characters = document.querySelectorAll(".character");
        characters.forEach(char => {
            char.addEventListener("click", () => {
                const character = char.dataset.character;
                this.selectCharacter(character);
            });
        });
    },
    
    // Select a character in multiplayer mode
    selectCharacter: function(character) {
        // Update character in Firebase
        this.gameRef.child(`players/${this.userId}/character`).set(character)
            .then(() => {
                console.log("Character selected:", character);
                
                // Start the quiz
                this.prepareMultiplayerQuiz();
            })
            .catch(error => {
                console.error("Error selecting character:", error);
            });
    },
    
    // Prepare for multiplayer quiz
    prepareMultiplayerQuiz: function() {
        // Get game settings and questions
        Promise.all([
            this.gameRef.child("settings").once("value"),
            this.gameRef.child("questions").once("value")
        ])
        .then(([settingsSnapshot, questionsSnapshot]) => {
            const settings = settingsSnapshot.val();
            const questions = questionsSnapshot.val();
            
            // Set up the game state
            state.game.questionSet = settings.questionSet;
            state.game.difficulty = settings.difficulty;
            state.game.questions = questions;
            state.game.currentQuestion = 0;
            
            // Listen for current question changes
            this.gameRef.child("currentQuestion").on("value", snapshot => {
                const questionIndex = snapshot.val();
                if (questionIndex !== null && questionIndex >= 0) {
                    state.game.currentQuestion = questionIndex;
                    showMultiplayerQuestion();
                }
            });
            
            // Show the quiz screen
            showScreen("quiz-screen");
            
            // Show live scoreboard
            document.getElementById("live-scoreboard").style.display = "block";
            
            // Update live scoreboard
            this.updateLiveScoreboard();
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
        if (!this.isHost) return;
        
        this.gameRef.child("status").set("ended")
            .then(() => {
                console.log("Game ended");
            })
            .catch(error => {
                console.error("Error ending game:", error);
            });
    },
    
    // Handle game end
    handleGameEnd: function() {
        // Get final player stats
        this.playersRef.once("value")
            .then(snapshot => {
                const players = snapshot.val();
                
                // Update final stats for current player
                const currentPlayer = players[this.userId];
                document.getElementById("final-score").textContent = currentPlayer.score;
                document.getElementById("correct-answers").textContent = currentPlayer.correctAnswers;
                document.getElementById("results-total-questions").textContent = state.game.questions.length;
                
                // Show multiplayer-specific elements
                document.getElementById("return-to-lobby-btn").style.display = "inline-block";
                
                // Update leaderboard with all players
                const leaderboardElement = document.getElementById("leaderboard");
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
