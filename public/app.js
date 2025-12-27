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
      if (!row.category || row.category === 'social') return;
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
    if (category === 'social') {
      // No specific sub-option needed; the slider already captures Hindering/Neutral/Helping
      row.openB = false;
      row.optionId = 'social';
      row.optionLabel = 'Social';
    } else {
      row.openB = true; // open next dropdown automatically for physical
    }
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
        // Stay on current quiz, show transient warning
        $scope.show_repeat_warning = true;
        $timeout(function() { $scope.show_repeat_warning = false; }, 2000);
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
        $timeout(function() { $scope.show_repeat_warning = false; }, 2000);
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
        $timeout(function() { $scope.show_repeat_warning = false; }, 2000);
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
        $timeout(function() { $scope.show_repeat_warning = false; }, 2000);
      }
  };

  $scope.startMainExperiment = function() {
      $scope.section = 'stimuli';
      // Ensure indices reset when entering main experiment (no segments version)
      $scope.isTrial = false;
      $scope.stim_id = 0;
      $scope.part_id = 0;
      $scope.questionsVisible = false;
      $scope.reset_response();
      $scope.prepareStatementsForCurrent();
      
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
      
      $timeout($scope.startFullVideoPlayback, 500); // Wait for UI to update
  };

  // --- Experiment Logic ---
  $scope.reset_response = function() {
    console.log("DEBUG: reset_response called");
    $scope.response = {
      // Statement ratings (0-100) shown after full video
      statementRatings: [], // populated when statements are prepared
      statementTouched: [], // track interaction per statement
      
      // Tracking variables for completion
      answered: {
        // New gating: statements only
        statements: false
      }
    };
    $scope.answeredCount = 0;
    $scope.totalRequired = 0;
    console.log("DEBUG: response set to:", $scope.response);
    console.log("DEBUG: answered flags:", $scope.response.answered);
    // Initialize goal options/top goals no longer required for this version
  };

  // Recompute answered count dynamically (#touched statements)
  $scope.updateAnsweredCount = function() {
    if (!$scope.response || !$scope.response.answered) { $scope.answeredCount = 0; return; }
    const touched = Array.isArray($scope.response.statementTouched) ? $scope.response.statementTouched : [];
    const touchedCount = touched.filter(function(v) { return !!v; }).length;
    $scope.answeredCount = touchedCount;
    $scope.totalRequired = ($scope.currentStatements ? $scope.currentStatements.length : 0);
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

  // Helper to mark an individual slider element as interacted
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
  
  // Play the full video and show questions after it ends
  $scope.startFullVideoPlayback = function() {
    if ($scope.section !== 'stimuli') { return; }
    const video = document.getElementById('stimuliVideo');
    if (!video) {
      $timeout($scope.startFullVideoPlayback, 100);
      return;
    }
    const stimObj = ($scope.active_stimuli_set || [])[ $scope.stim_id ];
    // per-video cutoff seconds:
    // - Prefer explicit stimObj.play_until if provided
    // - Else, use the last segment end if available
    // - Else, fall back to natural video end
    let cutoffSeconds = null;
    try {
      if (stimObj && typeof stimObj.play_until === 'number' && isFinite(stimObj.play_until)) {
        cutoffSeconds = Number(stimObj.play_until);
      } else if (stimObj && Array.isArray(stimObj.segments) && stimObj.segments.length > 0) {
        const lastSeg = stimObj.segments[stimObj.segments.length - 1];
        if (lastSeg && typeof lastSeg.end === 'number' && isFinite(lastSeg.end)) {
          cutoffSeconds = Number(lastSeg.end);
        }
      }
    } catch (e) {
      console.warn('Unable to derive cutoffSeconds from stimulus object:', e);
    }
    // Reset visibility until video finishes
    $scope.$applyAsync(() => { $scope.questionsVisible = false; });
    try {
      video.currentTime = 0;
      // Remove previous listeners
      if (video._endedHandler) {
        video.removeEventListener('ended', video._endedHandler);
      }
      if (video._timeUpdateHandler) {
        video.removeEventListener('timeupdate', video._timeUpdateHandler);
      }
      const onEnded = function() {
        $scope.$apply(() => { $scope.questionsVisible = true; });
        // Bind slider interaction class
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
      };
      video._endedHandler = onEnded;
      video.addEventListener('ended', onEnded);
      // If a cutoff time is specified, stop playback at that time instead of natural end
      if (cutoffSeconds !== null && isFinite(cutoffSeconds)) {
        const onTimeUpdate = function() {
          if (video.currentTime >= cutoffSeconds) {
            try {
              video.pause();
            } catch (e) {}
            video.removeEventListener('timeupdate', onTimeUpdate);
            onEnded();
          }
        };
        video._timeUpdateHandler = onTimeUpdate;
        video.addEventListener('timeupdate', onTimeUpdate);
      }
      video.play().catch((e) => console.warn('Autoplay failed, user interaction may be required:', e));
    } catch (e) {
      console.error('Error starting full video playback:', e);
    }
  };
  
  $scope.replayCurrentSegment = function() {
      const video = document.getElementById('stimuliVideo');
      video.pause();
      // Use timeout to ensure UI updates before playback starts
      $timeout(() => {
        $scope.startFullVideoPlayback();
      }, 100);
  };

  // ===== Statement generation (single-agent, include both ground truths) =====
  $scope.prepareStatementsForCurrent = function() {
    const stim = ($scope.active_stimuli_set || [])[ $scope.stim_id ];
    if (!stim) { $scope.currentStatements = []; $scope.response.statementRatings = []; return; }
    // Parse per-agent clauses from description to ensure single-agent statements
    const desc = (stim.description || '').trim();
    const toLower = desc.toLowerCase();
    let redTruth = null;
    let greenTruth = null;
    if (desc) {
      // Split by ';' and map to agent if prefixed
      const parts = desc.split(';').map(function(p){ return p.trim(); }).filter(Boolean);
      parts.forEach(function(p) {
        const pl = p.toLowerCase();
        if (pl.startsWith('red ') || pl.startsWith('red agent ')) { redTruth = p; }
        if (pl.startsWith('green ') || pl.startsWith('green agent ')) { greenTruth = p; }
      });
      // Heuristic for chasing phrasing
      if (!redTruth || !greenTruth) {
        if (/red\s+chasing\s+green/.test(toLower)) {
          redTruth = redTruth || 'red chasing green';
          greenTruth = greenTruth || 'green being chased by red';
        } else if (/green\s+chasing\s+red/.test(toLower)) {
          greenTruth = greenTruth || 'green chasing red';
          redTruth = redTruth || 'red being chased by green';
        }
      }
    }
    // Fallback if still missing: generic safe phrasing (kept minimal and agent-specific)
    if (!redTruth) { redTruth = 'red agent was active in the scene'; }
    if (!greenTruth) { greenTruth = 'green agent was active in the scene'; }
    // Normalize truths to goal-style phrasing
    const toGoal = function(agent, text) {
      let s = (text || '').trim();
      if (/^the\s+(red|green)\s+agent(?:’s|'s)?\s+goal\s+is\s+to/i.test(s)) { return s; }

      // Strip leading agent tokens if present
      s = s.replace(/^(red|green)\s+agent\s*/i, '')
           .replace(/^(red|green)\s*/i, '');

      // Basic verb normalizations
      s = s.replace(/^chasing\s+/i, 'chase ')
           .replace(/^being\s+chased\s+/i, 'be chased ')
           .replace(/^remained\s+/i, 'remain ')
           .replace(/^was\s+/i, 'be ')
           .replace(/^is\s+/i, 'be ');

      // Grammar fixes for common actions
      // 1) put/move X object to Y landmark -> put the X object on the Y landmark
      s = s.replace(/^(?:put|move)\s+(\w+)\s+object\s+to\s+(\w+)\s+landmark\b/i,
                    (_m, objColor, lmColor) => `put the ${objColor} object on the ${lmColor} landmark`);
      // 2) send/give X object to {agent} agent -> give the X object to the {agent} agent
      s = s.replace(/^(?:send|give)\s+(\w+)\s+object\s+to\s+(red|green)\s+agent\b/i,
                    (_m, objColor, targetAgent) => `give the ${objColor} object to the ${targetAgent} agent`);
      // 3) go to {color} landmark -> go to the {color} landmark
      s = s.replace(/^(?:go\s*to|goto)\s+(\w+)\s+landmark\b/i,
                    (_m, lmColor) => `go to the ${lmColor} landmark`);
      // 4) chase {agent} -> chase the {agent}
      s = s.replace(/^chase\s+(red|green)\s+agent\b/i,
                    (_m, a) => `chase the ${a} agent`);
      // 5) be chased by {agent} -> be chased by the {agent}
      s = s.replace(/^be\s+chased\s+by\s+(red|green)\s+agent\b/i,
                    (_m, a) => `be chased by the ${a} agent`);

      return `The ${agent} agent’s goal is to ${s}`;
    };
    redTruth = toGoal('red', redTruth);
    greenTruth = toGoal('green', greenTruth);
    // Build distractor pool: collect single-agent clauses from other stimuli
    const otherClauses = [];
    ($scope.stimuli_set || []).forEach(function(s) {
      if (!s || s.name === stim.name || !s.description) { return; }
      const p = s.description.split(';').map(function(x){ return x.trim(); }).filter(Boolean);
      p.forEach(function(c) {
        const cl = c.toLowerCase();
        if (cl.startsWith('red ') || cl.startsWith('red agent ') || cl.startsWith('green ') || cl.startsWith('green agent ')) {
          otherClauses.push(c);
        } else if (/red\s+chasing\s+green/.test(cl)) {
          otherClauses.push('green being chased by red');
        } else if (/green\s+chasing\s+red/.test(cl)) {
          otherClauses.push('red being chased by green');
        }
      });
    });
    // Shuffle helper
    const shuffle = (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    // Deduplicate and remove truths
    const uniqueDistractors = Array.from(new Set(otherClauses)).filter(function(c) {
      const cl = c.toLowerCase();
      return cl !== redTruth.toLowerCase() && cl !== greenTruth.toLowerCase();
    });
    const negs = shuffle(uniqueDistractors).slice(0, 3);
    while (negs.length < 3) {
      const fillers = [
        'The red agent’s goal is to move aimlessly',
        'The green agent’s goal is to remain stationary',
        'The red agent’s goal is to avoid interacting with landmarks'
      ];
      const candidate = fillers[negs.length] || `The red agent’s goal is to perform an unrelated action ${negs.length + 1}`;
      if (candidate.toLowerCase() !== redTruth.toLowerCase() && candidate.toLowerCase() !== greenTruth.toLowerCase()) {
        negs.push(candidate);
      } else {
        negs.push(candidate + '.');
      }
    }
    // Occasionally inject a social-style distractor (help/hinder) in place of one of the negs
    try {
      const socialCandidates = [
        'The red agent’s goal is to help the green agent',
        'The red agent’s goal is to hinder the green agent',
        'The green agent’s goal is to help the red agent',
        'The green agent’s goal is to hinder the red agent',
      ];
      if (Math.random() < 0.5 && negs.length > 0) { // ~50% chance to include one social distractor
        const pick = socialCandidates[Math.floor(Math.random() * socialCandidates.length)];
        const lowerPick = pick.toLowerCase();
        const inTruths = lowerPick === (redTruth || '').toLowerCase() || lowerPick === (greenTruth || '').toLowerCase();
        const inNegs = negs.some(function(n) { return (n || '').toLowerCase() === lowerPick; });
        if (!inTruths && !inNegs) {
          const replaceIdx = Math.floor(Math.random() * negs.length);
          negs[replaceIdx] = pick;
        }
      }
    } catch (e) {
      console.warn('Unable to inject social-style distractor:', e);
    }
    // Normalize distractors to goal-style phrasing when possible
    const detectAgent = function(s) {
      const m = /^\s*(red|green)(?:\s+agent)?\b/i.exec(s || '');
      return m ? m[1].toLowerCase() : null;
    };
    let normalizedNegs = negs.map(function(t) {
      const a = detectAgent(t);
      return a ? toGoal(a, t) : t;
    }).filter(function(t) {
      const tl = (t || '').toLowerCase();
      return tl !== (redTruth || '').toLowerCase() && tl !== (greenTruth || '').toLowerCase();
    });
    // Top off if filtering removed items
    if (normalizedNegs.length < 3) {
      const fallbackNegs = [
        'The red agent’s goal is to move aimlessly',
        'The green agent’s goal is to remain stationary',
        'The red agent’s goal is to avoid interacting with landmarks'
      ];
      for (let i = 0; normalizedNegs.length < 3 && i < fallbackNegs.length; i++) {
        const cand = fallbackNegs[i];
        const cl = cand.toLowerCase();
        const exists = normalizedNegs.some(function(n) { return (n || '').toLowerCase() === cl; });
        const isTruth = cl === (redTruth || '').toLowerCase() || cl === (greenTruth || '').toLowerCase();
        if (!exists && !isTruth) {
          normalizedNegs.push(cand);
        }
      }
    }

    // Build final 5 statements: 2 truths (red, green) + 3 distractors
    const statements = [
      { text: redTruth, isGroundTruth: true, agent: 'red' },
      { text: greenTruth, isGroundTruth: true, agent: 'green' },
      ...normalizedNegs.map(function(t) { return { text: t, isGroundTruth: false }; })
    ];
    $scope.currentStatements = shuffle(statements);
    // Initialize to 50 to match slider default without firing change
    $scope.response.statementRatings = new Array($scope.currentStatements.length).fill(50);
    $scope.response.statementTouched = new Array($scope.currentStatements.length).fill(false);
    $scope.totalRequired = $scope.currentStatements.length;
    // Reset answered flags
    if ($scope.response && $scope.response.answered) {
      $scope.response.answered.statements = false;
      $scope.updateAnsweredCount();
    }
  };

  $scope.onStatementChange = function(index) {
    if (!$scope.response) return;
    if (Array.isArray($scope.response.statementTouched) && typeof index === 'number') {
      $scope.response.statementTouched[index] = true;
    }
    const touchedArr = Array.isArray($scope.response.statementTouched) ? $scope.response.statementTouched : [];
    const allTouched = touchedArr.length > 0 && touchedArr.every(function(v){ return !!v; });
    if ($scope.response.answered) {
      $scope.response.answered.statements = !!allTouched;
      $scope.updateAnsweredCount();
    }
  };

  $scope.advance_stimuli = function() {
    try {
      // Store response to Firebase
      const collection = $scope.isTrial ? 'trial' : 'results';
      const setData = getFirebaseSet();
      const ref = getFirebaseRef();
      const database = getFirebaseDatabase();
      const currentStimObj = $scope.active_stimuli_set[$scope.stim_id];
      const basePath = `/${$scope.user_id}/main_experiment/${currentStimObj.name}`;
      
      const statementsPayload = ($scope.currentStatements || []).map(function(s, idx) {
        const rating = Array.isArray($scope.response.statementRatings) ? Number($scope.response.statementRatings[idx]) : null;
        return { text: s.text, isGroundTruth: !!s.isGroundTruth, rating: rating };
      });
      const payload = {
        statements: statementsPayload,
        video: ($scope.active_stimuli_set && $scope.active_stimuli_set[$scope.stim_id] ? $scope.active_stimuli_set[$scope.stim_id].video : null),
        timestamp: Date.now()
      };
      // Write single response per video under main_experiment/{videoName}/response
      setData(ref(database, `${collection}${basePath}/response`), payload)
        .then(() => {
          console.log("Data saved to Firebase successfully");
        })
        .catch((error) => {
          console.error("Error saving to Firebase:", error);
        });

      // Store top-level metadata once per video
      if ($scope.part_id === 0 && currentStimObj) {
        try { setData(ref(database, `${collection}${basePath}/video`), currentStimObj.video); } catch (e) {}
      }

      // Proceed: show behavioral description for this video
      $scope.reset_response();
      $scope.questionsVisible = false;
      if ($scope.isTrial) {
        // End trial and proceed to Quiz 1
        $scope.section = 'instructions';
        $scope.inst_id = 8; // Quiz 1 screen
        $scope.isTrial = false;
        $scope.part_id = 0;
        $scope.active_stimuli_set = $scope.stimuli_set;
      } else {
        $scope.section = 'behavioral_description';
        if (!$scope.form) { $scope.form = {}; }
        $scope.form.behavioralDescription = "";
      }
      if ($scope.stim_id < $scope.active_stimuli_set.length) {
        $timeout($scope.startFullVideoPlayback, 100);
      }
    } catch (error) {
      console.error("Firebase error:", error);
      // Continue with the experiment even if Firebase fails
      $scope.reset_response();
      $scope.questionsVisible = false;

      if ($scope.isTrial) {
        $scope.section = 'instructions';
        $scope.inst_id = 8;
        $scope.isTrial = false;
        $scope.active_stimuli_set = $scope.stimuli_set;
      } else {
        $scope.section = 'behavioral_description';
        if (!$scope.form) { $scope.form = {}; }
        $scope.form.behavioralDescription = "";
      }
      if ($scope.stim_id < $scope.active_stimuli_set.length) {
        $timeout($scope.startFullVideoPlayback, 100);
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
      
      // Store description under main_experiment/{videoName}
      setData(ref(database, `results/${$scope.user_id}/main_experiment/${videoName}/behavioral_description`), {
        description: $scope.form.behavioralDescription,
        timestamp: Date.now()
      }).then(() => {
        console.log("Behavioral description saved to Firebase successfully");
        // Clean up legacy location if it exists
        try {
          setData(ref(database, `results/${$scope.user_id}/${videoName}`), null);
        } catch (e) {}
        $scope.$applyAsync(function() {
          // Proceed to next video or finish
          if ($scope.stim_id < ($scope.active_stimuli_set?.length || 0) - 1) {
            $scope.stim_id += 1;
            $scope.part_id = 0;
            $scope.questionsVisible = false;
            $scope.reset_response();
            $scope.prepareStatementsForCurrent();
            $scope.section = 'stimuli';
            $timeout($scope.startFullVideoPlayback, 300);
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
    // No segments in this version; always false
    return false;
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
    $scope.prepareStatementsForCurrent();
    $timeout($scope.startFullVideoPlayback, 500);
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
      const allAnswered = $scope.response.answered.statements;
      
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