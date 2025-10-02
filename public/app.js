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
  $scope.section = "instructions"; // 'instructions', 'stimuli', 'behavioral_description', 'endscreen'
  $scope.inst_id = 0;
  $scope.stim_id = 0;
  $scope.part_id = 0;
  $scope.questionsVisible = false;
  $scope.show_repeat_warning = false;
  $scope.form = { behavioralDescription: "" };
  $scope.isTrial = false;
  $scope.active_stimuli_set = [];
  // End-of-study forms
  $scope.demographics = { age: null, gender: null, genderSelfDescribe: '' };
  $scope.feedback = { text: '', clarity: null };

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

  // --- Top Goals Data and Helpers ---
  $scope.initGoalOptions = function() {
    const lmMeta = [
      { id: 'lm0', name: 'blue', img: 'data/entities/lm0.png' },
      { id: 'lm1', name: 'green', img: 'data/entities/lm1.png' },
      { id: 'lm2', name: 'red', img: 'data/entities/lm2.png' },
      { id: 'lm3', name: 'yellow', img: 'data/entities/lm3.png' }
    ];
    const itemMeta = [
      { id: 'item0', name: 'blue object', img: 'data/entities/item0.png' },
      { id: 'item1', name: 'pink object', img: 'data/entities/item1.png' }
    ];

    $scope.goalOptions = {
      categories: [
        { id: 'physical', label: 'Physical goal' },
        { id: 'social', label: 'Social goal' }
      ],
      physical_go_to: lmMeta.map(meta => ({
        id: `go_to_${meta.id}`,
        label: `Go to ${meta.name} landmark`,
        lmImg: meta.img
      })),
      physical_move_object: [].concat(...itemMeta.map(item => (
        lmMeta.map(lm => ({
          id: `${item.id}_to_${lm.id}`,
          label: `Move ${item.name} to ${lm.name} landmark`,
          itemImg: item.img,
          lmImg: lm.img
        }))
      ))),
      social: [
        { id: 'social_hinder', label: 'Hindering' },
        { id: 'social_neutral', label: 'Neutral' },
        { id: 'social_help', label: 'Helping' }
      ]
    };
  };

  $scope.initTopGoals = function() {
    const buildRows = function() {
      return new Array(3).fill(0).map(function() {
        return {
          category: null, // 'physical' | 'social'
          optionId: null, // e.g., 'go_to_lm0', 'item0_to_lm1', 'social_help'
          optionLabel: null,
          weight: 50,
          openA: false,
          openB: false
        };
      });
    };
    $scope.topGoalsAgent0 = buildRows();
    $scope.topGoalsAgent1 = buildRows();
  };

  $scope.toggleDropdown = function(row, which) {
    if (!row) return;
    if (which === 'A') {
      row.openA = !row.openA;
      row.openB = false;
    } else {
      if (!row.category) return;
      row.openB = !row.openB;
      row.openA = false;
    }
  };

  $scope.closeAllDropdowns = function() {
    ([$scope.topGoalsAgent0 || [], $scope.topGoalsAgent1 || []]).forEach(function(list) {
      list.forEach(function(r) { r.openA = false; r.openB = false; });
    });
  };

  $scope.selectCategory = function(row, category) {
    if (!row) return;
    row.category = category;
    row.optionId = null;
    row.optionLabel = null;
    row.openA = false;
    row.openB = true; // open next dropdown automatically
    $scope.updateGoalSelectionsAnswered();
  };

  $scope.selectOption = function(row, option) {
    if (!row || !option) return;
    row.optionId = option.id;
    row.optionLabel = option.label;
    row.openB = false;
    $scope.updateGoalSelectionsAnswered();
  };

  $scope.updateGoalSelectionsAnswered = function() {
    const redCount = ($scope.topGoalsAgent0 || []).filter(function(r) { return !!r.category && !!r.optionId; }).length;
    const greenCount = ($scope.topGoalsAgent1 || []).filter(function(r) { return !!r.category && !!r.optionId; }).length;
    const redSelected = redCount >= 3;
    const greenSelected = greenCount >= 3;
    if ($scope.response && $scope.response.answered) {
      $scope.response.answered.goal_selections_agent0 = redSelected;
      $scope.response.answered.goal_selections_agent1 = greenSelected;
      $scope.updateAnsweredCount();
    }
  };

  $scope.onGoalWeightChange = function() {
    $scope.updateGoalSelectionsAnswered();
  };

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
        $scope.inst_id = 9;
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
          $scope.inst_id = 10;
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
          $scope.inst_id = 11;
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
          $scope.inst_id = 12;
      $scope.show_repeat_warning = false;
    } else {
      $scope.show_repeat_warning = true;
          $scope.inst_id = 6; // Back to Strength section
      }
  };

  $scope.startMainExperiment = function() {
      $scope.section = 'stimuli';
      // Ensure indices reset when entering main experiment
      $scope.isTrial = false;
      $scope.stim_id = 0;
      $scope.part_id = 0;
      $scope.questionsVisible = false;
      $scope.reset_response();
      
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
      // Red Agent (agent0) physical goal - combined options
      agent0_goal_go_to_lm0: 50,
      agent0_goal_go_to_lm1: 50,
      agent0_goal_go_to_lm2: 50,
      agent0_goal_go_to_lm3: 50,
      agent0_goal_item0_to_lm0: 50,
      agent0_goal_item0_to_lm1: 50,
      agent0_goal_item0_to_lm2: 50,
      agent0_goal_item0_to_lm3: 50,
      agent0_goal_item1_to_lm0: 50,
      agent0_goal_item1_to_lm1: 50,
      agent0_goal_item1_to_lm2: 50,
      agent0_goal_item1_to_lm3: 50,
      agent0_goal_no_physical: 50,
      agent0_social_goal: 50, // Default to neutral
      
      // Green Agent (agent1) goals
      agent1_goal_go_to_lm0: 50,
      agent1_goal_go_to_lm1: 50,
      agent1_goal_go_to_lm2: 50,
      agent1_goal_go_to_lm3: 50,
      agent1_goal_item0_to_lm0: 50,
      agent1_goal_item0_to_lm1: 50,
      agent1_goal_item0_to_lm2: 50,
      agent1_goal_item0_to_lm3: 50,
      agent1_goal_item1_to_lm0: 50,
      agent1_goal_item1_to_lm1: 50,
      agent1_goal_item1_to_lm2: 50,
      agent1_goal_item1_to_lm3: 50,
      agent1_goal_no_physical: 50,
      agent1_social_goal: 50, // Default to neutral
      
      // Overall ratings
      relationship: 50, // Default to neutral
      
      // Tracking variables for completion
      answered: {
        // New gating: red selections + green selections + relationship
        goal_selections_agent0: false,
        goal_selections_agent1: false,
        relationship: false
      }
    };
    $scope.answeredCount = 0;
    console.log("DEBUG: response set to:", $scope.response);
    console.log("DEBUG: answered flags:", $scope.response.answered);
    // Initialize Top Goals structures
    if (!$scope.goalOptions) { $scope.initGoalOptions(); }
    $scope.initTopGoals();
  };

  // Recompute answered count
  $scope.totalRequired = 3; // red selections, green selections, relationship
  $scope.updateAnsweredCount = function() {
    if (!$scope.response || !$scope.response.answered) { $scope.answeredCount = 0; return; }
    const a = $scope.response.answered;
    let count = 0;
    count += a.goal_selections_agent0 ? 1 : 0;
    count += a.goal_selections_agent1 ? 1 : 0;
    count += a.relationship ? 1 : 0;
    $scope.answeredCount = count;
  };

  $scope.init = function() {
    console.log("=== NEW APP.JS VERSION 1.0.1 LOADED ===");
    fetch('stimuli/stimuli.json')
      .then(response => response.json())
      .then(data => {
        $scope.stimuli_set = data;
        $scope.active_stimuli_set = $scope.stimuli_set;
        $scope.$apply();
      }).catch(error => console.error("Error loading stimuli:", error));
    // Prepare goal options and reset response
    $scope.initGoalOptions();
    $scope.reset_response();
  };

  // Function to mark a question category as answered
  $scope.markAnswered = function(category) {
    console.log(`DEBUG: markAnswered called with category: ${category}`);
    if ($scope.response && $scope.response.answered) {
      $scope.response.answered[category] = true;
      $scope.updateAnsweredCount();
      console.log(`Marked ${category} as answered`);
      console.log("Current answered status:", $scope.response.answered);
    } else {
      console.error("ERROR: Cannot mark answered - response or answered object missing");
    }
  };

  // Helper to mark an individual slider element as interacted (for styling)
  $scope.markSliderElementInteracted = function($event) {
    try {
      const el = $event && $event.target;
      if (el && el.classList) {
        el.classList.add('slider-interacted');
      }
    } catch (e) {
      console.warn('Could not mark slider as interacted:', e);
    }
  };
  
  $scope.startSegmentPlayback = function() {
    // Ensure we're in the correct section and DOM is ready
    if ($scope.section !== 'stimuli') { return; }
    const video = document.getElementById('stimuliVideo');
    if (!video) {
        // DOM not ready yet; try again shortly only if still in stimuli
        $timeout($scope.startSegmentPlayback, 100);
        return;
    }
    if (!$scope.active_stimuli_set[$scope.stim_id] || !$scope.active_stimuli_set[$scope.stim_id].segments[$scope.part_id]) {
        console.error("Stimulus or segment not found!", $scope.stim_id, $scope.part_id);
        return;
    }
    const segment = $scope.active_stimuli_set[$scope.stim_id].segments[$scope.part_id];
    
    video.currentTime = segment.start;
    video.play();

    const checkTime = function() {
      if (video.currentTime >= segment.end) {
        video.pause();
        video.removeEventListener('timeupdate', checkTime);
        $scope.$apply(() => { $scope.questionsVisible = true; });
        // After questions are shown, bind an input listener to all sliders once
        $timeout(() => {
          try {
            const sliders = document.querySelectorAll('.goal-slider');
            sliders.forEach((el) => {
              if (!el.dataset.boundInteraction) {
                el.addEventListener('input', function() { this.classList.add('slider-interacted'); });
                el.dataset.boundInteraction = '1';
              }
            });
          } catch (e) {
            console.warn('Unable to bind slider interaction listeners:', e);
          }
        }, 0);
      }
    };
    // Ensure no old listeners are attached
    video.removeEventListener('timeupdate', video.timeUpdateHandler);
    video.timeUpdateHandler = checkTime;
    video.addEventListener('timeupdate', video.timeUpdateHandler);
  };
  
  $scope.replayCurrentSegment = function() {
      const video = document.getElementById('stimuliVideo');
      video.pause();
      // Use timeout to ensure UI updates before playback starts
      $timeout(() => {
        $scope.startSegmentPlayback();
      }, 100);
  };

  $scope.advance_stimuli = function() {
    try {
      // Store response to Firebase
      const collection = $scope.isTrial ? 'trial' : 'results';
      const path = `/${$scope.user_id}/${$scope.active_stimuli_set[$scope.stim_id].name}/segment_${$scope.part_id}`;
      const setData = getFirebaseSet();
      const ref = getFirebaseRef();
      const database = getFirebaseDatabase();
      
      const serializeRows = function(rows) {
        return (rows || []).filter(function(r) { return !!r.optionId; }).map(function(r) {
          return { category: r.category, optionId: r.optionId, label: r.optionLabel, weight: Number(r.weight) };
        });
      };
      const payload = {
        topGoalsAgent0: serializeRows($scope.topGoalsAgent0),
        topGoalsAgent1: serializeRows($scope.topGoalsAgent1),
        relationship: $scope.response.relationship,
        video: ($scope.active_stimuli_set && $scope.active_stimuli_set[$scope.stim_id] ? $scope.active_stimuli_set[$scope.stim_id].video : null),
        timestamp: Date.now()
      };
      setData(ref(database, `${collection}${path}`), payload)
        .then(() => {
          console.log("Data saved to Firebase successfully");
        })
        .catch((error) => {
          console.error("Error saving to Firebase:", error);
        });
      
      $scope.reset_response();
      $scope.questionsVisible = false;

      const currentStim = $scope.active_stimuli_set[$scope.stim_id];
      if ($scope.part_id < currentStim.segments.length - 1) {
        $scope.part_id++;
    } else {
        if ($scope.isTrial) {
          // End trial and proceed to Quiz 1
          $scope.section = 'instructions';
          $scope.inst_id = 8; // Quiz 1 screen
          $scope.isTrial = false;
          $scope.part_id = 0;
          $scope.active_stimuli_set = $scope.stimuli_set;
        } else {
          // All segments completed - go to behavioral description
          $scope.section = 'behavioral_description';
          if (!$scope.form) { $scope.form = {}; }
          $scope.form.behavioralDescription = ""; // Reset description
        }
      }

      if ($scope.stim_id >= $scope.active_stimuli_set.length) {
        $scope.section = 'endscreen';
      } else {
        $timeout($scope.startSegmentPlayback, 100);
      }
    } catch (error) {
      console.error("Firebase error:", error);
      // Continue with the experiment even if Firebase fails
      $scope.reset_response();
      $scope.questionsVisible = false;

      const currentStim = $scope.active_stimuli_set[$scope.stim_id];
      if ($scope.part_id < currentStim.segments.length - 1) {
        $scope.part_id++;
      } else {
        if ($scope.isTrial) {
          $scope.section = 'instructions';
          $scope.inst_id = 8; // Quiz 1 screen
          $scope.isTrial = false;
          $scope.active_stimuli_set = $scope.stimuli_set;
        } else {
          $scope.section = 'behavioral_description';
          if (!$scope.form) { $scope.form = {}; }
          $scope.form.behavioralDescription = ""; // Reset description
        }
      }

      if ($scope.stim_id >= $scope.active_stimuli_set.length) {
        $scope.section = 'endscreen';
      } else {
        $timeout($scope.startSegmentPlayback, 100);
      }
    }
  };

  $scope.submitBehavioralDescription = function() {
    if (!($scope.form && $scope.form.behavioralDescription)) {
      alert("Please provide a description.");
      return;
    }

    try {
      const setData = getFirebaseSet();
      const ref = getFirebaseRef();
      const database = getFirebaseDatabase();
      const currentStim = ($scope.active_stimuli_set && $scope.active_stimuli_set[$scope.stim_id]) || null;
      const videoName = currentStim ? currentStim.name : `video_${$scope.stim_id}`;
      
      // Store description under the current video's path
      setData(ref(database, `results/${$scope.user_id}/${videoName}/behavioral_description`), {
        description: $scope.form.behavioralDescription,
        timestamp: Date.now()
      }).then(() => {
        console.log("Behavioral description saved to Firebase successfully");
        $scope.$applyAsync(function() {
          // Proceed to next video or finish
          if ($scope.stim_id < ($scope.active_stimuli_set?.length || 0) - 1) {
            $scope.stim_id += 1;
            $scope.part_id = 0;
            $scope.questionsVisible = false;
            $scope.reset_response();
            $scope.section = 'stimuli';
            $timeout($scope.startSegmentPlayback, 300);
          } else {
            // Go to demographics after the last video
            $scope.section = 'demographics';
          }
        });
      }).catch((error) => {
        console.error("Error saving behavioral description to Firebase:", error);
      });
    } catch (error) {
      console.error("Firebase error in submitBehavioralDescription:", error);
    }
  };

  // ======================
  // Demographics & Feedback
  // ======================
  $scope.isValidAge = function(age) {
    if (age === null || age === undefined) { return false; }
    const n = Number(age);
    return Number.isInteger(n) && n >= 18 && n <= 100;
  };

  $scope.isValidDemographics = function() {
    const hasValidAge = $scope.isValidAge($scope.demographics.age);
    const gender = $scope.demographics.gender;
    const genderOk = !!gender && (gender !== 'self_describe' || ($scope.demographics.genderSelfDescribe && $scope.demographics.genderSelfDescribe.trim() !== ''));
    return hasValidAge && genderOk;
  };

  $scope.submitDemographics = function() {
    if (!$scope.isValidDemographics()) {
      alert('Please complete age (18-100) and gender. If self-describe, please fill the text.');
      return;
    }
    try {
      const setData = getFirebaseSet();
      const ref = getFirebaseRef();
      const database = getFirebaseDatabase();
      const payload = {
        participantId: $scope.user_id,
        timestamp: Date.now(),
        age: Number($scope.demographics.age),
        gender: $scope.demographics.gender
      };
      if ($scope.demographics.gender === 'self_describe') {
        payload.genderSelfDescribe = $scope.demographics.genderSelfDescribe;
      }
      setData(ref(database, `results/${$scope.user_id}/demographics`), payload).then(function() {
        $scope.$applyAsync(function() { $scope.section = 'feedback'; });
      }).catch(function(err) { console.error('Error saving demographics:', err); });
    } catch (e) {
      console.error('Firebase error in submitDemographics:', e);
    }
  };

  $scope.submitFeedback = function() {
    try {
      const setData = getFirebaseSet();
      const ref = getFirebaseRef();
      const database = getFirebaseDatabase();
      const payload = {
        participantId: $scope.user_id,
        timestamp: Date.now(),
        text: $scope.feedback.text || ''
      };
      if ($scope.feedback.clarity !== null && $scope.feedback.clarity !== undefined) {
        payload.clarity = Number($scope.feedback.clarity);
      }
      setData(ref(database, `results/${$scope.user_id}/feedback`), payload).then(function() {
        $scope.$applyAsync(function() { $scope.section = 'endscreen'; });
      }).catch(function(err) { console.error('Error saving feedback:', err); });
    } catch (e) {
      console.error('Firebase error in submitFeedback:', e);
    }
  };

  $scope.hasMoreSegments = function() {
    if (!$scope.active_stimuli_set[$scope.stim_id]) return false;
    return $scope.part_id < $scope.active_stimuli_set[$scope.stim_id].segments.length - 1;
  };

  $scope.startTrialRun = function() {
    // Pick a simple 2-3 segment stimulus (e.g., 'helping')
    const pickName = 'helping_1';
    const stim = ($scope.stimuli_set || []).find(s => s.name === pickName) || $scope.stimuli_set[0];
    if (!stim) { alert('Trial stimulus not found.'); return; }
    $scope.isTrial = true;
    $scope.active_stimuli_set = [stim];
    $scope.stim_id = 0;
    $scope.part_id = 0;
    $scope.section = 'stimuli';
    $scope.questionsVisible = false;
    $scope.reset_response();
    $timeout($scope.startSegmentPlayback, 500);
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
      const allAnswered = $scope.response.answered.goal_selections_agent0 && 
                         $scope.response.answered.goal_selections_agent1 &&
                         $scope.response.answered.relationship;
      
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