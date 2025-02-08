import { selectCurrentUser } from '@/store/slices/authSlice';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Tone from 'tone';

const MUSIC_STYLES = ['ambient', 'electronic', 'classical', 'jazz', 'cinematic', 'experimental'];

const MOODS = ['calm', 'energetic', 'melancholic', 'uplifting', 'mysterious', 'intense'];

const MusicGenerator = ({ onGeneratedAudio }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState('ambient');
  const [selectedMood, setSelectedMood] = useState('calm');
  const [parameters, setParameters] = useState({
    tempo: 120,
    complexity: 0.5,
    harmony: 0.5,
    rhythm: 0.5,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef(null);
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);

  useEffect(() => {
    // Initialize Tone.js
    const player = new Tone.Player().toDestination();
    playerRef.current = player;

    return () => {
      player.dispose();
    };
  }, []);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      // Make API call to AI music generation service
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          style: selectedStyle,
          mood: selectedMood,
          parameters,
          userId: currentUser?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate music');
      }

      const audioData = await response.blob();
      clearInterval(progressInterval);
      setProgress(100);

      // Create audio URL and update player
      const audioUrl = URL.createObjectURL(audioData);
      playerRef.current.load(audioUrl).then(() => {
        setIsPlaying(true);
        playerRef.current.start();
      });

      // Notify parent component
      onGeneratedAudio(audioData);
    } catch (error) {
      console.error('Error generating music:', error);
      // Handle error state
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.stop();
    } else {
      playerRef.current.start();
    }
    setIsPlaying(!isPlaying);
  };

  const handleParameterChange = (name, value) => {
    setParameters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold">AI Music Generator</h2>

      {/* Style and Mood Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
          <select
            value={selectedStyle}
            onChange={e => setSelectedStyle(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {MUSIC_STYLES.map(style => (
              <option key={style} value={style}>
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mood</label>
          <select
            value={selectedMood}
            onChange={e => setSelectedMood(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {MOODS.map(mood => (
              <option key={mood} value={mood}>
                {mood.charAt(0).toUpperCase() + mood.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Parameters */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tempo: {parameters.tempo} BPM
          </label>
          <input
            type="range"
            min="60"
            max="180"
            value={parameters.tempo}
            onChange={e => handleParameterChange('tempo', Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Complexity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={parameters.complexity}
            onChange={e => handleParameterChange('complexity', Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Harmony</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={parameters.harmony}
            onChange={e => handleParameterChange('harmony', Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rhythm</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={parameters.rhythm}
            onChange={e => handleParameterChange('rhythm', Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Music'}
        </button>
        {playerRef.current && (
          <button
            onClick={handlePlayPause}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full bg-gray-200 rounded-full h-2.5 mt-4"
          >
            <motion.div
              className="bg-blue-500 h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MusicGenerator;
