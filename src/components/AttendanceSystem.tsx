import { useEffect, useState, useRef } from 'react';
import { Camera, CheckCircle, Clock, User, AlertCircle } from 'lucide-react';
import { useFaceDetection, useCamera } from '../hooks/useFaceDetection';
import { supabase } from '../lib/supabase';
import type { AttendanceRecord } from '../lib/types';

const REQUIRED_DETECTION_TIME = 3;

export const AttendanceSystem = () => {
  const { modelsLoaded, detectFace } = useFaceDetection();
  const { videoRef, startCamera, stopCamera, cameraError, isActive } = useCamera();

  const [faceDetected, setFaceDetected] = useState(false);
  const [detectionTimer, setDetectionTimer] = useState(0);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);

  const detectionIntervalRef = useRef<number | null>(null);
  const timerStartRef = useRef<number | null>(null);

  const loadAttendanceRecords = async () => {
    const { data } = await supabase
      .from('attendance_records')
      .select('*')
      .order('check_in_time', { ascending: false })
      .limit(10);

    if (data) {
      setAttendanceRecords(data);
    }
  };

  const markAttendance = async () => {
    if (!userName.trim()) return;

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('name', userName)
      .maybeSingle();

    let userId = user?.id;

    if (!userId) {
      const { data: newUser } = await supabase
        .from('users')
        .insert({ name: userName, email: `${userName.toLowerCase().replace(/\s+/g, '')}@example.com` })
        .select('id')
        .single();

      userId = newUser?.id;
    }

    if (userId) {
      await supabase.from('attendance_records').insert({
        user_id: userId,
        detection_duration: REQUIRED_DETECTION_TIME,
        status: 'present',
      });

      setAttendanceMarked(true);
      loadAttendanceRecords();

      setTimeout(() => {
        setAttendanceMarked(false);
        setDetectionTimer(0);
        setFaceDetected(false);
      }, 3000);
    }
  };

  const startDetection = async () => {
    if (!videoRef.current || !modelsLoaded) return;

    const detection = await detectFace(videoRef.current);

    if (detection) {
      if (!timerStartRef.current) {
        timerStartRef.current = Date.now();
      }

      const elapsed = Math.floor((Date.now() - timerStartRef.current) / 1000);
      setDetectionTimer(elapsed);
      setFaceDetected(true);

      if (elapsed >= REQUIRED_DETECTION_TIME && !attendanceMarked) {
        await markAttendance();
        stopDetection();
      }
    } else {
      setFaceDetected(false);
      setDetectionTimer(0);
      timerStartRef.current = null;
    }
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    timerStartRef.current = null;
  };

  const handleStartAttendance = async () => {
    if (!userName.trim()) {
      alert('Please enter your name first');
      return;
    }

    setShowNameInput(false);
    await startCamera();
    loadAttendanceRecords();

    detectionIntervalRef.current = window.setInterval(() => {
      startDetection();
    }, 100);
  };

  const handleStop = () => {
    stopDetection();
    stopCamera();
    setShowNameInput(true);
    setDetectionTimer(0);
    setFaceDetected(false);
  };

  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, []);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Smart Attendance System</h1>
          <p className="text-slate-600">Face detection with time-based validation</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Camera Feed
              </h2>
              <div className="flex items-center gap-2">
                {modelsLoaded ? (
                  <span className="text-green-600 text-sm font-medium">Models Ready</span>
                ) : (
                  <span className="text-amber-600 text-sm font-medium">Loading Models...</span>
                )}
              </div>
            </div>

            {showNameInput && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Enter Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                  <Camera className="w-16 h-16 text-slate-600" />
                </div>
              )}
            </div>

            {cameraError && (
              <div className="flex items-center gap-2 text-red-600 mb-4 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">{cameraError}</span>
              </div>
            )}

            <div className="space-y-3">
              {!isActive ? (
                <button
                  onClick={handleStartAttendance}
                  disabled={!modelsLoaded || !userName.trim()}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  Start Attendance
                </button>
              ) : (
                <button
                  onClick={handleStop}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Stop Camera
                </button>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <div className={`p-4 rounded-lg transition-colors ${
                faceDetected ? 'bg-green-50 border-2 border-green-500' : 'bg-slate-50 border-2 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Face Detection</span>
                  <span className={`text-sm font-semibold ${faceDetected ? 'text-green-600' : 'text-slate-500'}`}>
                    {faceDetected ? 'DETECTED' : 'SEARCHING...'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-700 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Detection Timer
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {detectionTimer}s / {REQUIRED_DETECTION_TIME}s
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(detectionTimer / REQUIRED_DETECTION_TIME) * 100}%` }}
                  />
                </div>
              </div>

              {attendanceMarked && (
                <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg animate-pulse">
                  <div className="flex items-center gap-2 text-green-700 font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    Attendance Marked Successfully!
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Recent Attendance
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {attendanceRecords.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No attendance records yet</p>
                </div>
              ) : (
                attendanceRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-800">User ID: {record.user_id.slice(0, 8)}...</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        {record.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatTime(record.check_in_time)}
                      </div>
                      <div>Detection: {record.detection_duration}s</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Keep your face in front of the camera for {REQUIRED_DETECTION_TIME} seconds to mark attendance</p>
        </div>
      </div>
    </div>
  );
};
