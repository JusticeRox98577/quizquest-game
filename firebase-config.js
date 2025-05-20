// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDovICmO2KymiGdWjD0lAvKFNH2lkdLouY",
  authDomain: "quizquest-multiplayer.firebaseapp.com",
  databaseURL: "https://quizquest-multiplayer-default-rtdb.firebaseio.com",
  projectId: "quizquest-multiplayer",
  storageBucket: "quizquest-multiplayer.firebasestorage.app",
  messagingSenderId: "28771692523",
  appId: "1:28771692523:web:7b62e596aef2329dddb3ae",
  measurementId: "G-G0QGTE4CPW"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const database = firebase.database();

console.log("Firebase initialized");

// Test Firebase connection
function testFirebaseConnection() {
  // Create a test reference
  const testRef = database.ref('test');
  
  // Write a timestamp
  testRef.set({
    timestamp: Date.now(),
    message: 'Firebase connection test'
  })
  .then(() => {
    console.log('Firebase write successful - connection verified');
    // Clean up by removing the test data
    return testRef.remove();
  })
  .catch(error => {
    console.error('Firebase connection test failed:', error);
  });
}

// Run the test when the page loads
document.addEventListener('DOMContentLoaded', () => {
  testFirebaseConnection();
});
