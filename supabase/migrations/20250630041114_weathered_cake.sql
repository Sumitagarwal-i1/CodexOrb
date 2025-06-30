/*
  # Fix infinite recursion in session_participants RLS policies

  1. Problem
    - Current RLS policies on session_participants table have circular references
    - SELECT policy references session_participants within its own condition
    - This causes infinite recursion during policy evaluation

  2. Solution
    - Drop existing problematic policies
    - Create simplified policies that avoid circular references
    - Use direct column comparisons instead of complex subqueries where possible

  3. New Policies
    - Users can view participants where they are the user
    - Users can view participants in sessions they own
    - Users can view participants in public sessions
    - Session owners can manage all participants in their sessions
    - Users can join sessions (insert themselves as participants)
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Session owners can manage participants" ON session_participants;
DROP POLICY IF EXISTS "Users can join sessions" ON session_participants;
DROP POLICY IF EXISTS "Users can view participants in sessions they participate in" ON session_participants;

-- Create new simplified policies

-- Policy 1: Users can view their own participant records
CREATE POLICY "Users can view own participant records"
  ON session_participants
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Users can view participants in sessions they own
CREATE POLICY "Users can view participants in owned sessions"
  ON session_participants
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE owner_id = auth.uid()
    )
  );

-- Policy 3: Users can view participants in public sessions
CREATE POLICY "Users can view participants in public sessions"
  ON session_participants
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT id FROM sessions WHERE is_public = true
    )
  );

-- Policy 4: Session owners can manage participants (INSERT, UPDATE, DELETE)
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

-- Policy 5: Users can add themselves as participants
CREATE POLICY "Users can join as participants"
  ON session_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy 6: Users can update their own participant records
CREATE POLICY "Users can update own participant records"
  ON session_participants
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 7: Users can remove themselves from sessions
CREATE POLICY "Users can leave sessions"
  ON session_participants
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());