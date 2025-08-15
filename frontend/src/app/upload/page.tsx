// frontend/src/app/upload/page.tsx
'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(''); 
  const [fileName, setFileName] = useState(''); 
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setFileName(e.target.files[0].name.split('.')[0]); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('ファイルを選択してください。');
      return;
    }

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('title', title || fileName); 
    try {
      await axios.post('http://127.0.0.1:8000/api/photos/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      router.push('/gallery');
    } catch (err) {
      console.error('アップロードエラー:', err);
      setError('ファイルのアップロードに失敗しました。');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">新しい写真をアップロード</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title-input" className="block text-sm font-medium text-gray-700">
              タイトル
            </label>
            <input
              id="title-input"
              type="text"
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder={fileName || 'タイトルを入力してください'} 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
              ファイルを選択
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-violet-50 file:text-violet-700
                         hover:file:bg-violet-100"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={uploading || !file}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md font-semibold
                       hover:bg-blue-600 transition-colors disabled:bg-gray-400"
          >
            {uploading ? 'アップロード中...' : 'アップロード'}
          </button>
        </form>
      </div>
    </div>
  );
}