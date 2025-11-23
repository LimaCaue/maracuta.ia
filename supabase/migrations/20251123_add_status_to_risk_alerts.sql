ALTER TABLE public.risk_alerts
ADD COLUMN status text NOT NULL DEFAULT 'created';

-- Opcional: limitar valores
ALTER TABLE public.risk_alerts
ADD CONSTRAINT risk_alerts_status_chk CHECK (status IN ('created','processing','resolved','archived'));