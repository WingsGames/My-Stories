
import React, { useState, useEffect, useRef } from 'react';
import { Story, Language, StoryPage } from '@/types';
import { ChevronLeft, ChevronRight, Home, Volume2, StopCircle, Loader2, Download } from 'lucide-react';
import { generateSpeech, generateIllustration } from '@/services/geminiService';
import { decodeBase64, decodeAudioData, encodeToBase64 } from '@/services/audioUtils';

interface Props {
  story: Story;
  onBack: () => void;
  onCachePageData: (pageIndex: number, data: Partial<StoryPage>) => void;
}

const StoryViewer: React.FC<Props> = ({ story, onBack, onCachePageData }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const isRtl = story.language === Language.HEBREW;
  const page = story.pages[currentPage];

  useEffect(() => {
    const currentPageData = story.pages[currentPage];
    if (currentPageData && currentPageData.imagePrompt && !currentPageData.imageData) {
        setIsImageLoading(true);
        generateIllustration(currentPageData.imagePrompt, story.styleGuide || 'Childrens book illustration, colorful, vector style')
            .then(imageData => {
                onCachePageData(currentPage, { imageData });
            })
            .catch(err => console.error("Failed to regenerate illustration", err))
            .finally(() => setIsImageLoading(false));
    } else {
        setIsImageLoading(false);
    }
  }, [currentPage, story.pages, story.styleGuide, onCachePageData]);


  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    stopAudio();
  }, [currentPage]);

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.onended = null;
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const playAudio = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    setAudioLoading(true);
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      let audioDataBuffer: ArrayBuffer | undefined = page.audioData;

      if (!audioDataBuffer) {
        const base64Audio = await generateSpeech(page.text, story.language);
        if (base64Audio) {
            const buffer = decodeBase64(base64Audio).buffer;
            onCachePageData(currentPage, { audioData: buffer });
            audioDataBuffer = buffer;
        }
      }

      if (audioDataBuffer && audioContextRef.current) {
        const audioBuffer = await decodeAudioData(
            new Uint8Array(audioDataBuffer), 
            audioContextRef.current,
            24000
        );
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            setIsPlaying(false);
            sourceNodeRef.current = null;
        };
        source.start(0);
        sourceNodeRef.current = source;
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Error playing audio", err);
      setIsPlaying(false);
    } finally {
      setAudioLoading(false);
    }
  };

  const handleNext = () => {
    if (currentPage < story.pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleDownload = () => {
    try {
        const storyForJson = {
            ...story,
            pages: story.pages.map(p => ({
                ...p,
                // Convert ArrayBuffer to base64 string for serialization
                audioData: p.audioData ? encodeToBase64(p.audioData) : undefined,
            })),
        };

        const jsonString = JSON.stringify(storyForJson, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'story'}.json`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to download story:", error);
        alert("Could not download the story.");
    }
  };
  
  if (!page) return null;
  const hasImage = !!page.imagePrompt;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full">
      <div className="flex justify-between items-center p-4 bg-white/80 backdrop-blur rounded-b-2xl shadow-sm mb-4 mx-2">
        <button 
          onClick={() => { stopAudio(); onBack(); }}
          className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-full transition"
        >
          <Home className="w-5 h-5" />
          {story.language === Language.HEBREW ? 'חזרה' : 'Home'}
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-indigo-900 text-center truncate px-4">
          {story.title}
        </h1>
        <button
            onClick={handleDownload}
            className="flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-full transition"
            title={story.language === Language.HEBREW ? 'הורדת סיפור' : 'Download Story'}
        >
            <Download className="w-5 h-5" />
            <span className="hidden md:inline">{story.language === Language.HEBREW ? 'הורדה' : 'Download'}</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start md:justify-center p-2 md:p-4">
        <div className={`relative w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[60vh] md:h-[650px] transition-all duration-500 ${hasImage ? 'md:flex-row' : 'justify-center items-center bg-yellow-50/50'}`}>
          
          {hasImage && (
            <div className="w-full md:w-1/2 h-64 md:h-full bg-indigo-50 relative overflow-hidden group flex items-center justify-center">
              {isImageLoading ? (
                  <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
              ) : page.imageData ? (
                <img 
                  src={page.imageData} 
                  alt={page.imagePrompt || "Story illustration"}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              ) : null }
            </div>
          )}

          <div 
            className={`flex flex-col justify-center items-center p-6 md:p-12 transition-all ${
                hasImage ? 'w-full md:w-1/2' : 'w-full max-w-2xl bg-[url("https://www.transparenttextures.com/patterns/cream-paper.png")]'
            }`}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="mb-6 text-indigo-300 font-bold uppercase tracking-widest text-xs">
              {story.language === Language.HEBREW ? 'עמוד' : 'Page'} {currentPage + 1} / {story.pages.length}
             </div>

            <p className={`${hasImage ? 'text-lg md:text-xl' : 'text-xl md:text-3xl'} leading-loose text-gray-800 font-serif text-center`}>
              {page.text}
            </p>

            <div className="mt-10">
              <button
                onClick={playAudio}
                disabled={audioLoading}
                className={`p-4 rounded-full transition-all shadow-lg flex items-center gap-2 transform hover:scale-105 ${
                  isPlaying 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                }`}
              >
                {audioLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : isPlaying ? (
                  <StopCircle className="w-8 h-8" />
                ) : (
                  <Volume2 className="w-8 h-8" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 flex justify-between items-center max-w-3xl mx-auto w-full">
        <button
          onClick={handlePrev}
          disabled={currentPage === 0}
          className={`p-4 rounded-full shadow-lg transition-transform hover:scale-110 ${
            currentPage === 0 
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
            : 'bg-white text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          {isRtl ? <ChevronRight className="w-8 h-8" /> : <ChevronLeft className="w-8 h-8" />}
        </button>

        <div className="w-full mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
             <div 
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${((currentPage + 1) / story.pages.length) * 100}%`}}
             />
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === story.pages.length - 1}
          className={`p-4 rounded-full shadow-lg transition-transform hover:scale-110 ${
            currentPage === story.pages.length - 1
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
            : 'bg-white text-indigo-600 hover:bg-indigo-50'
          }`}
        >
          {isRtl ? <ChevronLeft className="w-8 h-8" /> : <ChevronRight className="w-8 h-8" />}
        </button>
      </div>
    </div>
  );
};

export default StoryViewer;