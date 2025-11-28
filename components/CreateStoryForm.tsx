
import React, { useState, useEffect } from 'react';
import { Language, StorySettings } from '@/types';
import { Wand2, Dice5, Layers, Image as ImageIcon } from 'lucide-react';

interface Props {
  onCreate: (settings: StorySettings) => void;
  isGenerating: boolean;
}

const TOPIC_SUGGESTIONS = [
  "A brave little toaster",
  "A cat who wants to fly",
  "The lost dinosaur",
  "A magical forest party",
  "The robot who loved flowers",
  "A journey to the moon",
  "The boy who could talk to fish",
  "Princess and the dragon best friend"
];

const HEBREW_TOPICS = [
  "הטוסטר האמיץ הקטן",
  "חתול שרצה לעוף",
  "הדינוזאור האבוד",
  "מסיבה ביער הקסום",
  "הרובוט שאהב פרחים",
  "מסע אל הירח",
  "הילד שיכל לדבר עם דגים",
  "הנסיכה והדרקון החברים"
];

const CreateStoryForm: React.FC<Props> = ({ onCreate, isGenerating }) => {
  const [age, setAge] = useState<number>(5);
  const [topic, setTopic] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(5);
  const [numIllustrations, setNumIllustrations] = useState<number>(5);
  const [language, setLanguage] = useState<Language>(Language.HEBREW);

  // Ensure illustrations don't exceed pages
  useEffect(() => {
    if (numIllustrations > numPages) {
      setNumIllustrations(numPages);
    }
  }, [numPages, numIllustrations]);

  const handleRandomTopic = () => {
    const list = language === Language.HEBREW ? HEBREW_TOPICS : TOPIC_SUGGESTIONS;
    const random = list[Math.floor(Math.random() * list.length)];
    setTopic(random);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    onCreate({ age, topic, numPages, numIllustrations, language });
  };

  const isRtl = language === Language.HEBREW;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl p-8 border-4 border-indigo-100">
      <h2 className="text-3xl font-bold text-center text-indigo-600 mb-6 flex items-center justify-center gap-2">
        <Wand2 className="w-8 h-8" />
        {language === Language.HEBREW ? 'יצירת סיפור קסום' : 'Create Magical Story'}
      </h2>

      <form onSubmit={handleSubmit} dir={isRtl ? 'rtl' : 'ltr'} className="space-y-8">
        
        {/* Language Selection */}
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={() => setLanguage(Language.HEBREW)}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              language === Language.HEBREW 
              ? 'bg-indigo-600 text-white shadow-lg scale-105' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            עברית 🇮🇱
          </button>
          <button
            type="button"
            onClick={() => setLanguage(Language.ENGLISH)}
            className={`px-6 py-2 rounded-full font-bold transition-all ${
              language === Language.ENGLISH 
              ? 'bg-indigo-600 text-white shadow-lg scale-105' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            English 🇺🇸
          </button>
        </div>

        {/* Topic Input */}
        <div>
          <label className="block text-gray-700 font-bold mb-2">
            {language === Language.HEBREW ? 'על מה הסיפור?' : 'What is the story about?'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={language === Language.HEBREW ? 'למשל: ארנב בחלל...' : 'e.g., A rabbit in space...'}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-colors"
              required
            />
            <button
              type="button"
              onClick={handleRandomTopic}
              className="p-3 bg-yellow-400 hover:bg-yellow-500 text-white rounded-xl shadow-md transition-colors"
              title="Random Topic"
            >
              <Dice5 className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Age Input */}
            <div>
            <label className="block text-gray-700 font-bold mb-2">
                {language === Language.HEBREW ? 'גיל הילד/ה:' : "Child's Age:"} <span className="text-indigo-600">{age}</span>
            </label>
            <input
                type="range"
                min="2"
                max="12"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full h-3 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>2</span>
                <span>12</span>
            </div>
            </div>

             {/* Page Count */}
             <div>
                <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    {language === Language.HEBREW ? 'מספר עמודים:' : 'Number of Pages:'} 
                    <span className="text-indigo-600">{numPages}</span>
                </label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="1"
                        max="30"
                        value={numPages}
                        onChange={(e) => setNumPages(Number(e.target.value))}
                        className="flex-1 h-3 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>30</span>
                </div>
            </div>
        </div>

        {/* Illustrations Count */}
        <div>
            <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-500" />
                {language === Language.HEBREW ? 'מספר איורים:' : 'Number of Illustrations:'} 
                <span className="text-indigo-600">{numIllustrations}</span>
            </label>
            <div className="flex items-center gap-4">
                <input
                    type="range"
                    min="0"
                    max={numPages}
                    value={numIllustrations}
                    onChange={(e) => setNumIllustrations(Number(e.target.value))}
                    className="flex-1 h-3 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>{numPages}</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
                {language === Language.HEBREW 
                    ? (numIllustrations === 0 ? 'ללא תמונות' : numIllustrations === numPages ? 'תמונה לכל עמוד' : 'חלק מהעמודים יהיו ללא תמונה')
                    : (numIllustrations === 0 ? 'No illustrations' : numIllustrations === numPages ? 'Image for every page' : 'Some pages will have no image')
                }
            </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isGenerating}
          className={`w-full py-4 rounded-xl text-white font-bold text-xl shadow-lg transition-all transform hover:-translate-y-1 ${
            isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin text-2xl">✨</span>
              {language === Language.HEBREW ? 'הקסם קורה...' : 'Magic is happening...'}
            </span>
          ) : (
            <span>{language === Language.HEBREW ? 'צור סיפור!' : 'Create Story!'}</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateStoryForm;