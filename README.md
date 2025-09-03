# Phase Interface - Agent Interaction Rating Experiment

This is an experiment interface for rating agent interactions with behavioral descriptions. The interface presents segmented video clips of agent interactions and collects detailed ratings on goals, beliefs, and social relations.

## Features

- **Segmented Video Presentation**: Displays videos in timed segments with questions after each
- **Behavioral Description**: After each complete video, participants describe what happened
- **Two-Panel Layout**: Video on left, questions on right to avoid scrolling
- **Slider-Based Rating System**: 0-100 rating scales for goals, beliefs, and social relations
- **Progress Tracking**: Visual progress bar showing completion status
- **Firebase Integration**: Stores responses in Firebase Realtime Database
- **Responsive Design**: Modern, clean interface optimized for user experience

## Project Structure

```
phase_interface/
├── public/
│   ├── stimuli/           # Video files and stimuli.json
│   ├── data/             # Entity images and environment data
│   ├── lib/              # JavaScript libraries
│   ├── index.html        # Main HTML file
│   └── app.js            # AngularJS application logic
├── firebase.json         # Firebase hosting configuration
├── .firebaserc           # Firebase project configuration
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

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd phase_interface
   ```

2. **Install Firebase CLI globally (if not already installed):**
   ```bash
   npm install -g firebase-tools
   ```

3. **Login to Firebase:**
   ```bash
   firebase login
   ```

### Firebase Configuration

1. **Initialize Firebase hosting:**
   ```bash
   firebase init hosting
   ```
   
   When prompted:
   - Public directory: `public`
   - Single-page app: `No`
   - GitHub integration: `No`
   - Overwrite index.html: `No`

2. **Update Firebase configuration in `index.html`:**
   The Firebase config is already set up in the HTML file.

### Deployment

**Deploy to Firebase hosting:**
```bash
firebase deploy --only hosting
```

**Start Firebase emulators for local development:**
```bash
firebase emulators:start
```

## Usage

1. **Instructions & Tutorial**: Users complete 4 quizzes to learn about the interface
2. **Video Segments**: For each video segment, users:
   - Watch the segment
   - Rate agent goals (landmarks, objects) on 0-100 certainty scales
   - Rate social goals (helping/hindering) on 0-100 scales
   - Rate relationship (adversarial/friendly) on 0-100 scale
   - Rate realism on 0-100 scale
3. **Behavioral Description**: After all segments, users:
   - Watch the complete video
   - Write a one-sentence description of what happened
4. **Completion**: Results are stored in Firebase

## Data Collection

The experiment collects:
- User ID (timestamp-based)
- Segment-by-segment ratings (goals, beliefs, social relations)
- Behavioral descriptions for each video
- Response timestamps
- Total experiment duration

Data is stored in Firebase Realtime Database under the user's ID.

## Customization

### Adding More Videos

1. Add video files to `public/stimuli/`
2. Update `public/stimuli/stimuli.json` with new video information and segment timestamps
3. The interface will automatically load the new videos

### Modifying Segment Timestamps

Edit `public/stimuli/stimuli.json` to change when segments appear:
```json
"segments": [
  { "start": 0, "end": 5 },
  { "start": 5, "end": 15 },
  { "start": 15, "end": 25 }
]
```

### Changing Rating Questions

Modify the question text and rating scales in `index.html` within the question groups.

## Troubleshooting

### Common Issues

1. **Videos not loading**: Check file paths in `stimuli.json`
2. **Firebase connection errors**: Verify configuration in `index.html`
3. **Local development issues**: Use `firebase emulators:start`

### Debug Mode

Check browser console for detailed logging of the experiment flow.

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions, please contact the development team. 