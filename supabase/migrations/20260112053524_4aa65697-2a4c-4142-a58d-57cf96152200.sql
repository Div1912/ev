-- Create role_requests table for user role request workflow
CREATE TABLE public.role_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address text NOT NULL,
    requested_role text NOT NULL CHECK (requested_role IN ('issuer', 'verifier', 'admin')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    institution text,
    reason text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, requested_role)
);

-- Enable RLS
ALTER TABLE public.role_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own role requests" 
ON public.role_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can create their own role requests
CREATE POLICY "Users can create role requests" 
ON public.role_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins can view all role requests
CREATE POLICY "Admins can view all role requests" 
ON public.role_requests 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update role requests
CREATE POLICY "Admins can update role requests" 
ON public.role_requests 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_role_requests_updated_at
BEFORE UPDATE ON public.role_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policy for auth_nonces to allow edge function inserts
CREATE POLICY "Service role can manage auth nonces"
ON public.auth_nonces
FOR ALL
USING (true)
WITH CHECK (true);