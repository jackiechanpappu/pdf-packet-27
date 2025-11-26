-- Enable Row Level Security on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public access to view files (adjust as needed for your security requirements)
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

-- Allow authenticated users to upload files to the documents bucket
CREATE POLICY "Allow uploads to documents bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- Allow authenticated users to update/delete their own files
CREATE POLICY "Allow updates to own files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner);

CREATE POLICY "Allow deletes of own files" ON storage.objects
  FOR DELETE TO authenticated
  USING (auth.uid() = owner);

-- Create the documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;
