

export const useAudioTrigger = (soundSource: string) => {
    const audio = new Audio(soundSource);
    audio.volume = 0.2;

    const play = () => {
        audio.currentTime = 0;
        audio.play().catch(() => {
        })
    }
    return { play };

};