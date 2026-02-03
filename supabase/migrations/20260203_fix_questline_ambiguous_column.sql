-- ═══════════════════════════════════════════════════════════════════════════
-- Fix: Ambiguous column reference in initialize_questline_progress
-- The RETURNS TABLE columns had the same names as table columns, causing
-- PostgreSQL to be unable to distinguish between the PL/pgSQL variable
-- and the table column.
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop existing functions first (required when changing return types)
DROP FUNCTION IF EXISTS initialize_questline_progress(UUID, TEXT);
DROP FUNCTION IF EXISTS complete_questline_quest(UUID, TEXT, UUID);

-- Recreate initialize_questline_progress with fixed column references
CREATE OR REPLACE FUNCTION initialize_questline_progress(
  p_user_id UUID,
  p_challenge_id TEXT
)
RETURNS TABLE(
  out_quest_id UUID,
  out_sequence_order INTEGER,
  out_status TEXT
) AS $$
DECLARE
  v_first_quest_id UUID;
BEGIN
  -- Get the first quest in the sequence
  SELECT cq.quest_id INTO v_first_quest_id
  FROM challenge_quests cq
  WHERE cq.challenge_id = p_challenge_id
  ORDER BY cq.sequence_order
  LIMIT 1;

  -- Insert progress records for all quests in the challenge
  INSERT INTO user_challenge_quest_progress (user_id, challenge_id, quest_id, status)
  SELECT 
    p_user_id,
    cq.challenge_id,
    cq.quest_id,
    CASE 
      WHEN cq.quest_id = v_first_quest_id THEN 'available'
      ELSE 'locked'
    END
  FROM challenge_quests cq
  WHERE cq.challenge_id = p_challenge_id
  ON CONFLICT (user_id, challenge_id, quest_id) DO NOTHING;

  -- Return the initialized progress with explicit column aliases
  RETURN QUERY
  SELECT 
    ucqp.quest_id AS out_quest_id,
    cq.sequence_order AS out_sequence_order,
    ucqp.status AS out_status
  FROM user_challenge_quest_progress ucqp
  JOIN challenge_quests cq ON cq.quest_id = ucqp.quest_id AND cq.challenge_id = ucqp.challenge_id
  WHERE ucqp.user_id = p_user_id AND ucqp.challenge_id = p_challenge_id
  ORDER BY cq.sequence_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate complete_questline_quest with fixed column references
CREATE OR REPLACE FUNCTION complete_questline_quest(
  p_user_id UUID,
  p_challenge_id TEXT,
  p_quest_id UUID
)
RETURNS TABLE(
  out_next_quest_id UUID,
  out_is_challenge_complete BOOLEAN,
  out_total_quests INTEGER,
  out_completed_quests INTEGER
) AS $$
DECLARE
  v_current_order INTEGER;
  v_next_quest_id UUID;
  v_total_required INTEGER;
  v_total_completed INTEGER;
BEGIN
  -- Mark the current quest as completed
  UPDATE user_challenge_quest_progress
  SET status = 'completed', completed_at = NOW()
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id 
    AND quest_id = p_quest_id
    AND status = 'available';

  -- Get the current quest's order
  SELECT cq.sequence_order INTO v_current_order
  FROM challenge_quests cq
  WHERE cq.challenge_id = p_challenge_id AND cq.quest_id = p_quest_id;

  -- Find and unlock the next quest
  SELECT cq.quest_id INTO v_next_quest_id
  FROM challenge_quests cq
  WHERE cq.challenge_id = p_challenge_id 
    AND cq.sequence_order = v_current_order + 1;

  IF v_next_quest_id IS NOT NULL THEN
    UPDATE user_challenge_quest_progress
    SET status = 'available'
    WHERE user_id = p_user_id 
      AND challenge_id = p_challenge_id 
      AND quest_id = v_next_quest_id
      AND status = 'locked';
  END IF;

  -- Count total and completed quests
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE ucqp.status = 'completed')
  INTO v_total_required, v_total_completed
  FROM user_challenge_quest_progress ucqp
  WHERE ucqp.user_id = p_user_id AND ucqp.challenge_id = p_challenge_id;

  -- Return results with explicit column names
  out_next_quest_id := v_next_quest_id;
  out_is_challenge_complete := (v_total_completed = v_total_required);
  out_total_quests := v_total_required;
  out_completed_quests := v_total_completed;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
