-- Supabase Schema for Smart OD Management System

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'hod', 'department_admin');
CREATE TYPE faculty_role AS ENUM ('advisor', 'mentor', 'regular');
CREATE TYPE od_event_type AS ENUM ('Symposium', 'Hackathon', 'Workshop', 'Internship', 'Placement', 'Sports', 'Medical', 'Other');
CREATE TYPE od_status AS ENUM ('Pending', 'ActionRequired', 'AdvisorApproved', 'MentorApproved', 'HODApproved', 'Rejected');
CREATE TYPE od_stage AS ENUM ('Advisor', 'Mentor', 'HOD', 'Completed');
CREATE TYPE document_type AS ENUM ('invitation', 'certificate', 'letter', 'other');
CREATE TYPE approval_action AS ENUM ('Approved', 'Rejected', 'RequestedInfo');
CREATE TYPE ai_priority_level AS ENUM ('High Priority', 'Medium Priority', 'Low Priority', 'Suspicious Request');

-- 2. TABLES

-- FACULTY & ADMINS
CREATE TABLE faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE, -- linked to auth.users
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    faculty_type faculty_role DEFAULT 'regular',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE hod (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    department VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE department_admin (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE,
    admin_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STUDENTS
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID UNIQUE, -- linked to auth.users
    register_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    year_of_study INTEGER NOT NULL,
    class_advisor_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    mentor_id UUID REFERENCES faculty(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ATTENDANCE RECORDS (For Subject-wise Attendance Protection)
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_code VARCHAR(20) NOT NULL,
    subject_name VARCHAR(150) NOT NULL,
    total_classes INTEGER DEFAULT 0,
    attended_classes INTEGER DEFAULT 0,
    attendance_percentage NUMERIC(5, 2) GENERATED ALWAYS AS (
        CASE WHEN total_classes > 0 THEN (attended_classes::numeric / total_classes::numeric) * 100 ELSE 0 END
    ) STORED,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, subject_code)
);

-- OD REQUESTS
CREATE TABLE od_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    event_title VARCHAR(250) NOT NULL,
    event_type od_event_type NOT NULL,
    event_date_from DATE NOT NULL,
    event_date_to DATE NOT NULL,
    reason TEXT NOT NULL,
    status od_status DEFAULT 'Pending',
    current_stage od_stage DEFAULT 'Advisor',
    qr_code_id VARCHAR(100) UNIQUE, -- Generated upon final approval
    pdf_url VARCHAR(500), -- Generated permission letter
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DOCUMENTS (Event Certificate Upload)
CREATE TABLE uploaded_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    od_request_id UUID REFERENCES od_requests(id) ON DELETE CASCADE,
    file_name VARCHAR(250) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    doc_type document_type NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MULTI-LEVEL APPROVAL LOGS
CREATE TABLE approval_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    od_request_id UUID REFERENCES od_requests(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL, -- references faculty or hod auth_id/id
    approver_role VARCHAR(50) NOT NULL, -- 'Advisor', 'Mentor', 'HOD'
    action approval_action NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI SMART ANALYSIS LOGS
CREATE TABLE ai_analysis_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    od_request_id UUID REFERENCES od_requests(id) ON DELETE CASCADE UNIQUE,
    ai_priority ai_priority_level NOT NULL,
    fraud_risk_score NUMERIC(3, 2) DEFAULT 0.00, -- 0.00 to 1.00
    attendance_risk_prediction VARCHAR(50) NOT NULL, -- 'Approve', 'Caution', 'Reject'
    ai_reasoning TEXT NOT NULL,
    suspicious_flags JSONB, -- stores array of flags e.g. ["repeated excuse", "copied request"]
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR VERIFICATION LOGS
CREATE TABLE qr_verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    od_request_id UUID REFERENCES od_requests(id) ON DELETE CASCADE,
    scanned_by_auth_id UUID NOT NULL,
    scanner_role VARCHAR(50) NOT NULL,
    ip_or_location VARCHAR(250),
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security) - Basic Setup Setup
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE od_requests ENABLE ROW LEVEL SECURITY;
-- Further granular RLS policies will be added based on department scopes.
