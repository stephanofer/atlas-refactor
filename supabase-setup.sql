-- =====================================================
-- ATLAS - Enterprise Document Management Platform
-- Database Schema with Row Level Security
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- COMPANIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster company lookups
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);

-- =====================================================
-- USERS TABLE (extends Supabase Auth)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'supervisor', 'user')),
    position VARCHAR(255),
    area_id UUID,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_area ON users(area_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- =====================================================
-- AREAS/DEPARTMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, name)
);

-- Index for areas
CREATE INDEX IF NOT EXISTS idx_areas_company ON areas(company_id);

-- Add foreign key for users.area_id after areas table is created
ALTER TABLE users ADD CONSTRAINT fk_users_area 
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL;

-- =====================================================
-- DOCUMENT CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS document_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default system categories
INSERT INTO document_categories (name, is_system) VALUES
    ('Factura', TRUE),
    ('Orden de compra', TRUE),
    ('Contrato', TRUE),
    ('Reporte', TRUE),
    ('Memorándum', TRUE),
    ('Otro', TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES document_categories(id),
    category VARCHAR(100),
    
    -- Current assignment
    current_area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
    current_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Origin
    origin_area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'archived', 'derived')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ
);

-- Indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_current_area ON documents(current_area_id);
CREATE INDEX IF NOT EXISTS idx_documents_current_user ON documents(current_user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- =====================================================
-- DOCUMENT HISTORY TABLE (Traceability)
-- =====================================================
CREATE TABLE IF NOT EXISTS document_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    
    -- Action details
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'viewed', 'downloaded', 'derived', 'edited', 'status_changed', 'commented')),
    
    -- Derivation details
    from_area_id UUID REFERENCES areas(id),
    to_area_id UUID REFERENCES areas(id),
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID REFERENCES users(id),
    
    -- Additional info
    comment TEXT,
    metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for document history
CREATE INDEX IF NOT EXISTS idx_doc_history_document ON document_history(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_history_company ON document_history(company_id);
CREATE INDEX IF NOT EXISTS idx_doc_history_user ON document_history(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_history_created ON document_history(created_at DESC);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'document')),
    
    -- Related entities
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    action_url TEXT,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION: Get current user's company_id
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
    SELECT company_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =====================================================
-- COMPANIES POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
CREATE POLICY "Users can view their own company" ON companies
    FOR SELECT USING (id = get_user_company_id());

DROP POLICY IF EXISTS "Admins can update their company" ON companies;
CREATE POLICY "Admins can update their company" ON companies
    FOR UPDATE USING (
        id = get_user_company_id() 
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Allow insert during registration (no RLS check needed for new companies)
DROP POLICY IF EXISTS "Allow company creation during registration" ON companies;
CREATE POLICY "Allow company creation during registration" ON companies
    FOR INSERT WITH CHECK (TRUE);

-- =====================================================
-- USERS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view users in their company" ON users;
CREATE POLICY "Users can view users in their company" ON users
    FOR SELECT USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Admins can insert users in their company" ON users;
CREATE POLICY "Admins can insert users in their company" ON users
    FOR INSERT WITH CHECK (
        company_id = get_user_company_id() 
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Allow first user registration" ON users;
CREATE POLICY "Allow first user registration" ON users
    FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Admins can update users in their company" ON users;
CREATE POLICY "Admins can update users in their company" ON users
    FOR UPDATE USING (
        company_id = get_user_company_id()
        AND (
            id = auth.uid() 
            OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        )
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- =====================================================
-- AREAS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view areas in their company" ON areas;
CREATE POLICY "Users can view areas in their company" ON areas
    FOR SELECT USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Admins can manage areas" ON areas;
CREATE POLICY "Admins can manage areas" ON areas
    FOR ALL USING (
        company_id = get_user_company_id()
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- DOCUMENTS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view documents in their company" ON documents;
CREATE POLICY "Users can view documents in their company" ON documents
    FOR SELECT USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can create documents in their company" ON documents;
CREATE POLICY "Users can create documents in their company" ON documents
    FOR INSERT WITH CHECK (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can update documents they have access to" ON documents;
CREATE POLICY "Users can update documents they have access to" ON documents
    FOR UPDATE USING (
        company_id = get_user_company_id()
        AND (
            created_by = auth.uid()
            OR current_user_id = auth.uid()
            OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
        )
    );

DROP POLICY IF EXISTS "Admins can delete documents" ON documents;
CREATE POLICY "Admins can delete documents" ON documents
    FOR DELETE USING (
        company_id = get_user_company_id()
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- DOCUMENT HISTORY POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view history in their company" ON document_history;
CREATE POLICY "Users can view history in their company" ON document_history
    FOR SELECT USING (company_id = get_user_company_id());

DROP POLICY IF EXISTS "Users can create history entries" ON document_history;
CREATE POLICY "Users can create history entries" ON document_history
    FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- =====================================================
-- DOCUMENT CATEGORIES POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view system categories" ON document_categories;
CREATE POLICY "Anyone can view system categories" ON document_categories
    FOR SELECT USING (is_system = TRUE OR company_id = get_user_company_id());

DROP POLICY IF EXISTS "Admins can manage company categories" ON document_categories;
CREATE POLICY "Admins can manage company categories" ON document_categories
    FOR ALL USING (
        company_id = get_user_company_id()
        AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- =====================================================
-- STORAGE BUCKET POLICIES
-- =====================================================

-- Create documents bucket if not exists (run in Dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies (to be created in Supabase Dashboard or via SQL)
-- Users can upload to their company folder
-- Users can read from their company folder

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_areas_updated_at ON areas;
CREATE TRIGGER update_areas_updated_at
    BEFORE UPDATE ON areas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE POLICIES (Run after creating bucket)
-- =====================================================

-- Note: Create the 'documents' bucket first in Supabase Dashboard
-- Then run these policies:


-- Allow authenticated users to upload to their company folder
CREATE POLICY "Users can upload to company folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = (SELECT company_id::text FROM users WHERE id = auth.uid())
);

-- Allow users to read from their company folder
CREATE POLICY "Users can read from company folder"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (SELECT company_id::text FROM users WHERE id = auth.uid())
);

-- Allow users to delete from their company folder (admins only)
CREATE POLICY "Admins can delete from company folder"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = (SELECT company_id::text FROM users WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

