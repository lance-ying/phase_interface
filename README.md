# Phase Interface - Agent Interaction Rating Experiment

This is an experiment interface for rating agent interactions based on the `curr_belief` and `HRI` project structures. The interface presents video clips of agent interactions and collects ratings on a 0-100 scale.

## Features

- **Video Presentation**: Displays 10 selected agent interaction videos
- **Rating System**: 0-100 rating scale with slider and input options
- **Progress Tracking**: Visual progress bar showing completion status
- **Firebase Integration**: Stores responses in Firebase Realtime Database
- **Responsive Design**: Modern, clean interface optimized for user experience

## Project Structure

```
phase_interface/
├── public/
│   ├── stimuli/           # Video files and stimuli.json
│   ├── lib/              # JavaScript libraries
│   ├── images/           # Image assets
│   ├── index.html        # Main HTML file
│   └── app.js            # AngularJS application logic
├── firebase.json         # Firebase hosting configuration
├── .firebaserc           # Firebase project configuration
├── package.json          # Project dependencies
└── README.md            # This file
```

## Videos Included

The experiment includes 10 video clips covering various agent interaction types:

1. **fighting.mp4** - Physical conflict between agents
2. **chasing.mp4** - One agent pursuing another
3. **stealing.mp4** - Object theft between agents
4. **hiding.mp4** - Evasion behavior
5. **helping_physically_2.mp4** - Cooperative physical assistance
6. **blocking_1.mp4** - Path obstruction
7. **attacking.mp4** - Aggressive behavior
8. **informing.mp4** - Information sharing
9. **teacher.mp4** - Educational interaction
10. **chasing3.mp4** - Additional pursuit example

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Firebase CLI tools
- Firebase project

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd phase_interface
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install Firebase CLI globally (if not already installed):**
   ```bash
   npm install -g firebase-tools
   ```

4. **Login to Firebase:**
   ```bash
   firebase login
   ```

### Firebase Configuration

1. **Update Firebase configuration in `app.js`:**
   Replace the placeholder values in the `firebaseConfig` object with your actual Firebase project credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_ACTUAL_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

2. **Update project ID in `.firebaserc`:**
   ```json
   {
     "projects": {
       "default": "YOUR_ACTUAL_PROJECT_ID"
     }
   }
   ```

### Local Development

1. **Start local development server:**
   ```bash
   npm start
   ```

2. **Open browser and navigate to:**
   ```
   http://localhost:5000
   ```

### Deployment

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase:**
   ```bash
   npm run deploy
   ```

## Usage

1. **Instructions**: Users see an introduction explaining the experiment
2. **Video Rating**: For each video, users:
   - Watch the agent interaction
   - Rate the level of cooperation on a 0-100 scale
   - Use either the slider or input box
   - Click "Next" to proceed
3. **Completion**: Users see a thank you message and results are stored

## Data Collection

The experiment collects:
- User ID (timestamp-based)
- Video ratings (0-100 scale)
- Response timestamps
- Total experiment duration
- Stimulus information (name, category)

Data is stored in Firebase Realtime Database under the user's ID.

## Customization

### Adding More Videos

1. Add video files to `public/stimuli/`
2. Update `public/stimuli/stimuli.json` with new video information
3. The interface will automatically load the new videos

### Changing Rating Questions

Modify the question text in `index.html`:
```html
<p class="question-text">How would you rate the level of cooperation between the agents in this interaction?</p>
```

### Modifying Rating Scale

Update the scale labels and range in `index.html`:
```html
<span class="rating-label">0<br>No Cooperation</span>
<input type="range" min="0" max="100" ng-model="currentRating" class="rating-slider">
<span class="rating-label">100<br>Full Cooperation</span>
```

## Troubleshooting

### Common Issues

1. **Videos not loading**: Check file paths in `stimuli.json`
2. **Firebase connection errors**: Verify configuration in `app.js`
3. **Local development issues**: Ensure Firebase CLI is properly installed

### Debug Mode

Add `?debug=true` to the URL to enable console logging:
```
http://localhost:5000?debug=true
```

### Local Testing

Add `?local=true` to bypass Firebase and test locally:
```
http://localhost:5000?local=true
```

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions, please contact the development team. 