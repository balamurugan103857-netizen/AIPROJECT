/*
  # Smart Attendance System Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - Unique user identifier
      - `name` (text) - User's full name
      - `email` (text, unique) - User's email address
      - `face_descriptor` (jsonb, nullable) - Stored face encoding for recognition
      - `created_at` (timestamptz) - Account creation timestamp
      
    - `attendance_records`
      - `id` (uuid, primary key) - Unique record identifier
      - `user_id` (uuid, foreign key) - Reference to users table
      - `check_in_time` (timestamptz) - When attendance was marked
      - `detection_duration` (integer) - How long face was detected (seconds)
      - `status` (text) - Attendance status (present, late, etc.)
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to:
      - Read all users
      - Insert and read their own attendance records
      - Read all attendance records (for admin view)
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  face_descriptor jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  check_in_time timestamptz DEFAULT now(),
  detection_duration integer NOT NULL,
  status text DEFAULT 'present',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all user profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read all attendance records"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own attendance"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in_time ON attendance_records(check_in_time DESC);