// Question data sets
const questionSets = {
    general: {
        easy: [
            {
                question: "What is the capital of France?",
                options: ["London", "Paris", "Berlin", "Madrid"],
                answer: "Paris"
            },
            {
                question: "Which planet is known as the Red Planet?",
                options: ["Venus", "Mars", "Jupiter", "Saturn"],
                answer: "Mars"
            },
            {
                question: "Who painted the Mona Lisa?",
                options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
                answer: "Leonardo da Vinci"
            },
            {
                question: "What is the largest ocean on Earth?",
                options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
                answer: "Pacific Ocean"
            },
            {
                question: "Which element has the chemical symbol 'O'?",
                options: ["Gold", "Oxygen", "Osmium", "Oganesson"],
                answer: "Oxygen"
            }
        ],
        medium: [
            {
                question: "In which year did World War II end?",
                options: ["1943", "1945", "1947", "1950"],
                answer: "1945"
            },
            {
                question: "What is the largest mammal on Earth?",
                options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
                answer: "Blue Whale"
            },
            {
                question: "What is the currency of Japan?",
                options: ["Yuan", "Yen", "Won", "Ringgit"],
                answer: "Yen"
            },
            {
                question: "Which instrument has 88 keys?",
                options: ["Guitar", "Piano", "Violin", "Trumpet"],
                answer: "Piano"
            },
            {
                question: "Who wrote 'Romeo and Juliet'?",
                options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
                answer: "William Shakespeare"
            }
        ],
        hard: [
            {
                question: "What is the smallest prime number?",
                options: ["0", "1", "2", "3"],
                answer: "2"
            },
            {
                question: "Which gas makes up the majority of Earth's atmosphere?",
                options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
                answer: "Nitrogen"
            },
            {
                question: "In which country was the game of chess invented?",
                options: ["China", "India", "Russia", "Persia"],
                answer: "India"
            },
            {
                question: "What is the rarest blood type?",
                options: ["AB negative", "O negative", "B negative", "A negative"],
                answer: "AB negative"
            },
            {
                question: "Who discovered penicillin?",
                options: ["Alexander Fleming", "Marie Curie", "Louis Pasteur", "Joseph Lister"],
                answer: "Alexander Fleming"
            }
        ]
    },
    science: {
        easy: [
            {
                question: "What is the chemical symbol for water?",
                options: ["WA", "H2O", "W", "AQ"],
                answer: "H2O"
            },
            {
                question: "Which gas do plants absorb from the atmosphere?",
                options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
                answer: "Carbon Dioxide"
            },
            {
                question: "What is the closest planet to the Sun?",
                options: ["Venus", "Earth", "Mars", "Mercury"],
                answer: "Mercury"
            },
            {
                question: "What is the process called when plants make their own food using sunlight?",
                options: ["Respiration", "Photosynthesis", "Digestion", "Fermentation"],
                answer: "Photosynthesis"
            },
            {
                question: "Which of these is NOT a state of matter?",
                options: ["Solid", "Liquid", "Energy", "Gas"],
                answer: "Energy"
            }
        ],
        medium: [
            {
                question: "What type of energy does a battery store?",
                options: ["Kinetic Energy", "Thermal Energy", "Chemical Energy", "Nuclear Energy"],
                answer: "Chemical Energy"
            },
            {
                question: "What is the smallest unit of matter?",
                options: ["Cell", "Molecule", "Atom", "Electron"],
                answer: "Atom"
            },
            {
                question: "Which planet has the most moons?",
                options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
                answer: "Saturn"
            },
            {
                question: "What is the powerhouse of the cell?",
                options: ["Nucleus", "Mitochondria", "Ribosome", "Endoplasmic Reticulum"],
                answer: "Mitochondria"
            },
            {
                question: "Which of these elements is a noble gas?",
                options: ["Chlorine", "Sodium", "Helium", "Phosphorus"],
                answer: "Helium"
            }
        ],
        hard: [
            {
                question: "What is the speed of light in a vacuum?",
                options: ["300,000 km/s", "150,000 km/s", "200,000 km/s", "250,000 km/s"],
                answer: "300,000 km/s"
            },
            {
                question: "What is the pH of a neutral solution?",
                options: ["0", "7", "14", "10"],
                answer: "7"
            },
            {
                question: "What is the formula for calculating work done?",
                options: ["Work = Mass × Acceleration", "Work = Force × Distance", "Work = Power × Time", "Work = Energy / Time"],
                answer: "Work = Force × Distance"
            },
            {
                question: "Which of these is NOT one of Newton's laws of motion?",
                options: ["An object in motion stays in motion", "Force equals mass times acceleration", "Every action has an equal and opposite reaction", "Energy can neither be created nor destroyed"],
                answer: "Energy can neither be created nor destroyed"
            },
            {
                question: "What is the atomic number of carbon?",
                options: ["6", "12", "14", "8"],
                answer: "6"
            }
        ]
    },
    history: {
        easy: [
            {
                question: "Who was the first President of the United States?",
                options: ["Thomas Jefferson", "Abraham Lincoln", "George Washington", "John Adams"],
                answer: "George Washington"
            },
            {
                question: "In which year did Christopher Columbus first reach the Americas?",
                options: ["1492", "1500", "1400", "1592"],
                answer: "1492"
            },
            {
                question: "Which ancient civilization built the pyramids of Giza?",
                options: ["Roman", "Greek", "Egyptian", "Mesopotamian"],
                answer: "Egyptian"
            },
            {
                question: "Who was the Queen of England for over 63 years during the 19th-20th centuries?",
                options: ["Queen Elizabeth I", "Queen Victoria", "Queen Mary", "Queen Anne"],
                answer: "Queen Victoria"
            },
            {
                question: "In which year did World War I begin?",
                options: ["1914", "1918", "1939", "1945"],
                answer: "1914"
            }
        ],
        medium: [
            {
                question: "Which empire was ruled by Genghis Khan?",
                options: ["Roman Empire", "Ottoman Empire", "Mongol Empire", "Byzantine Empire"],
                answer: "Mongol Empire"
            },
            {
                question: "In which century did the Renaissance begin?",
                options: ["13th century", "14th century", "15th century", "16th century"],
                answer: "14th century"
            },
            {
                question: "Who was the leader of the Soviet Union during most of World War II?",
                options: ["Vladimir Lenin", "Joseph Stalin", "Nikita Khrushchev", "Leon Trotsky"],
                answer: "Joseph Stalin"
            },
            {
                question: "Which event marked the beginning of the Great Depression?",
                options: ["World War I", "Stock Market Crash of 1929", "The Dust Bowl", "Pearl Harbor Attack"],
                answer: "Stock Market Crash of 1929"
            },
            {
                question: "Which country was the first to send a human to space?",
                options: ["United States", "Soviet Union", "China", "United Kingdom"],
                answer: "Soviet Union"
            }
        ],
        hard: [
            {
                question: "In which year was the Treaty of Versailles signed?",
                options: ["1917", "1918", "1919", "1920"],
                answer: "1919"
            },
            {
                question: "Who was the first Emperor of China?",
                options: ["Kublai Khan", "Sun Yat-sen", "Qin Shi Huang", "Emperor Wu of Han"],
                answer: "Qin Shi Huang"
            },
            {
                question: "During which period did the Industrial Revolution begin?",
                options: ["Late 18th century", "Mid-17th century", "Early 19th century", "Late 16th century"],
                answer: "Late 18th century"
            },
            {
                question: "Which battle marked the end of Napoleon's rule as Emperor?",
                options: ["Battle of Austerlitz", "Battle of Waterloo", "Battle of Trafalgar", "Battle of Borodino"],
                answer: "Battle of Waterloo"
            },
            {
                question: "Who was the first female Prime Minister of India?",
                options: ["Sirimavo Bandaranaike", "Indira Gandhi", "Benazir Bhutto", "Golda Meir"],
                answer: "Indira Gandhi"
            }
        ]
    },
    math: {
        easy: [
            {
                question: "What is 7 × 8?",
                options: ["54", "56", "64", "58"],
                answer: "56"
            },
            {
                question: "What is 15 + 27?",
                options: ["42", "43", "41", "40"],
                answer: "42"
            },
            {
                question: "What is half of 86?",
                options: ["43", "44", "42", "41"],
                answer: "43"
            },
            {
                question: "What is 9 squared?",
                options: ["81", "72", "90", "18"],
                answer: "81"
            },
            {
                question: "If x + 5 = 12, what is x?",
                options: ["5", "7", "8", "17"],
                answer: "7"
            }
        ],
        medium: [
            {
                question: "What is the square root of 144?",
                options: ["12", "14", "10", "16"],
                answer: "12"
            },
            {
                question: "What is the value of π (pi) to 2 decimal places?",
                options: ["3.41", "3.14", "3.12", "3.16"],
                answer: "3.14"
            },
            {
                question: "What is 15% of 80?",
                options: ["12", "8", "16", "10"],
                answer: "12"
            },
            {
                question: "If 2x - 3 = 9, what is x?",
                options: ["6", "5", "7", "4"],
                answer: "6"
            },
            {
                question: "What is the area of a circle with radius 5 units? (Use π = 3.14)",
                options: ["78.5 square units", "31.4 square units", "15.7 square units", "25 square units"],
                answer: "78.5 square units"
            }
        ],
        hard: [
            {
                question: "Solve for x: 2x² + 5x - 3 = 0",
                options: ["x = -3 or x = 0.5", "x = 3 or x = -0.5", "x = -3 or x = -0.5", "x = 3 or x = 0.5"],
                answer: "x = -3 or x = 0.5"
            },
            {
                question: "What is the derivative of f(x) = 3x² + 2x - 5?",
                options: ["f'(x) = 6x + 2", "f'(x) = 3x + 2", "f'(x) = 6x - 2", "f'(x) = 6x² + 2"],
                answer: "f'(x) = 6x + 2"
            },
            {
                question: "If log₁₀(100) = 2, what is log₁₀(1000)?",
                options: ["1", "2", "3", "4"],
                answer: "3"
            },
            {
                question: "A car travels at 60 mph for 2 hours and then at 40 mph for 3 hours. What is the average speed for the entire journey?",
                options: ["48 mph", "50 mph", "52 mph", "45 mph"],
                answer: "48 mph"
            },
            {
                question: "What is the sum of the first 15 terms of the arithmetic sequence: 3, 7, 11, 15,...?",
                options: ["450", "435", "420", "465"],
                answer: "435"
            }
        ]
    }
};
