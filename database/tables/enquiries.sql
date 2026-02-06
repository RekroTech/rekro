-- Create enquiries table to store property enquiries
CREATE TABLE IF NOT EXISTS enquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,

    -- Contact Information
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,

    -- Metadata
    is_entire_home BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'completed', 'cancelled')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),

    -- Indexes for faster queries
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_enquiries_property_id ON enquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_user_id ON enquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_enquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_enquiries_updated_at
    BEFORE UPDATE ON enquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_enquiries_updated_at();

-- Enable Row Level Security
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own enquiries
CREATE POLICY "Users can view their own enquiries"
    ON enquiries FOR SELECT
    USING (auth.uid() = user_id);

-- Anyone can create an enquiry (even if not authenticated)
CREATE POLICY "Anyone can create enquiries"
    ON enquiries FOR INSERT
    WITH CHECK (true);

-- Users can update their own enquiries
CREATE POLICY "Users can update their own enquiries"
    ON enquiries FOR UPDATE
    USING (auth.uid() = user_id);

-- Landlords can view enquiries for their properties
-- Note: This assumes you have a way to identify landlords for properties
-- You may need to adjust this based on your landlords table structure
CREATE POLICY "Landlords can view enquiries for their properties"
    ON enquiries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM properties p
            WHERE p.id = enquiries.property_id
            AND p.landlord_id = auth.uid()
        )
    );

-- Add comment
COMMENT ON TABLE enquiries IS 'Stores property enquiries from potential tenants';
