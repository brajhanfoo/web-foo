-- Add the new admin/talent workflow status:
-- received -> in_review -> interview_feedback -> admitted/payment_pending -> enrolled
ALTER TYPE public.application_status
ADD VALUE IF NOT EXISTS 'interview_feedback' AFTER 'in_review';
