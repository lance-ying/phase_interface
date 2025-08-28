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
    $scope.part_id = -1;
    
    // Set belief statements for first stimulus
    $scope.set_belief_statements(0);
    
    // Get time of first stimulus
    if (start_time == undefined) {
      start_time = (new Date()).getTime();
    }
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
        // Fallback to hardcoded stimuli with 10 videos
        $scope.stimuli_set = [
          {
            "name": "video1",
            "video": "stimuli/video1.mp4",
            "category": "cooperation",
            "description": "Two agents working together to move an object",
            "segments": [
              { video: "stimuli/video1.mp4", time: 5, description: "Segment 1 at 5s" },
              { video: "stimuli/video1.mp4", time: 15, description: "Segment 2 at 15s" },
              { video: "stimuli/video1.mp4", time: 25, description: "Segment 3 at 25s" }
            ],
            "times": [5, 15, 25],
            "length": 3,
            "goal": 1,
            "statements": [
              "The red agent believes the green agent is cooperative.",
              "The green agent thinks the red agent wants to help.",
              "Both agents believe they can work together."
            ]
          },
          {
            "name": "video2",
            "video": "stimuli/video2.mp4",
            "category": "competition",
            "description": "Two agents competing for the same resource",
            "segments": [
              { video: "stimuli/video2.mp4", time: 8, description: "Segment 1 at 8s" },
              { video: "stimuli/video2.mp4", time: 18, description: "Segment 2 at 18s" },
              { video: "stimuli/video2.mp4", time: 28, description: "Segment 3 at 28s" }
            ],
            "times": [8, 18, 28],
            "length": 3,
            "goal": 2,
            "statements": [
              "The red agent believes the green agent is competitive.",
              "The green agent thinks the red agent wants to win.",
              "Both agents believe they must compete."
            ]
          },
          {
            "name": "video3",
            "video": "stimuli/video3.mp4",
            "category": "helping",
            "description": "One agent helping another achieve their goal",
            "segments": [
              { video: "stimuli/video3.mp4", time: 6, description: "Segment 1 at 6s" },
              { video: "stimuli/video3.mp4", time: 16, description: "Segment 2 at 16s" },
              { video: "stimuli/video3.mp4", time: 26, description: "Segment 3 at 26s" }
            ],
            "times": [6, 16, 26],
            "length": 3,
            "goal": 3,
            "statements": [
              "The red agent believes the green agent needs help.",
              "The green agent thinks the red agent is altruistic.",
              "Both agents believe in mutual support."
            ]
          },
          {
            "name": "video4",
            "video": "stimuli/video4.mp4",
            "category": "hindering",
            "description": "One agent actively preventing another from achieving their goal",
            "segments": [
              { video: "stimuli/video4.mp4", time: 7, description: "Segment 1 at 7s" },
              { video: "stimuli/video4.mp4", time: 17, description: "Segment 2 at 17s" },
              { video: "stimuli/video4.mp4", time: 27, description: "Segment 3 at 27s" }
            ],
            "times": [7, 17, 27],
            "length": 3,
            "goal": 4,
            "statements": [
              "The red agent believes the green agent is a threat.",
              "The green agent thinks the red agent is hostile.",
              "Both agents believe they are in conflict."
            ]
          },
          {
            "name": "video5",
            "video": "stimuli/video5.mp4",
            "category": "neutral",
            "description": "Two agents pursuing independent goals without interaction",
            "segments": [
              { video: "stimuli/video5.mp4", time: 9, description: "Segment 1 at 9s" },
              { video: "stimuli/video5.mp4", time: 19, description: "Segment 2 at 19s" },
              { video: "stimuli/video5.mp4", time: 29, description: "Segment 3 at 29s" }
            ],
            "times": [9, 19, 29],
            "length": 3,
            "goal": 1,
            "statements": [
              "The red agent believes the green agent is irrelevant.",
              "The green agent thinks the red agent is independent.",
              "Both agents believe they can ignore each other."
            ]
          },
          {
            "name": "video6",
            "video": "stimuli/video6.mp4",
            "category": "coordination",
            "description": "Two agents coordinating their actions for mutual benefit",
            "segments": [
              { video: "stimuli/video6.mp4", time: 10, description: "Segment 1 at 10s" },
              { video: "stimuli/video6.mp4", time: 20, description: "Segment 2 at 20s" },
              { video: "stimuli/video6.mp4", time: 30, description: "Segment 3 at 30s" }
            ],
            "times": [10, 20, 30],
            "length": 3,
            "goal": 2,
            "statements": [
              "The red agent believes coordination is beneficial.",
              "The green agent thinks teamwork is necessary.",
              "Both agents believe in strategic cooperation."
            ]
          },
          {
            "name": "video7",
            "video": "stimuli/video7.mp4",
            "category": "deception",
            "description": "One agent using deceptive tactics to achieve their goal",
            "segments": [
              { video: "stimuli/video7.mp4", time: 12, description: "Segment 1 at 12s" },
              { video: "stimuli/video7.mp4", time: 22, description: "Segment 2 at 22s" },
              { video: "stimuli/video7.mp4", time: 32, description: "Segment 3 at 32s" }
            ],
            "times": [12, 22, 32],
            "length": 3,
            "goal": 3,
            "statements": [
              "The red agent believes deception is effective.",
              "The green agent thinks the red agent is trustworthy.",
              "Both agents have different understandings of the situation."
            ]
          },
          {
            "name": "video8",
            "video": "stimuli/video8.mp4",
            "category": "teaching",
            "description": "One agent teaching another how to accomplish a task",
            "segments": [
              { video: "stimuli/video8.mp4", time: 11, description: "Segment 1 at 11s" },
              { video: "stimuli/video8.mp4", time: 21, description: "Segment 2 at 21s" },
              { video: "stimuli/video8.mp4", time: 31, description: "Segment 3 at 31s" }
            ],
            "times": [11, 21, 31],
            "length": 3,
            "goal": 4,
            "statements": [
              "The red agent believes the green agent can learn.",
              "The green agent thinks the red agent is knowledgeable.",
              "Both agents believe in the value of education."
            ]
          },
          {
            "name": "video9",
            "video": "stimuli/video9.mp4",
            "category": "negotiation",
            "description": "Two agents negotiating over resource allocation",
            "segments": [
              { video: "stimuli/video9.mp4", time: 13, description: "Segment 1 at 13s" },
              { video: "stimuli/video9.mp4", time: 23, description: "Segment 2 at 23s" },
              { video: "stimuli/video9.mp4", time: 33, description: "Segment 3 at 33s" }
            ],
            "times": [13, 23, 33],
            "length": 3,
            "goal": 1,
            "statements": [
              "The red agent believes compromise is possible.",
              "The green agent thinks negotiation is worthwhile.",
              "Both agents believe in finding middle ground."
            ]
          },
          {
            "name": "video10",
            "video": "stimuli/video10.mp4",
            "category": "leadership",
            "description": "One agent taking leadership role in a group task",
            "segments": [
              { video: "stimuli/video10.mp4", time: 14, description: "Segment 1 at 14s" },
              { video: "stimuli/video10.mp4", time: 24, description: "Segment 2 at 24s" },
              { video: "stimuli/video10.mp4", time: 34, description: "Segment 3 at 34s" }
            ],
            "times": [14, 24, 34],
            "length": 3,
            "goal": 2,
            "statements": [
              "The red agent believes leadership is necessary.",
              "The green agent thinks the red agent is capable.",
              "Both agents believe in hierarchical organization."
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
    if ($scope.stim_id >= $scope.stimuli_set.length) {
      // Experiment complete
      $scope.section = "endscreen";
      $scope.store_to_db($scope.user_id + "/completion", "completed");
    } else if ($scope.part_id < 0) {
      // Advance to first part
      $scope.part_id = $scope.part_id + 1;
      $scope.set_belief_statements($scope.stim_id);
      start_time = (new Date()).getTime();
    } else if ($scope.part_id < $scope.stimuli_set[$scope.stim_id].length) {
      // Advance to next part
      $scope.part_id = $scope.part_id + 1;
      
      if ($scope.part_id == $scope.stimuli_set[$scope.stim_id].length) {
        // Store ratings for this stimulus
        $scope.store_to_db($scope.user_id + "/" + $scope.stimuli_set[$scope.stim_id].name, $scope.response);
        
        // Advance to next stimulus
        $scope.part_id = -1;
        $scope.stim_id = $scope.stim_id + 1;
        
        if ($scope.stim_id < $scope.stimuli_set.length) {
          $scope.set_belief_statements($scope.stim_id);
        }
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