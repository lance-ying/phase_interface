// Firebase configuration and initialization
// Note: Firebase is initialized in the HTML file and made available globally

// Get Firebase references
const getFirebaseRef = () => {
  if (window.firebaseRef && window.firebaseDatabase) {
    return window.firebaseRef;
  }
  throw new Error("Firebase not initialized");
};

const getFirebaseSet = () => {
  if (window.firebaseSet) {
    return window.firebaseSet;
  }
  throw new Error("Firebase not initialized");
};

const getFirebaseDatabase = () => {
  if (window.firebaseDatabase) {
    return window.firebaseDatabase;
  }
  throw new Error("Firebase not initialized");
};

var experimentApp = angular.module('experimentApp', ['ngSanitize']);

experimentApp.controller('ExperimentController', function ExperimentController($scope, $timeout, $location) {
  $scope.user_id = Date.now();

  // --- State Management ---
  $scope.section = "instructions"; // 'instructions', 'stimuli', 'endscreen'
  $scope.inst_id = 0;
  $scope.stim_id = 0;
  $scope.part_id = 0;
  $scope.questionsVisible = false;
  $scope.show_repeat_warning = false;

  // --- Quiz Data ---
  $scope.quiz = {
    quiz1_see: null, quiz1_touch: null, quiz2: null, quiz3: null, quiz4: null
  };
  $scope.quiz_answers = {
    quiz1_see: "no",
    quiz1_touch: "yes",
    quiz2: "lm0",
    quiz3: "help",
    quiz4: "agent1" 
  };

  // --- Experiment Data ---
  $scope.stimuli_set = [];
  $scope.response = {};

  // --- Merged Tutorial and Quiz Logic ---
  // This function handles the simple "Next" for tutorial pages (0-6)
  $scope.advance_tutorial = function() {
    if ($scope.inst_id <= 6) {
        $scope.inst_id++;
    }
  };

  // These functions handle the quizzes with their specific logic
  $scope.submitQuiz1 = function() {
    if (!$scope.quiz.quiz1_see || !$scope.quiz.quiz1_touch) {
        alert("Please answer both questions.");
      return;
    }
    const correct = $scope.quiz.quiz1_see === $scope.quiz_answers.quiz1_see && $scope.quiz.quiz1_touch === $scope.quiz_answers.quiz1_touch;
    
    // Store quiz results to Firebase
    try {
      const setData = getFirebaseSet();
      const ref = getFirebaseRef();
      const database = getFirebaseDatabase();
      
      setData(ref(database, `results/${$scope.user_id}/quiz1`), {
        quiz1_see: $scope.quiz.quiz1_see,
        quiz1_touch: $scope.quiz.quiz1_touch,
        correct: correct,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error saving quiz1 to Firebase:", error);
    }

    if (correct) {
        $scope.inst_id = 8;
      $scope.show_repeat_warning = false;
    } else {
      $scope.show_repeat_warning = true;
        $scope.inst_id = 3; // Back to Knowledge section
    }
  };

  $scope.submitQuiz2 = function() {
      if (!$scope.quiz.quiz2) { alert("Please answer the question."); return; }
      const correct = $scope.quiz.quiz2 === $scope.quiz_answers.quiz2;
      
      // Store quiz results to Firebase
      try {
        const setData = getFirebaseSet();
        const ref = getFirebaseRef();
        const database = getFirebaseDatabase();
        
        setData(ref(database, `results/${$scope.user_id}/quiz2`), {
          quiz2: $scope.quiz.quiz2,
          correct: correct,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error("Error saving quiz2 to Firebase:", error);
      }
      
      if (correct) {
          $scope.inst_id = 9;
      $scope.show_repeat_warning = false;
    } else {
      $scope.show_repeat_warning = true;
          $scope.inst_id = 4; // Back to Goals section
    }
  };

  $scope.submitQuiz3 = function() {
      if (!$scope.quiz.quiz3) { alert("Please answer the question."); return; }
      const correct = $scope.quiz.quiz3 === $scope.quiz_answers.quiz3;
      
      // Store quiz results to Firebase
      try {
        const setData = getFirebaseSet();
        const ref = getFirebaseRef();
        const database = getFirebaseDatabase();
        
        setData(ref(database, `results/${$scope.user_id}/quiz3`), {
          quiz3: $scope.quiz.quiz3,
          correct: correct,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error("Error saving quiz3 to Firebase:", error);
      }
      
      if (correct) {
          $scope.inst_id = 10;
      $scope.show_repeat_warning = false;
    } else {
      $scope.show_repeat_warning = true;
          $scope.inst_id = 5; // Back to Relations section
    }
  };

  $scope.submitQuiz4 = function() {
      if (!$scope.quiz.quiz4) { alert("Please answer the question."); return; }
      const correct = $scope.quiz.quiz4 === $scope.quiz_answers.quiz4;
      
      // Store quiz results to Firebase
      try {
        const setData = getFirebaseSet();
        const ref = getFirebaseRef();
        const database = getFirebaseDatabase();
        
        setData(ref(database, `results/${$scope.user_id}/quiz4`), {
          quiz4: $scope.quiz.quiz4,
          correct: correct,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error("Error saving quiz4 to Firebase:", error);
      }
      
      if (correct) {
          $scope.inst_id = 11;
      $scope.show_repeat_warning = false;
    } else {
      $scope.show_repeat_warning = true;
          $scope.inst_id = 6; // Back to Strength section
      }
  };

  $scope.startMainExperiment = function() {
      $scope.section = 'stimuli';
      
      // Store experiment start data to Firebase
      try {
        const setData = getFirebaseSet();
        const ref = getFirebaseRef();
        const database = getFirebaseDatabase();
        
        setData(ref(database, `results/${$scope.user_id}/experiment_start`), {
          timestamp: Date.now(),
          user_id: $scope.user_id
        }).then(() => {
          console.log("Experiment start data saved to Firebase successfully");
        }).catch((error) => {
          console.error("Error saving experiment start to Firebase:", error);
        });
      } catch (error) {
        console.error("Firebase error in startMainExperiment:", error);
      }
      
      $timeout($scope.startSegmentPlayback, 500); // Wait for UI to update
  };

  // --- Experiment Logic (Two-Panel Version) ---
  $scope.reset_response = function() {
    console.log("DEBUG: reset_response called");
    $scope.response = {
      // Red Agent (agent0) goals
      agent0_landmark_goal: 0,
      agent0_lm0_certainty: 0, agent0_lm1_certainty: 0, agent0_lm2_certainty: 0, agent0_lm3_certainty: 0,
      agent0_object_goal: 0,
      agent0_item0_certainty: 0, agent0_item1_certainty: 0,
      agent0_social_goal: 50, // Default to neutral
      
      // Green Agent (agent1) goals
      agent1_landmark_goal: 0,
      agent1_lm0_certainty: 0, agent1_lm1_certainty: 0, agent1_lm2_certainty: 0, agent1_lm3_certainty: 0,
      agent1_object_goal: 0,
      agent1_item0_certainty: 0, agent1_item1_certainty: 0,
      agent1_social_goal: 50, // Default to neutral
      
      // Overall ratings
      relationship: 50, // Default to neutral
      realism: 50, // Default to neutral
      
      // Tracking variables for completion
      answered: {
        agent0_landmark: false,
        agent0_object: false,
        agent0_social: false,
        agent1_landmark: false,
        agent1_object: false,
        agent1_social: false,
        relationship: false,
        realism: false
      }
    };
    console.log("DEBUG: response set to:", $scope.response);
    console.log("DEBUG: answered flags:", $scope.response.answered);
  };

  $scope.init = function() {
    console.log("=== NEW APP.JS VERSION 1.0.1 LOADED ===");
    fetch('stimuli/stimuli.json')
      .then(response => response.json())
      .then(data => {
        $scope.stimuli_set = data;
        $scope.$apply();
      }).catch(error => console.error("Error loading stimuli:", error));
    $scope.reset_response();
  };

  // Function to mark a question category as answered
  $scope.markAnswered = function(category) {
    console.log(`DEBUG: markAnswered called with category: ${category}`);
    if ($scope.response && $scope.response.answered) {
      $scope.response.answered[category] = true;
      console.log(`Marked ${category} as answered`);
      console.log("Current answered status:", $scope.response.answered);
    } else {
      console.error("ERROR: Cannot mark answered - response or answered object missing");
    }
  };
  
  $scope.startSegmentPlayback = function() {
    const video = document.getElementById('stimuliVideo');
    if (!$scope.stimuli_set[$scope.stim_id] || !$scope.stimuli_set[$scope.stim_id].segments[$scope.part_id]) {
        console.error("Stimulus or segment not found!", $scope.stim_id, $scope.part_id);
        return;
    }
    const segment = $scope.stimuli_set[$scope.stim_id].segments[$scope.part_id];
    
    video.currentTime = segment.start;
    video.play();

    const checkTime = function() {
      if (video.currentTime >= segment.end) {
        video.pause();
        video.removeEventListener('timeupdate', checkTime);
        $scope.$apply(() => { $scope.questionsVisible = true; });
      }
    };
    // Ensure no old listeners are attached
    video.removeEventListener('timeupdate', video.timeUpdateHandler);
    video.timeUpdateHandler = checkTime;
    video.addEventListener('timeupdate', video.timeUpdateHandler);
  };
  
  $scope.replayCurrentSegment = function() {
      const video = document.getElementById('stimuliVideo');
      $scope.questionsVisible = false;
      video.pause();
      // Use timeout to ensure UI updates before playback starts
      $timeout(() => {
        $scope.startSegmentPlayback();
      }, 100);
  };

  $scope.advance_stimuli = function() {
    try {
      // Store response to Firebase
      const path = `/${$scope.user_id}/${$scope.stimuli_set[$scope.stim_id].name}/segment_${$scope.part_id}`;
      const setData = getFirebaseSet();
      const ref = getFirebaseRef();
      const database = getFirebaseDatabase();
      
      setData(ref(database, `results${path}`), $scope.response)
        .then(() => {
          console.log("Data saved to Firebase successfully");
        })
        .catch((error) => {
          console.error("Error saving to Firebase:", error);
        });
      
      $scope.reset_response();
      $scope.questionsVisible = false;

      const currentStim = $scope.stimuli_set[$scope.stim_id];
      if ($scope.part_id < currentStim.segments.length - 1) {
        $scope.part_id++;
    } else {
        $scope.part_id = 0;
        $scope.stim_id++;
      }

      if ($scope.stim_id >= $scope.stimuli_set.length) {
        $scope.section = 'endscreen';
      } else {
        $timeout($scope.startSegmentPlayback, 100);
      }
    } catch (error) {
      console.error("Firebase error:", error);
      // Continue with the experiment even if Firebase fails
      $scope.reset_response();
      $scope.questionsVisible = false;

      const currentStim = $scope.stimuli_set[$scope.stim_id];
      if ($scope.part_id < currentStim.segments.length - 1) {
        $scope.part_id++;
      } else {
        $scope.part_id = 0;
        $scope.stim_id++;
      }

      if ($scope.stim_id >= $scope.stimuli_set.length) {
        $scope.section = 'endscreen';
      } else {
        $timeout($scope.startSegmentPlayback, 100);
      }
    }
  };

  $scope.hasMoreSegments = function() {
    if (!$scope.stimuli_set[$scope.stim_id]) return false;
    return $scope.part_id < $scope.stimuli_set[$scope.stim_id].segments.length - 1;
  };
  
  // ==========================================================
  // === DEBUGGING FUNCTION START =============================
  // ==========================================================
  $scope.canProceed = function() {
      console.log("=== NEW canProceed function called ===");
      console.log("--- Checking canProceed ---");
      if (!$scope.response || !$scope.response.answered) {
          console.error("FAIL: $scope.response or answered object does not exist.");
          console.error("response:", $scope.response);
          return false;
      }

      // Check if all required questions have been answered
      const allAnswered = $scope.response.answered.agent0_landmark && 
                         $scope.response.answered.agent0_object && 
                         $scope.response.answered.agent0_social && 
                         $scope.response.answered.agent1_landmark && 
                         $scope.response.answered.agent1_object && 
                         $scope.response.answered.agent1_social && 
                         $scope.response.answered.relationship && 
                         $scope.response.answered.realism;
      
      console.log("Answered status:", $scope.response.answered);
      console.log("All answered:", allAnswered);
      
      return allAnswered;
  };
  // ==========================================================
  // === DEBUGGING FUNCTION END ===============================
  // ==========================================================

  // Function to store completion data to Firebase
  $scope.storeCompletionData = function() {
    try {
      const setData = getFirebaseSet();
      const ref = getFirebaseRef();
      const database = getFirebaseDatabase();
      
      setData(ref(database, `results/${$scope.user_id}/completion`), {
        status: 'completed',
        timestamp: Date.now(),
        total_stimuli: $scope.stimuli_set.length,
        user_id: $scope.user_id
      }).then(() => {
        console.log("Completion data saved to Firebase successfully");
      }).catch((error) => {
        console.error("Error saving completion to Firebase:", error);
      });
    } catch (error) {
      console.error("Firebase error in storeCompletionData:", error);
    }
  };

  $scope.init();
  
  // Debug function - can be called from console
  window.debugResponse = function() {
    console.log("=== DEBUG RESPONSE ===");
    console.log("response object:", $scope.response);
    console.log("answered object:", $scope.response ? $scope.response.answered : 'undefined');
    console.log("canProceed():", $scope.canProceed());
    console.log("=====================");
  };
}); 