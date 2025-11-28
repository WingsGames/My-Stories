

import React, { useState, useEffect } from 'react';
import { Story, StorySettings, StoryPage } from '@/types';
import { generateStoryText, generateIllustration } from '@/services/geminiService';
import { getStories, saveStory, deleteStory as deleteStoryFromDb } from '@/services/dbService';
import CreateStoryForm from '@/components/CreateStoryForm';
import StoryViewer from '@/components/StoryViewer';
import Library from '@/components/Library';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null);
  const [view, setView] = useState<'library' | 'create' | 'read'>('library');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');

  // Load stories from IndexedDB on mount
  useEffect(() => {
    const loadStories = async () => {
      try {
        const dbStories = await getStories();
        setStories(dbStories);
      } catch (e) {
        console.error("Failed to load stories from DB", e);
      }
    };
    loadStories();
  }, []);

  const handleCreateStory = async (settings: StorySettings) => {
    setIsGenerating(true);
    setGenerationProgress(settings.language === 'he' ? 'כותב את הסיפור...' : 'Writing the story...');

    try {
      const { title, pages: storyPagesData, styleGuide } = await generateStoryText(
          settings.topic, 
          settings.age, 
          settings.numPages, 
          settings.numIllustrations,
          settings.language
      );
      
      setGenerationProgress(settings.language === 'he' ? 'מצייר את התמונות...' : 'Painting illustrations...');

      const pagesWithImages: StoryPage[] = await Promise.all(
        storyPagesData.map(async (page) => {
          let imageUrl: string | undefined = undefined;
          if (page.imagePrompt && page.imagePrompt.trim().length > 0) {
              imageUrl = await generateIllustration(page.imagePrompt, styleGuide);
          }
          return {
            ...page,
            imageData: imageUrl
          };
        })
      );

      const coverImage = pagesWithImages.find(p => p.imageData)?.imageData;

      const newStory: Story = {
        id: Date.now().toString(),
        title: title,
        topic: settings.topic,
        age: settings.age,
        language: settings.language,
        createdAt: Date.now(),
        pages: pagesWithImages,
        coverImageData: coverImage,
        styleGuide: styleGuide
      };

      await saveStory(newStory);
      setStories(prev => [newStory, ...prev]);
      setCurrentStoryId(newStory.id);
      setView('read');
      
    } catch (error) {
      console.error("Story generation failed", error);
      alert("Something went wrong while creating the magic! Please try again.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (confirm("Are you sure you want to delete this story?")) {
      await deleteStoryFromDb(id);
      setStories(prev => prev.filter(s => s.id !== id));
      if (currentStoryId === id) {
        setView('library');
        setCurrentStoryId(null);
      }
    }
  };
  
  const handleCachePageData = async (storyId: string, pageIndex: number, data: Partial<StoryPage>) => {
    const storyToUpdate = stories.find(s => s.id === storyId);
    if (!storyToUpdate) return;
    
    // Create a new, updated story object immutably to avoid data corruption
    const updatedStory: Story = {
      ...storyToUpdate,
      pages: storyToUpdate.pages.map((page, index) => {
        if (index === pageIndex) {
          return { ...page, ...data };
        }
        return page;
      }),
    };
    
    await saveStory(updatedStory);

    setStories(prevStories => prevStories.map(s => s.id === storyId ? updatedStory : s));
  };

  const currentStory = stories.find(s => s.id === currentStoryId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 font-sans text-gray-800">
      
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        
        <main className="flex-1 flex flex-col">
          
          {view === 'library' && (
            <Library 
              stories={stories} 
              onSelect={(story) => { setCurrentStoryId(story.id); setView('read'); }}
              onDelete={handleDeleteStory}
              onCreateNew={() => setView('create')}
            />
          )}

          {view === 'create' && (
            <div className="flex-1 flex flex-col items-center justify-center p-4">
               {isGenerating ? (
                 <div className="text-center animate-pulse">
                    <div className="relative w-32 h-32 mx-auto mb-8">
                       <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 animate-ping"></div>
                       <div className="relative bg-white p-6 rounded-full shadow-xl">
                          <Sparkles className="w-20 h-20 text-indigo-600 animate-spin-slow" />
                       </div>
                    </div>
                    <h2 className="text-3xl font-bold text-indigo-800 mb-2">
                       {generationProgress}
                    </h2>
                    <p className="text-gray-500">Generating magic with Gemini AI...</p>
                 </div>
               ) : (
                <>
                  <button 
                    onClick={() => setView('library')}
                    className="self-start mb-4 text-indigo-600 font-bold hover:underline px-4 md:ml-20 flex items-center gap-2"
                  >
                     <span>←</span>
                     <span>Back to Library</span>
                  </button>
                  <CreateStoryForm 
                    onCreate={handleCreateStory} 
                    isGenerating={isGenerating} 
                  />
                </>
               )}
            </div>
          )}

          {view === 'read' && currentStory && (
            <StoryViewer 
              story={currentStory} 
              onBack={() => setView('library')} 
              onCachePageData={(pageIndex, data) => handleCachePageData(currentStory.id, pageIndex, data)}
            />
          )}
        </main>

        <footer className="py-4 text-center text-indigo-300 text-sm">
           Powered by Google Gemini
        </footer>
      </div>
    </div>
  );
};

export default App;