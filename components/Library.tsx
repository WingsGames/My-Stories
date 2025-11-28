import React from 'react';
import { Story, Language } from '@/types';
import { BookOpen, Trash2, Calendar, Clock } from 'lucide-react';

interface Props {
  stories: Story[];
  onSelect: (story: Story) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

const Library: React.FC<Props> = ({ stories, onSelect, onDelete, onCreateNew }) => {
  return (
    <div className="container mx-auto px-4 pb-20 pt-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-indigo-900 drop-shadow-sm flex items-center gap-2">
          <BookOpen className="w-8 h-8" />
          My Library / ספרייה
        </h2>
        <button 
          onClick={onCreateNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-transform hover:scale-105"
        >
          + New Story / חדש
        </button>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-3xl backdrop-blur-sm border-2 border-dashed border-indigo-200">
          <p className="text-2xl text-gray-500 mb-4">No stories yet!</p>
          <p className="text-xl text-gray-400">אין סיפורים עדיין</p>
          <button 
            onClick={onCreateNew}
            className="mt-6 text-indigo-600 font-bold underline hover:text-indigo-800"
          >
            Create your first magical story now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <div 
              key={story.id} 
              className="group bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-transparent hover:border-indigo-400 transition-all hover:shadow-2xl flex flex-col"
            >
              {/* Cover Image (First page image or placeholder) */}
              <div 
                className="h-48 overflow-hidden cursor-pointer relative"
                onClick={() => onSelect(story)}
              >
                <img 
                  src={story.coverImageData || 'https://picsum.photos/400/300'} 
                  alt={story.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 bg-indigo-50"
                />
                <div className="absolute top-2 right-2 bg-white/80 rounded-full px-2 py-1 text-xs font-bold text-indigo-800 shadow">
                   {story.language === Language.HEBREW ? '🇮🇱 HE' : '🇺🇸 EN'}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col" dir={story.language === Language.HEBREW ? 'rtl' : 'ltr'}>
                <h3 
                  onClick={() => onSelect(story)}
                  className="text-xl font-bold text-gray-800 mb-2 cursor-pointer hover:text-indigo-600 line-clamp-2"
                >
                  {story.title}
                </h3>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 mt-auto">
                   <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(story.createdAt).toLocaleDateString()}
                   </div>
                   <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {story.pages.length} pgs
                   </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                   <button 
                    onClick={() => onSelect(story)}
                    className="flex-1 text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2 rounded-lg transition-colors mx-1"
                   >
                     {story.language === Language.HEBREW ? 'קרא עכשיו' : 'Read Now'}
                   </button>
                   <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(story.id); }}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Story"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;