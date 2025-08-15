'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';

interface Photo {
  id: number;
  image: string;
  title: string;
  tags: string;
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPhotos() {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/photos/list/');
        setPhotos(response.data);
      } catch (err) {
        console.error('写真の取得エラー:', err);
        setError('写真の読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    }

    fetchPhotos();
  }, []);

  const handleDelete = async (photoId: number) => {
    if (window.confirm('本当にこの写真を削除しますか？')) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/photos/${photoId}/`);
        // 削除成功後、リストを更新
        setPhotos(photos.filter(photo => photo.id !== photoId));
      } catch (err) {
        console.error('写真の削除エラー:', err);
        setError('写真の削除に失敗しました。');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">写真を読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800">フォトギャラリー</h1>
        <a 
          href="/upload" 
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full 
                     shadow-lg hover:shadow-xl transition duration-300 ease-in-out"
        >
          新たな写真を追加する
        </a>
      </div>
      <hr className="my-6 border-gray-300" />
      {photos.length === 0 ? (
        <div className="text-center text-gray-500 text-xl mt-12">
          まだ写真がありません。
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              className="bg-white rounded-xl overflow-hidden shadow-lg 
                         transform transition-transform duration-300 hover:scale-105"
            >
              <Image
                src={photo.image}
                alt={photo.title}
                width={250}
                height={250}
                className="w-full h-auto object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold text-gray-800">{photo.title}</h3>
                <p className="text-sm text-gray-500 mt-2">タグ: {photo.tags}</p>

                <div className="flex mt-4 space-x-2">
                  <a 
                    href={`/edit?id=${photo.id}`} 
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    編集
                  </a>
                  <button 
                    onClick={() => handleDelete(photo.id)} 
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}