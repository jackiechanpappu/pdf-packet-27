-- Enable Row Level Security on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (name) DO NOTHING;

-- Policy: Allow authenticated users to view documents
CREATE POLICY "Allow public read access to documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Policy: Allow authenticated users to upload documents
CREATE POLICY "Allow authenticated uploads to documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN ('structural-floor', 'underlayment')
);

-- Policy: Allow users to update their own uploads
CREATE POLICY "Allow users to update their own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.uid() = owner)
WITH CHECK (bucket_id = 'documents');

-- Policy: Allow users to delete their own uploads
CREATE POLICY "Allow users to delete their own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid() = owner);
