# Smart Attendance System

A web-based attendance system that uses face detection and time-based validation to mark attendance. Built with React, TypeScript, face-api.js, and Supabase.

## Features

- **Real-time Face Detection**: Uses TensorFlow-based face detection models
- **Time-Based Validation**: Requires face to be detected for 3 seconds continuously before marking attendance
- **Live Camera Feed**: Shows real-time video with detection status
- **Visual Progress Indicator**: Timer bar showing detection progress
- **Attendance Log**: Displays recent attendance records in real-time
- **Persistent Storage**: All records saved to Supabase database
- **User Management**: Automatic user creation on first attendance

## How It Works

1. **Enter Your Name**: Input your name to identify yourself
2. **Start Camera**: Click "Start Attendance" to activate the camera
3. **Face Detection**: The system continuously scans for faces
4. **Time Validation**: Keep your face in frame for 3 seconds
5. **Auto Mark**: Attendance is automatically marked after validation
6. **View Records**: See all recent attendance in the right panel

## Technical Details

### Face Detection
- Uses `face-api.js` with TinyFaceDetector for lightweight, fast detection
- Runs detection every 100ms for smooth real-time experience
- Requires all three models: detector, landmarks, and recognition

### Time Logic
- Face must be continuously detected for 3 seconds
- Timer resets immediately if face is lost
- Visual progress bar shows detection time
- Auto-marks attendance only after full duration

### Database Schema
- **users**: Stores user information
- **attendance_records**: Logs all check-ins with timestamps and detection duration
- Row Level Security (RLS) enabled for data protection

## Configuration

The required detection time is set to 3 seconds by default. To change this, modify the `REQUIRED_DETECTION_TIME` constant in `src/components/AttendanceSystem.tsx`.

## Models

Face detection models are automatically loaded from the `/public/models` directory. These include:
- Tiny Face Detector
- Face Landmark 68
- Face Recognition

## Environment Variables

The system requires Supabase credentials in `.env`:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Browser Requirements

- Modern browser with camera access support
- HTTPS required for camera permissions (or localhost for development)
- Sufficient lighting for face detection
