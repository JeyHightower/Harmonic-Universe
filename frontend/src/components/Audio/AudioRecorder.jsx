import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import ErrorMessage from '../Common/ErrorMessage';
import LoadingSpinner from '../Common/LoadingSpinner';
import './AudioRecorder.css';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const { isPlaying } = useSelector(state => state.audio);

  useEffect(() => {
    // Initialize recorder
    const initializeRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        recorderRef.current = new MediaRecorder(stream);

        recorderRef.current.ondataavailable = e => {
          chunksRef.current.push(e.data);
        };

        recorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          chunksRef.current = [];
        };
      } catch (err) {
        setError('Failed to initialize audio recorder');
        console.error(err);
      }
    };

    initializeRecorder();

    return () => {
      if (recorderRef.current) {
        recorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      if (!recorderRef.current) {
        throw new Error('Recorder not initialized');
      }

      setRecordingTime(0);
      setAudioUrl(null);
      recorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to start recording');
      console.error(err);
    }
  };

  const stopRecording = () => {
    try {
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        recorderRef.current.stop();
        setIsRecording(false);
      }
    } catch (err) {
      setError('Failed to stop recording');
      console.error(err);
    }
  };

  const exportAudio = async format => {
    try {
      setIsExporting(true);
      const response = await fetch(audioUrl);
      const blob = await response.blob();

      // Convert to desired format if needed
      if (format !== 'webm') {
        const audioContext = new AudioContext();
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Create offline context for rendering
        const offlineContext = new OfflineAudioContext(
          2,
          audioBuffer.length,
          audioBuffer.sampleRate
        );

        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start();

        const renderedBuffer = await offlineContext.startRendering();

        // Convert to desired format
        const mediaStreamDest = audioContext.createMediaStreamDestination();
        const mediaRecorder = new MediaRecorder(mediaStreamDest.stream, {
          mimeType: `audio/${format}`,
        });

        const chunks = [];
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const exportedBlob = new Blob(chunks, { type: `audio/${format}` });
          const url = URL.createObjectURL(exportedBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `recording.${format}`;
          a.click();
          URL.revokeObjectURL(url);
        };

        mediaRecorder.start();
        const source2 = audioContext.createBufferSource();
        source2.buffer = renderedBuffer;
        source2.connect(mediaStreamDest);
        source2.start();
        setTimeout(() => mediaRecorder.stop(), renderedBuffer.duration * 1000);
      } else {
        // Download as is for webm
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recording.webm';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Failed to export audio');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isExporting) {
    return <LoadingSpinner text="Exporting audio..." />;
  }

  return (
    <div className="audio-recorder">
      {error && (
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
      )}

      <div className="recorder-controls">
        {!isRecording ? (
          <button
            className="record-button"
            onClick={startRecording}
            disabled={isPlaying}
          >
            Start Recording
          </button>
        ) : (
          <button className="stop-button" onClick={stopRecording}>
            Stop Recording
          </button>
        )}

        <div className="recording-time">
          {isRecording ? formatTime(recordingTime) : '0:00'}
        </div>
      </div>

      {audioUrl && (
        <div className="recording-playback">
          <audio src={audioUrl} controls />
          <div className="export-controls">
            <button onClick={() => exportAudio('wav')}>Export as WAV</button>
            <button onClick={() => exportAudio('mp3')}>Export as MP3</button>
            <button onClick={() => exportAudio('webm')}>Export as WebM</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
