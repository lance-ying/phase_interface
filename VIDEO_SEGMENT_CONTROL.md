# Video Segment Timestep Control

## Overview
The `phase_interface` allows you to control the exact timesteps where videos are segmented for participant questions. This is crucial for your research to capture the most interesting inference points that affect decision making.

## How to Set Video Segment Timesteps

### Method 1: Update stimuli.json (Recommended)
Edit the `public/stimuli/stimuli.json` file and modify the `segments` array for each stimulus:

```json
{
  "name": "fighting",
  "video": "stimuli/fighting.mp4",
  "segments": [
    { "start": 0, "end": 5 },
    { "start": 5, "end": 15 },
    { "start": 15, "end": 25 }
  ]
}
```

The `start` and `end` values represent seconds from the beginning of the video.

### Method 2: Use JavaScript Function (Programmatic)
In the browser console or by calling the function in your code:

```javascript
// Example: Update fighting video segments
setVideoSegments(0, [
  { start: 0, end: 8 },
  { start: 8, end: 18 },
  { start: 18, end: 28 }
]);

// Example: Update chasing video segments  
setVideoSegments(1, [
  { start: 0, end: 6 },
  { start: 6, end: 16 },
  { start: 16, end: 26 }
]);
```

## Current Video Structure

Each video is divided into 3 segments where participants answer questions:

1. **Segment 1** (part_id = 0): Agent goals and beliefs
2. **Segment 2** (part_id = 1): Agent goals and beliefs  
3. **Segment 3** (part_id = 2): Agent goals and beliefs
4. **Behavioral Description**: Complete video description after all segments

## Research Considerations

When choosing timesteps, consider:

- **Inference Points**: Moments where agents make decisions based on limited information
- **Belief Updates**: Points where agents' understanding of the environment changes
- **Goal Conflicts**: Moments where agents' objectives clash or align
- **Social Dynamics**: Key interactions that reveal cooperation/competition

## Example Workflow

1. Watch each video and identify 3 key moments
2. Note the timestamps (in seconds) for each moment
3. Update the `segments` array in `stimuli.json` with `start` and `end` times
4. Test the interface to ensure segments work correctly
5. Adjust timestamps based on pilot testing

## Testing Your Changes

1. Deploy to Firebase: `firebase deploy --only hosting`
2. Open the interface in your browser
3. Complete the tutorial and quizzes
4. Watch the first video and verify segments appear at correct times
5. Check that questions appear after each segment
6. Verify the behavioral description page appears after all segments

## Troubleshooting

- **Videos not loading**: Check file paths in `stimuli.json`
- **Segments not working**: Verify `segments` array has correct `start` and `end` values
- **Questions not appearing**: Check `part_id` logic in app.js
- **Console errors**: Look for JavaScript errors in browser developer tools

## Next Steps

1. **Manual Review**: Watch each video and identify optimal timesteps
2. **Pilot Testing**: Test with a few participants to refine timesteps
3. **Data Collection**: Use the refined interface for your main study
4. **Analysis**: Export responses from Firebase for analysis

Remember: The quality of your research data depends heavily on choosing the right moments to pause and ask questions. Take time to carefully select timesteps that capture the most interesting inference patterns! 