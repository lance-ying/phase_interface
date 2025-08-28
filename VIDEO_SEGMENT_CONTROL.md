# Video Segment Timestep Control

## Overview
The `phase_interface` allows you to control the exact timesteps where videos are segmented for participant questions. This is crucial for your research to capture the most interesting inference points that affect decision making.

## How to Set Video Segment Timesteps

### Method 1: Update stimuli.json (Recommended)
Edit the `public/stimuli/stimuli.json` file and modify the `times` array for each stimulus:

```json
{
  "name": "fighting",
  "video": "stimuli/fighting.mp4",
  "segments": [
    { "video": "stimuli/fighting.mp4", "time": 5, "description": "Segment 1 at 5s" },
    { "video": "stimuli/fighting.mp4", "time": 15, "description": "Segment 2 at 15s" },
    { "video": "stimuli/fighting.mp4", "time": 25, "description": "Segment 3 at 25s" }
  ],
  "times": [5, 15, 25],  // ← Update these timesteps
  "length": 3
}
```

### Method 2: Use JavaScript Function (Programmatic)
In the browser console or by calling the function in your code:

```javascript
// Example: Update fighting video segments
setVideoSegments(0, [
  { video: "stimuli/fighting.mp4", time: 8, description: "Segment 1 at 8s" },
  { video: "stimuli/fighting.mp4", time: 18, description: "Segment 2 at 18s" },
  { video: "stimuli/fighting.mp4", time: 28, description: "Segment 3 at 28s" }
]);

// Example: Update chasing video segments  
setVideoSegments(1, [
  { video: "stimuli/chasing.mp4", time: 6, description: "Segment 1 at 6s" },
  { video: "stimuli/chasing.mp4", time: 16, description: "Segment 2 at 16s" },
  { video: "stimuli/chasing.mp4", time: 26, description: "Segment 3 at 26s" }
]);
```

## Current Video Structure

Each video is divided into 3 segments where participants answer questions:

1. **Segment 1** (part_id = 0): Goal questions
2. **Segment 2** (part_id = 1): Belief questions  
3. **Segment 3** (part_id = 2): Belief questions
4. **Final Rating** (part_id = -1): Social interaction rating

## Research Considerations

When choosing timesteps, consider:

- **Inference Points**: Moments where agents make decisions based on limited information
- **Belief Updates**: Points where agents' understanding of the environment changes
- **Goal Conflicts**: Moments where agents' objectives clash or align
- **Social Dynamics**: Key interactions that reveal cooperation/competition

## Example Workflow

1. Watch each video and identify 3 key moments
2. Note the timestamps (in seconds) for each moment
3. Update the `times` array in `stimuli.json`
4. Test the interface to ensure segments work correctly
5. Adjust timestamps based on pilot testing

## Testing Your Changes

1. Open the interface in your browser
2. Complete the tutorial and quizzes
3. Watch the first video and verify segments appear at correct times
4. Check that questions appear after each segment
5. Verify the final social rating question appears

## Troubleshooting

- **Videos not loading**: Check file paths in `stimuli.json`
- **Segments not working**: Verify `times` array has correct values
- **Questions not appearing**: Check `part_id` logic in app.js
- **Console errors**: Look for JavaScript errors in browser developer tools

## Next Steps

1. **Manual Review**: Watch each video and identify optimal timesteps
2. **Pilot Testing**: Test with a few participants to refine timesteps
3. **Data Collection**: Use the refined interface for your main study
4. **Analysis**: Export responses from Firebase for analysis

Remember: The quality of your research data depends heavily on choosing the right moments to pause and ask questions. Take time to carefully select timesteps that capture the most interesting inference patterns! 