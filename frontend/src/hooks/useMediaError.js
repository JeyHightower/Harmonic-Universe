import { useCallback } from "react";
import errorService from "../services/errorService";
import { APP_CONFIG } from "../utils/config";

/**
 * Custom hook for handling media errors consistently across the application
 */
export function useMediaError({
  context,
  onError,
  onAborted,
  onNetworkError,
  onDecodeError,
  onUnsupportedFormat,
}) {
  const handleError = useCallback(
    (error) => {
      // Create a standardized error object
      const mediaError = {
        name: error.name || "MediaError",
        message: error.message || "A media error occurred",
        code: error.code,
        MEDIA_ERR_ABORTED: error.MEDIA_ERR_ABORTED,
        MEDIA_ERR_NETWORK: error.MEDIA_ERR_NETWORK,
        MEDIA_ERR_DECODE: error.MEDIA_ERR_DECODE,
        MEDIA_ERR_SRC_NOT_SUPPORTED: error.MEDIA_ERR_SRC_NOT_SUPPORTED,
        details: error.details,
        mediaElement: error.mediaElement,
      };

      // Log the error using our error service
      errorService.handleError(mediaError, context, {
        timestamp: new Date().toISOString(),
      });

      // Handle specific media error cases
      if (mediaError.code === mediaError.MEDIA_ERR_ABORTED) {
        // Handle aborted media errors
        if (onAborted) {
          onAborted(mediaError);
        }
        return;
      }

      if (mediaError.code === mediaError.MEDIA_ERR_NETWORK) {
        // Handle network errors
        if (onNetworkError) {
          onNetworkError(mediaError);
        }
        return;
      }

      if (mediaError.code === mediaError.MEDIA_ERR_DECODE) {
        // Handle decode errors
        if (onDecodeError) {
          onDecodeError(mediaError);
        }
        return;
      }

      if (mediaError.code === mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        // Handle unsupported format errors
        if (onUnsupportedFormat) {
          onUnsupportedFormat(mediaError);
        }
        return;
      }

      // Call the onError callback if provided
      if (onError) {
        onError(mediaError);
      }
    },
    [
      context,
      onError,
      onAborted,
      onNetworkError,
      onDecodeError,
      onUnsupportedFormat,
    ]
  );

  const isMediaError = useCallback((error) => {
    return (
      error.name === "MediaError" ||
      error.code === error.MEDIA_ERR_ABORTED ||
      error.code === error.MEDIA_ERR_NETWORK ||
      error.code === error.MEDIA_ERR_DECODE ||
      error.code === error.MEDIA_ERR_SRC_NOT_SUPPORTED ||
      error.message?.toLowerCase().includes("media")
    );
  }, []);

  const isAbortedError = useCallback((error) => {
    return (
      error.code === error.MEDIA_ERR_ABORTED ||
      error.message?.toLowerCase().includes("aborted")
    );
  }, []);

  const isNetworkError = useCallback((error) => {
    return (
      error.code === error.MEDIA_ERR_NETWORK ||
      error.message?.toLowerCase().includes("network")
    );
  }, []);

  const isDecodeError = useCallback((error) => {
    return (
      error.code === error.MEDIA_ERR_DECODE ||
      error.message?.toLowerCase().includes("decode")
    );
  }, []);

  const isUnsupportedFormatError = useCallback((error) => {
    return (
      error.code === error.MEDIA_ERR_SRC_NOT_SUPPORTED ||
      error.message?.toLowerCase().includes("unsupported")
    );
  }, []);

  const getErrorMessage = useCallback((error) => {
    switch (error.code) {
      case error.MEDIA_ERR_ABORTED:
        return "Media playback was aborted.";
      case error.MEDIA_ERR_NETWORK:
        return "A network error occurred while loading the media. Please check your internet connection.";
      case error.MEDIA_ERR_DECODE:
        return "The media file is corrupted or in an unsupported format.";
      case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return "The media format is not supported by your browser.";
      default:
        return error.message || "An error occurred while playing the media.";
    }
  }, []);

  const getSupportedFormats = useCallback(() => {
    const video = document.createElement("video");
    const audio = document.createElement("audio");
    const formats = {
      video: [],
      audio: [],
    };

    // Check video formats
    if (video.canPlayType("video/mp4")) formats.video.push("MP4");
    if (video.canPlayType("video/webm")) formats.video.push("WebM");
    if (video.canPlayType("video/ogg")) formats.video.push("Ogg");

    // Check audio formats
    if (audio.canPlayType("audio/mpeg")) formats.audio.push("MP3");
    if (audio.canPlayType("audio/ogg")) formats.audio.push("Ogg");
    if (audio.canPlayType("audio/wav")) formats.audio.push("WAV");

    return formats;
  }, []);

  return {
    handleError,
    isMediaError,
    isAbortedError,
    isNetworkError,
    isDecodeError,
    isUnsupportedFormatError,
    getErrorMessage,
    getSupportedFormats,
  };
}
