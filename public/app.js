// Firebase configuration (replace with your actual config)
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
const resultsRef = database.ref("results");

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
      if ($scope.quiz.quiz2 === $scope.quiz_answers.quiz2) {
          $scope.inst_id = 9;
          $scope.show_repeat_warning = false;
      } else {
          $scope.show_repeat_warning = true;
          $scope.inst_id = 4; // Back to Goals section
      }
  };

  $scope.submitQuiz3 = function() {
      if (!$scope.quiz.quiz3) { alert("Please answer the question."); return; }
      if ($scope.quiz.quiz3 === $scope.quiz_answers.quiz3) {
          $scope.inst_id = 10;
          $scope.show_repeat_warning = false;
      } else {
          $scope.show_repeat_warning = true;
          $scope.inst_id = 5; // Back to Relations section
      }
  };

  $scope.submitQuiz4 = function() {
      if (!$scope.quiz.quiz4) { alert("Please answer the question."); return; }
      if ($scope.quiz.quiz4 === $scope.quiz_answers.quiz4) {
          $scope.inst_id = 11;
          $scope.show_repeat_warning = false;
      } else {
          $scope.show_repeat_warning = true;
          $scope.inst_id = 6; // Back to Strength section
      }
  };

  $scope.startMainExperiment = function() {
      $scope.section = 'stimuli';
      $timeout($scope.startSegmentPlayback, 500); // Wait for UI to update
  };

  // --- Experiment Logic (Two-Panel Version) ---
  $scope.reset_response = function() {
    $scope.response = {
      agent0_physical_goal: null, agent0_physical_detail: null, agent0_social_goal: null,
      agent1_physical_goal: null, agent1_physical_detail: null, agent1_social_goal: null,
      relationship: null, realism: null
    };
  };

  $scope.init = function() {
    fetch('stimuli/stimuli.json')
      .then(response => response.json())
      .then(data => {
        $scope.stimuli_set = data;
        $scope.$apply();
      }).catch(error => console.error("Error loading stimuli:", error));
    $scope.reset_response();
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
    let path = `/${$scope.user_id}/${$scope.stimuli_set[$scope.stim_id].name}/segment_${$scope.part_id}`;
    resultsRef.child(path).set($scope.response);
    
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
  };

  $scope.hasMoreSegments = function() {
    if (!$scope.stimuli_set[$scope.stim_id]) return false;
    return $scope.part_id < $scope.stimuli_set[$scope.stim_id].segments.length - 1;
  };
  
  $scope.canProceed = function() {
      const r = $scope.response;
      const isPhysicalGoalComplete = (goal, detail) => {
          if (!goal) return false;
          return goal.endsWith('_to_lm') ? !!detail : true;
      };

      const agent0Ready = isPhysicalGoalComplete(r.agent0_physical_goal, r.agent0_physical_detail) && r.agent0_social_goal;
      const agent1Ready = isPhysicalGoalComplete(r.agent1_physical_goal, r.agent1_physical_detail) && r.agent1_social_goal;
      
      return agent0Ready && agent1Ready && r.relationship && r.realism;
  };

  $scope.init();
});

