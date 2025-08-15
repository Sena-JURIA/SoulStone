'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';

interface Photo {
  id: number;
  title: string;
  image: string;
  tags: string;
}

export default function EditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [retagging, setRetagging] = useState(false);

  useEffect(() => {
    if (id) {
      async function fetchPhoto() {
        try {
          const response = await axios.get(`http://127.0.0.1:8000/api/photos/${id}/`);
          setPhoto(response.data);
          setTitle(response.data.title);
          setTags(response.data.tags);
        } catch (err) {
          setError('写真の取得に失敗しました。');
          console.error('Failed to fetch photo:', err);
        } finally {
          setLoading(false);
        }
      }
      fetchPhoto();
    }
  }, [id]);

  const handleSave = async () => {
    if (!photo) return;

    setSaving(true);
    try {
      await axios.put(`http://127.0.0.1:8000/api/photos/${photo.id}/`, {
        title,
        tags,
      });
      router.push('/gallery');
    } catch (err) {
      setError('更新に失敗しました。');
      console.error('Failed to update photo:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRetag = async () => {
    if (!photo) return;
    setRetagging(true);
    setError(null);
    try {
      const response = await axios.post(`http://127.0.0.1:8000/api/photos/${photo.id}/retag/`);
      setTags(response.data.tags); // 新しいタグに更新
      router.push('/gallery'); // ギャラリーに戻る
    } catch (err) {
      setError('タグの再生成に失敗しました。');
      console.error('Failed to retag photo:', err);
    } finally {
      setRetagging(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-10">読み込み中...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }
  
  if (!photo) {
      return <div className="text-center mt-10">写真が見つかりません。</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">写真の編集</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4 text-center">
          <img src={photo.image} alt={photo.title} className="max-w-full h-auto rounded-lg mx-auto" />
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">タグ</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="flex justify-between mt-6">
            <button
              onClick={() => router.back()}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={handleRetag} // ← 再タグ付けボタンのハンドラー
              disabled={retagging}
              className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
            >
              {retagging ? '再生成中...' : 'タグを再生成'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}