// Firebase configuration
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Get a reference to the database service
const root = firebase.database().ref();
const resultsRef = root.child("results");
const counterRef = root.child("counter");
const counterKey = "count";

var experimentApp = angular.module('experimentApp', ['ngSanitize']);
var start_time;

experimentApp.controller('ExperimentController', function ExperimentController($scope, $timeout, $location) {
  $scope.user_id = Date.now();

  // Experiment state
  $scope.section = "instructions";
  $scope.inst_id = 0;
  $scope.stim_id = 0;
  $scope.part_id = -1;
  $scope.videoEnded = false; // Track if current video segment has ended

  // Quiz responses - use a different approach to avoid scope issues
  $scope.quiz = {
    quiz1_see: null,
    quiz1_touch: null,
    quiz2: null,
    quiz3: null,
    quiz4: null
  };

  // Quiz validation
  $scope.show_repeat_warning = false;
  $scope.quiz_attempts = {
    quiz1: 0,
    quiz2: 0,
    quiz3: 0,
    quiz4: 0
  };

  // Response data
  $scope.response = {
    "goals": [false, false, false, false],
    "beliefs": [NaN, NaN, NaN],
    "belief_ids": [0, 1, 2],
    "social_rating": null
  };

  // Validation flags
  $scope.valid_goal = false;
  $scope.valid_belief = false;
  $scope.valid_social = false;

  // Stimulus data
  $scope.stimuli_set = [];
  $scope.belief_statements = [];
  $scope.belief_statement_ids = [];
  $scope.n_displayed_statements = 3;

  // Rating text for belief questions
  $scope.rating_text = [
    "Definitely False",
    "Probably False", 
    "Possibly False",
    "Even Chance",
    "Possibly True",
    "Probably True",
    "Definitely True"
  ];

  // Quiz answers (correct answers from the original tutorial)
  $scope.quiz_answers = {
    quiz1_see: "no",      // Green agent cannot see red agent
    quiz1_touch: "yes",   // Red agent knows where blue object is
    quiz2: "lm0",         // Red agent wants to get to lm0 (yellow landmark)
    quiz3: "help",        // Red agent wants to help green agent
    quiz4: "agent1"       // Green agent is stronger
  };

  // Individual quiz submit functions (matching original logic)
  $scope.submitQuiz1 = function() {
    console.log("submitQuiz1 called. quiz1_see =", $scope.quiz.quiz1_see, "quiz1_touch =", $scope.quiz.quiz1_touch);
    console.log("Full scope:", $scope);
    console.log("quiz1_see type:", typeof $scope.quiz.quiz1_see);
    console.log("quiz1_touch type:", typeof $scope.quiz.quiz1_touch);
    console.log("quiz1_see value:", $scope.quiz.quiz1_see);
    console.log("quiz1_touch value:", $scope.quiz.quiz1_touch);
    console.log("quiz1_see === null:", $scope.quiz.quiz1_see === null);
    console.log("quiz1_touch === null:", $scope.quiz.quiz1_touch === null);
    
    // Check if both questions are answered
    if (!$scope.quiz.quiz1_see || !$scope.quiz.quiz1_touch) {
      console.log("Missing answers detected. quiz1_see =", $scope.quiz.quiz1_see, "quiz1_touch =", $scope.quiz.quiz1_touch);
      alert("Please answer both questions");
      return;
    }

    // Check if answers are correct
    var correct = true;
    if ($scope.quiz.quiz1_see !== $scope.quiz_answers.quiz1_see || 
        $scope.quiz.quiz1_touch !== $scope.quiz_answers.quiz1_touch) {
      correct = false;
      $scope.quiz_attempts.quiz1++;
    }

    if (correct) {
      // Correct answers - advance to next quiz
      $scope.inst_id = 7;
      $scope.show_repeat_warning = false;
      console.log("Quiz 1 correct! Moving to Quiz 2");
    } else {
      // Wrong answers - show repeat warning and go back to instructions
      $scope.quiz_attempts.quiz1++;
      $scope.show_repeat_warning = true;
      $scope.inst_id = 2; // Go back to "Creatures - Knowledge about the environment"
      console.log("Quiz 1 wrong! Going back to tutorial section 2");
      $timeout(() => {
        $scope.show_repeat_warning = false;
      }, 5000);
    }
  };

  $scope.submitQuiz2 = function() {
    // Check if question is answered
    if (!$scope.quiz.quiz2) {
      alert("Please answer the question");
      return;
    }

    // Check if answer is correct
    if ($scope.quiz.quiz2 === $scope.quiz_answers.quiz2) {
      // Correct answer - advance to next quiz
      $scope.inst_id = 8;
      $scope.show_repeat_warning = false;
      console.log("Quiz 2 correct! Moving to Quiz 3");
    } else {
      // Wrong answer - show repeat warning and go back to instructions
      $scope.quiz_attempts.quiz2++;
      $scope.show_repeat_warning = true;
      $scope.inst_id = 3; // Go back to "Creatures - Goals"
      console.log("Quiz 2 wrong! Going back to tutorial section 3");
      $timeout(() => {
        $scope.show_repeat_warning = false;
      }, 5000);
    }
  };

  $scope.submitQuiz3 = function() {
    // Check if question is answered
    if (!$scope.quiz.quiz3) {
      alert("Please answer the question");
      return;
    }

    // Check if answer is correct
    if ($scope.quiz.quiz3 === $scope.quiz_answers.quiz3) {
      // Correct answer - advance to next quiz
      $scope.inst_id = 9;
      $scope.show_repeat_warning = false;
      console.log("Quiz 3 correct! Moving to Quiz 4");
    } else {
      // Wrong answer - show repeat warning and go back to instructions
      $scope.quiz_attempts.quiz3++;
      $scope.show_repeat_warning = true;
      $scope.inst_id = 4; // Go back to "Creatures - Relations"
      console.log("Quiz 3 wrong! Going back to tutorial section 4");
      $timeout(() => {
        $scope.show_repeat_warning = false;
      }, 5000);
    }
  };

  $scope.submitQuiz4 = function() {
    // Check if question is answered
    if (!$scope.quiz.quiz4) {
      alert("Please answer the question");
      return;
    }

    // Check if answer is correct
    if ($scope.quiz.quiz4 === $scope.quiz_answers.quiz4) {
      // Correct answer - advance to congratulations page
      $scope.inst_id = 10;
      $scope.show_repeat_warning = false;
      console.log("Quiz 4 correct! Moving to congratulations page");
    } else {
      // Wrong answer - show repeat warning and go back to instructions
      $scope.quiz_attempts.quiz4++;
      $scope.show_repeat_warning = true;
      $scope.inst_id = 5; // Go back to "Creatures - Strength"
      console.log("Quiz 4 wrong! Going back to tutorial section 5");
      $timeout(() => {
        $scope.show_repeat_warning = false;
      }, 5000);
    }
  };

  // Function to start the main experiment from the congratulations page
  $scope.startMainExperiment = function() {
    console.log("Starting main experiment from congratulations page");
    $scope.section = "stimuli";
    $scope.stim_id = 0;
    $scope.part_id = 0; // Start with first segment immediately
    $scope.videoEnded = false; // Initialize video ended state
    
    // Set belief statements for first stimulus
    $scope.set_belief_statements(0);
    
    // Get time of first stimulus
    if (start_time == undefined) {
      start_time = (new Date()).getTime();
    }
    
    console.log("Main experiment started - stim_id:", $scope.stim_id, "part_id:", $scope.part_id);
    console.log("Belief statements set:", $scope.belief_statements);
  };

  $scope.log = function(...args) {
    if ($location.search().debug == "true") {
      console.log(...args);
    }
  }

  $scope.store_to_db = function(key, val) {
    $scope.log("Storing " + key + " with " + JSON.stringify(val));
    if ($location.search().local != "true") {
      resultsRef.child(key).set(val);
    }
  }

  $scope.get_counter = async function () {
    if ($location.search().local == "true") {
      return Math.floor(Math.random() * 1000);
    } else {
      return counterRef.child(counterKey).once("value", function (snapshot) {
        $scope.user_count = snapshot.val();
      }).then(() => { return $scope.user_count; });
    }
  }
  
  $scope.increment_counter = function() {
    if ($location.search().local == "true") {
      return;
    } else {
      counterRef.child(counterKey).set($scope.user_count + 1);
    }
  }

  // Load stimuli data with video segmentation
  $scope.loadStimuli = function() {
    // Try to load from stimuli.json first
    fetch('stimuli/stimuli.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        $scope.stimuli_set = data;
        $scope.log("Loaded " + $scope.stimuli_set.length + " stimuli with segments");
        $scope.$apply(); // Ensure Angular updates the view
      })
      .catch(error => {
        console.warn("Could not load stimuli.json, using fallback data:", error.message);
        // Fallback to hardcoded stimuli with actual video files
        $scope.stimuli_set = [
          {
            "name": "chasing",
            "video": "stimuli/chasing.mp4",
            "category": "competition",
            "description": "One agent chasing another agent",
            "segments": [
              { video: "stimuli/chasing.mp4", time: 1, description: "Chase begins", start: 0, end: 1 },
              { video: "stimuli/chasing.mp4", time: 2, description: "Chase continues", start: 1, end: 2 },
              { video: "stimuli/chasing.mp4", time: 3, description: "Chase resolution", start: 2, end: 3 }
            ],
            "times": [1, 2, 3],
            "length": 3,
            "goal": 2,
            "statements": [
              "The red agent believes the green agent is trying to escape.",
              "The green agent thinks the red agent is pursuing them.",
              "Both agents believe they are in a chase scenario."
            ]
          },
          {
            "name": "fighting",
            "video": "stimuli/fighting.mp4",
            "category": "competition",
            "description": "Two agents engaged in physical conflict",
            "segments": [
              { video: "stimuli/fighting.mp4", time: 1, description: "Conflict initiation", start: 0, end: 1 },
              { video: "stimuli/fighting.mp4", time: 2, description: "Fight escalates", start: 1, end: 2 },
              { video: "stimuli/fighting.mp4", time: 3, description: "Fight resolution", start: 2, end: 3 }
            ],
            "times": [1, 2, 3],
            "length": 3,
            "goal": 2,
            "statements": [
              "The red agent believes the green agent is hostile.",
              "The green agent thinks the red agent is aggressive.",
              "Both agents believe they must defend themselves."
            ]
          },
          {
            "name": "helping_physically_2",
            "video": "stimuli/helping_physically_2.mp4",
            "category": "helping",
            "description": "One agent physically helping another achieve a goal",
            "segments": [
              { video: "stimuli/helping_physically_2.mp4", time: 9, description: "Recognition of need" },
              { video: "stimuli/helping_physically_2.mp4", time: 19, description: "Physical assistance" },
              { video: "stimuli/helping_physically_2.mp4", time: 29, description: "Goal achievement" }
            ],
            "times": [9, 19, 29],
            "length": 3,
            "goal": 3,
            "statements": [
              "The red agent believes the green agent needs help.",
              "The green agent thinks the red agent is supportive.",
              "Both agents believe in cooperation."
            ]
          },
          {
            "name": "attacking",
            "video": "stimuli/attacking.mp4",
            "category": "hindering",
            "description": "One agent actively attacking another",
            "segments": [
              { video: "stimuli/attacking.mp4", time: 6, description: "Attack preparation" },
              { video: "stimuli/attacking.mp4", time: 16, description: "Attack execution" },
              { video: "stimuli/attacking.mp4", time: 26, description: "Attack completion" }
            ],
            "times": [6, 16, 26],
            "length": 3,
            "goal": 4,
            "statements": [
              "The red agent believes the green agent is vulnerable.",
              "The green agent thinks the red agent is dangerous.",
              "Both agents believe they are in a hostile situation."
            ]
          },
          {
            "name": "hiding",
            "video": "stimuli/hiding.mp4",
            "category": "neutral",
            "description": "One agent hiding from another",
            "segments": [
              { video: "stimuli/hiding.mp4", time: 5, description: "Hiding behavior" },
              { video: "stimuli/hiding.mp4", time: 15, description: "Hiding continues" },
              { video: "stimuli/hiding.mp4", time: 25, description: "Hiding outcome" }
            ],
            "times": [5, 15, 25],
            "length": 3,
            "goal": 1,
            "statements": [
              "The red agent believes the green agent is searching.",
              "The green agent thinks the red agent is hidden.",
              "Both agents believe they are in a hide-and-seek scenario."
            ]
          },
          {
            "name": "stealing",
            "video": "stimuli/stealing.mp4",
            "category": "hindering",
            "description": "One agent taking something from another",
            "segments": [
              { video: "stimuli/stealing.mp4", time: 6, description: "Theft attempt" },
              { video: "stimuli/stealing.mp4", time: 16, description: "Theft execution" },
              { video: "stimuli/stealing.mp4", time: 26, description: "Theft completion" }
            ],
            "times": [6, 16, 26],
            "length": 3,
            "goal": 4,
            "statements": [
              "The red agent believes the green agent has something valuable.",
              "The green agent thinks the red agent is a thief.",
              "Both agents believe there is a conflict over resources."
            ]
          },
          {
            "name": "chasing3",
            "video": "stimuli/chasing3.mp4",
            "category": "competition",
            "description": "Extended chase scenario between agents",
            "segments": [
              { video: "stimuli/chasing3.mp4", time: 8, description: "Chase initiation" },
              { video: "stimuli/chasing3.mp4", time: 18, description: "Chase development" },
              { video: "stimuli/chasing3.mp4", time: 28, description: "Chase conclusion" }
            ],
            "times": [8, 18, 28],
            "length": 3,
            "goal": 2,
            "statements": [
              "The red agent believes the green agent is evading capture.",
              "The green agent thinks the red agent is persistent.",
              "Both agents believe they are in a competitive chase."
            ]
          },
          {
            "name": "teacher",
            "video": "stimuli/teacher.mp4",
            "category": "helping",
            "description": "One agent teaching or guiding another",
            "segments": [
              { video: "stimuli/teacher.mp4", time: 7, description: "Teaching begins" },
              { video: "stimuli/teacher.mp4", time: 17, description: "Learning process" },
              { video: "stimuli/teacher.mp4", time: 27, description: "Teaching completion" }
            ],
            "times": [7, 17, 27],
            "length": 3,
            "goal": 3,
            "statements": [
              "The red agent believes the green agent wants to learn.",
              "The green agent thinks the red agent is knowledgeable.",
              "Both agents believe in the value of education."
            ]
          },
          {
            "name": "blocking_1",
            "video": "stimuli/blocking_1.mp4",
            "category": "hindering",
            "description": "One agent blocking another's path or goal",
            "segments": [
              { video: "stimuli/blocking_1.mp4", time: 7, description: "Path obstruction" },
              { video: "stimuli/blocking_1.mp4", time: 17, description: "Blocking continues" },
              { video: "stimuli/blocking_1.mp4", time: 27, description: "Blocking resolution" }
            ],
            "times": [7, 17, 27],
            "length": 3,
            "goal": 4,
            "statements": [
              "The red agent believes the green agent wants to pass.",
              "The green agent thinks the red agent is obstructing.",
              "Both agents believe there is a conflict of interest."
            ]
          },
          {
            "name": "informing",
            "video": "stimuli/informing.mp4",
            "category": "helping",
            "description": "One agent providing information to another",
            "segments": [
              { video: "stimuli/informing.mp4", time: 9, description: "Information sharing" },
              { video: "stimuli/informing.mp4", time: 19, description: "Information processing" },
              { video: "stimuli/informing.mp4", time: 29, description: "Information utilization" }
            ],
            "times": [9, 19, 29],
            "length": 3,
            "goal": 3,
            "statements": [
              "The red agent believes the green agent needs information.",
              "The green agent thinks the red agent is helpful.",
              "Both agents believe in the importance of communication."
            ]
          }
        ];
        $scope.$apply(); // Ensure Angular updates the view
      });
  };

  // Set belief statements for current stimulus
  $scope.set_belief_statements = function(stim_id) {
    if ($scope.stimuli_set && $scope.stimuli_set[stim_id]) {
      const cur_stim = $scope.stimuli_set[stim_id];
      $scope.belief_statements = cur_stim.statements || [];
      $scope.belief_statement_ids = Array.from(Array($scope.belief_statements.length).keys());
      $scope.n_displayed_statements = $scope.belief_statements.length;
      $scope.log("Set belief statements for stimulus " + stim_id + ": " + $scope.belief_statements);
    }
  };

  // Reset response for new stimulus/segment
  $scope.reset_response = function () {
    $scope.response = {
      "goals": [false, false, false, false],
      "beliefs": Array($scope.n_displayed_statements).fill(NaN),
      "belief_ids": Array.from(Array($scope.n_displayed_statements).keys()),
      "social_rating": null
    };
  };

  // Check if can advance through instructions (only for tutorial sections, not quizzes)
  $scope.canAdvanceInstructions = function() {
    // Only allow advancement for tutorial sections (0-5), not for quizzes (6-9)
    var canAdvance = $scope.inst_id < 6;
    console.log("canAdvanceInstructions called: inst_id =", $scope.inst_id, "canAdvance =", canAdvance);
    return canAdvance;
  };

  // Validation functions for experiment questions
  $scope.validate_goal = function() {
    $scope.valid_goal = $scope.response.goals.some(goal => goal === true);
  }

  $scope.validate_belief = function() {
    $scope.valid_belief = $scope.response.beliefs.every(belief => !isNaN(belief));
  }

  $scope.canProceed = function() {
    if ($scope.part_id >= 0) {
      return $scope.valid_goal && $scope.valid_belief;
    } else {
      return $scope.response.social_rating !== null;
    }
  }

  // Helper functions for question display
  $scope.has_goal_question = function() {
    return $scope.part_id >= 0;
  }

  $scope.has_belief_question = function() {
    return $scope.part_id >= 0;
  }

  $scope.has_social_question = function() {
    return $scope.part_id >= 0;
  }

  $scope.hide_questions = function() {
    return false; // Always show questions
  }

  $scope.disable_questions = function() {
    return false; // Never disable questions
  }

  $scope.style_statement = function(stmt) {
    return stmt; // Can add styling later
  }

  // Get current stimulus
  $scope.getCurrentStimulus = function() {
    if ($scope.stimuli_set && $scope.stim_id < $scope.stimuli_set.length) {
      return $scope.stimuli_set[$scope.stim_id];
    }
    return null;
  };

  // Get current segment video URL
  $scope.getCurrentSegmentVideo = function() {
    if ($scope.stimuli_set && $scope.stim_id < $scope.stimuli_set.length) {
      const currentStim = $scope.stimuli_set[$scope.stim_id];
      console.log("getCurrentSegmentVideo - currentStim:", currentStim, "part_id:", $scope.part_id);
      
      if ($scope.part_id >= 0 && currentStim.segments && currentStim.segments[$scope.part_id]) {
        // Return segment-specific video if available
        const segmentVideo = currentStim.segments[$scope.part_id].video;
        console.log("Returning segment video:", segmentVideo);
        return segmentVideo;
      } else {
        // Return main video for the stimulus
        console.log("Returning main video:", currentStim.video);
        return currentStim.video;
      }
    }
    console.log("No stimuli available");
    return null;
  };

  // Initialize video with proper event handling
  $scope.initVideo = function() {
    console.log("initVideo called for stim_id:", $scope.stim_id, "part_id:", $scope.part_id);
    
    // Wait for DOM to be ready, then set up video event listeners
    $timeout(function() {
      const videoId = `video-${$scope.stim_id}-${$scope.part_id}`;
      const videoElement = document.getElementById(videoId);
      
      if (videoElement) {
        console.log("Found video element:", videoId);
        
        // Remove existing event listeners
        videoElement.removeEventListener('ended', $scope.onVideoEnded);
        videoElement.removeEventListener('timeupdate', $scope.onVideoTimeUpdate);
        
        // Add new event listeners
        videoElement.addEventListener('ended', $scope.onVideoEnded);
        videoElement.addEventListener('timeupdate', $scope.onVideoTimeUpdate);
        
        // Set video to start at segment start time if specified
        if ($scope.part_id >= 0 && $scope.stimuli_set[$scope.stim_id] && 
            $scope.stimuli_set[$scope.stim_id].segments && 
            $scope.stimuli_set[$scope.stim_id].segments[$scope.part_id]) {
          
          const segment = $scope.stimuli_set[$scope.stim_id].segments[$scope.part_id];
          if (segment.start !== undefined) {
            videoElement.currentTime = segment.start;
            console.log("Set video start time to:", segment.start);
          }
        }
        
        console.log("Video event listeners set up for:", videoId);
      } else {
        console.log("Video element not found:", videoId);
      }
    }, 100); // Small delay to ensure DOM is ready
  };

  // Check if questions should be shown
  $scope.showQuestions = function() {
    const shouldShow = $scope.videoEnded && $scope.part_id >= 0;
    console.log("showQuestions - videoEnded:", $scope.videoEnded, "part_id:", $scope.part_id, "shouldShow:", shouldShow);
    return shouldShow;
  };

  // Check if next button should be shown
  $scope.showNextButton = function() {
    const shouldShow = $scope.videoEnded && $scope.part_id >= 0 && $scope.canProceed();
    console.log("showNextButton - videoEnded:", $scope.videoEnded, "part_id:", $scope.part_id, "canProceed:", $scope.canProceed(), "shouldShow:", shouldShow);
    return shouldShow;
  };



  // Check if there are more segments to play
  $scope.hasMoreSegments = function() {
    if ($scope.stimuli_set && $scope.stim_id < $scope.stimuli_set.length) {
      return $scope.part_id < $scope.stimuli_set[$scope.stim_id].length - 1;
    }
    return false;
  };

  // Handle video ended event
  $scope.onVideoEnded = function() {
    console.log("Video ended for part_id:", $scope.part_id);
    $scope.videoEnded = true;
    console.log("videoEnded set to true, questions should now be visible");
    $scope.$apply(); // Ensure Angular updates the view
  };

  // Handle video time update to check segment boundaries
  $scope.onVideoTimeUpdate = function() {
    if ($scope.part_id >= 0 && $scope.stimuli_set[$scope.stim_id] && 
        $scope.stimuli_set[$scope.stim_id].segments && 
        $scope.stimuli_set[$scope.stim_id].segments[$scope.part_id]) {
      
      const segment = $scope.stimuli_set[$scope.stim_id].segments[$scope.part_id];
      const videoElement = event.target;
      
      // Check if we've reached the end of this segment
      if (segment.end !== undefined && videoElement.currentTime >= segment.end) {
        console.log("Reached segment end time:", segment.end);
        videoElement.pause();
        $scope.onVideoEnded();
      }
    }
  };

  // Function to set video segment timesteps (you can call this to update segments)
  $scope.setVideoSegments = function(stim_id, segments) {
    if ($scope.stimuli_set && $scope.stimuli_set[stim_id]) {
      $scope.stimuli_set[stim_id].segments = segments;
      $scope.stimuli_set[stim_id].times = segments.map(s => s.time);
      $scope.stimuli_set[stim_id].length = segments.length;
      $scope.log("Updated video segments for stimulus " + stim_id + ": " + JSON.stringify(segments));
    }
  };

  // Advance function for instructions
  $scope.advance = async function() {
    console.log("advance() called: section =", $scope.section, "inst_id =", $scope.inst_id);
    if ($scope.section == "instructions") {
      await $scope.advance_instructions();
    } else if ($scope.section == "stimuli") {
      await $scope.advance_stimuli();
    }
  };

  $scope.advance_instructions = async function() {
    console.log("advance_instructions() called: inst_id =", $scope.inst_id);
    // Handle tutorial sections (0-5), quizzes are handled by individual submit functions
    if ($scope.inst_id < 6) {
      // Increment instruction counter
      $scope.inst_id = $scope.inst_id + 1;
      console.log("Advanced to inst_id =", $scope.inst_id);
      
      // If we've completed all tutorials, move to the first quiz
      if ($scope.inst_id === 6) {
        $scope.log("Completed all tutorials, moving to Quiz 1");
      }
    }
    
    $scope.reset_response();
    $scope.valid_goal = false;
    $scope.valid_belief = false;
    $scope.valid_social = false;
  };

  // Advance stimuli function
  $scope.advance_stimuli = async function() {
    console.log("advance_stimuli called - current stim_id:", $scope.stim_id, "part_id:", $scope.part_id);
    
    if ($scope.stim_id >= $scope.stimuli_set.length) {
      // Experiment complete
      $scope.section = "endscreen";
      $scope.store_to_db($scope.user_id + "/completion", "completed");
    } else if ($scope.part_id < $scope.stimuli_set[$scope.stim_id].length - 1) {
      // Advance to next part within current stimulus
      $scope.part_id = $scope.part_id + 1;
      $scope.videoEnded = false; // Reset video ended state for new segment
      console.log("Advanced to next segment - part_id:", $scope.part_id);
    } else {
      // Store ratings for this stimulus and advance to next stimulus
      $scope.store_to_db($scope.user_id + "/" + $scope.stimuli_set[$scope.stim_id].name, $scope.response);
      
      // Advance to next stimulus
      $scope.stim_id = $scope.stim_id + 1;
      
      if ($scope.stim_id < $scope.stimuli_set.length) {
        $scope.part_id = 0; // Start with first segment of new stimulus
        $scope.set_belief_statements($scope.stim_id);
        console.log("Advanced to next stimulus - stim_id:", $scope.stim_id, "part_id:", $scope.part_id);
      }
    }
    
    $scope.reset_response();
    $scope.valid_goal = false;
    $scope.valid_belief = false;
  };

  // Initialize the experiment
  $scope.init = async function() {
    await $scope.loadStimuli();
    $scope.log("Experiment initialized");
  };

  // Add watchers to debug quiz variable changes
  $scope.$watch('quiz.quiz1_see', function(newVal, oldVal) {
    console.log('quiz1_see changed from', oldVal, 'to', newVal);
  });
  
  $scope.$watch('quiz.quiz1_touch', function(newVal, oldVal) {
    console.log('quiz1_touch changed from', oldVal, 'to', newVal);
  });

  // Start the experiment
  $scope.init();
}); 