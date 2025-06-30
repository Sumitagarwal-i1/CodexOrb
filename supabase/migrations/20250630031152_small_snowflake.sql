/*
  # CodexOrb Database Schema

  1. New Tables
    - `sessions`
      - `id` (uuid, primary key)
      - `name` (text, session name)
      - `description` (text, optional description)
      - `owner_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_public` (boolean, public/private session)
      - `language` (text, programming language)

    - `messages`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `user_id` (uuid, references auth.users)
      - `content` (text, message content)
      - `type` (text, message type: user/ai/system)
      - `created_at` (timestamp)
      - `metadata` (jsonb, additional data)

    - `code_files`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `filename` (text, file name)
      - `content` (text, file content)
      - `language` (text, programming language)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `health_score` (numeric, code quality score)
      - `issues` (jsonb, code issues array)

    - `session_participants`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `user_id` (uuid, references auth.users)
      - `role` (text, user role in session)
      - `joined_at` (timestamp)
      - `last_active` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for session participants to access session data
    - Add policies for public sessions to be readable by all users

  3. Indexes
    - Add indexes for frequently queried columns
    - Add composite indexes for session-based queries
*/

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_public boolean DEFAULT false,
  language text DEFAULT 'javascript' CHECK (language IN ('python', 'javascript'))
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'user' CHECK (type IN ('user', 'ai', 'system')),
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create code_files table
CREATE TABLE IF NOT EXISTS code_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  content text NOT NULL DEFAULT '',
  language text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  health_score numeric DEFAULT 85.0 CHECK (health_score >= 0 AND health_score <= 100),
  issues jsonb DEFAULT '[]'::jsonb
);

-- Create session_participants table
CREATE TABLE IF NOT EXISTS session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'developer' CHECK (role IN ('owner', 'developer', 'designer', 'qa', 'viewer')),
  joined_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users can view their own sessions and public sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create their own sessions"
  ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own sessions"
  ON sessions
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
  ON sessions
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in sessions they participate in"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()
    ) OR
    session_id IN (
      SELECT id FROM sessions WHERE is_public = true
    )
  );

CREATE POLICY "Users can create messages in sessions they participate in"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()
    ) OR
    session_id IN (
      SELECT id FROM sessions WHERE owner_id = auth.uid()
    ))
  );

-- Code files policies
CREATE POLICY "Users can view code files in sessions they participate in"
  ON code_files
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()
    ) OR
    session_id IN (
      SELECT id FROM sessions WHERE is_public = true
    )
  );

CREATE POLICY "Users can create code files in sessions they participate in"
  ON code_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()
    ) OR
    session_id IN (
      SELECT id FROM sessions WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update code files in sessions they participate in"
  ON code_files
  FOR UPDATE
  TO authenticated
  USING (
    session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()
    )
  );

-- Session participants policies
CREATE POLICY "Users can view participants in sessions they participate in"
  ON session_participants
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    session_id IN (
      SELECT session_id FROM session_participants WHERE user_id = auth.uid()
    ) OR
    session_id IN (
      SELECT id FROM sessions WHERE is_public = true
    )
  );

CREATE POLICY "Session owners can manage participants"
  ON session_participants
  FOR ALL
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM sessions WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can join sessions"
  ON session_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_owner_id ON sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_is_public ON sessions(is_public) WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_session_created ON messages(session_id, created_at);

CREATE INDEX IF NOT EXISTS idx_code_files_session_id ON code_files(session_id);
CREATE INDEX IF NOT EXISTS idx_code_files_updated_at ON code_files(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_code_files_session_updated ON code_files(session_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_session_user ON session_participants(session_id, user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sessions_updated_at') THEN
    CREATE TRIGGER update_sessions_updated_at
      BEFORE UPDATE ON sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_code_files_updated_at') THEN
    CREATE TRIGGER update_code_files_updated_at
      BEFORE UPDATE ON code_files
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;