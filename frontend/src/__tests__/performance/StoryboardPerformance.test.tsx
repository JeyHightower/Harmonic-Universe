import { act, render } from '@testing-library/react';
import { Profiler, ProfilerOnRenderCallback } from 'react';
import { StoryboardEditor } from '../../components/Storyboard/StoryboardEditor';
import { generateLargeStoryboard, generateManyEffects } from '../fixtures/performanceData';

// Performance thresholds
const RENDER_TIME_THRESHOLD = 100; // ms
const MEMORY_THRESHOLD = 50 * 1024 * 1024; // 50MB
const FPS_THRESHOLD = 30;

describe('Storyboard Performance Tests', () => {
  // Helper to measure render time
  const measureRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions
  ) => {
    expect(actualDuration).toBeLessThan(RENDER_TIME_THRESHOLD);
  };

  // Helper to measure memory usage
  const measureMemory = async () => {
    if ('performance' in window && 'memory' in performance) {
      const memory = (performance as any).memory;
      expect(memory.usedJSHeapSize).toBeLessThan(MEMORY_THRESHOLD);
    }
  };

  // Helper to measure FPS
  const measureFPS = () => {
    let frameCount = 0;
    let lastTime = performance.now();

    return new Promise<number>((resolve) => {
      const countFrames = () => {
        frameCount++;
        const currentTime = performance.now();

        if (currentTime - lastTime >= 1000) {
          const fps = frameCount;
          frameCount = 0;
          lastTime = currentTime;
          resolve(fps);
        } else {
          requestAnimationFrame(countFrames);
        }
      };

      requestAnimationFrame(countFrames);
    });
  };

  it('renders large storyboard efficiently', async () => {
    const largeStoryboard = generateLargeStoryboard(100); // 100 scenes

    const { container } = render(
      <Profiler id="storyboard-large" onRender={measureRender}>
        <StoryboardEditor
          universeId={1}
          storyboardId={1}
          initialData={largeStoryboard}
        />
      </Profiler>
    );

    await measureMemory();

    // Check DOM size
    expect(container.querySelectorAll('*').length).toBeLessThan(5000);
  });

  it('handles many effects smoothly', async () => {
    const manyEffects = generateManyEffects(500); // 500 effects

    const { container } = render(
      <Profiler id="effects-test" onRender={measureRender}>
        <StoryboardEditor
          universeId={1}
          storyboardId={1}
          initialEffects={manyEffects}
        />
      </Profiler>
    );

    await measureMemory();

    // Measure FPS during effect rendering
    const fps = await measureFPS();
    expect(fps).toBeGreaterThan(FPS_THRESHOLD);
  });

  it('maintains performance during timeline scrubbing', async () => {
    const largeStoryboard = generateLargeStoryboard(50);
    const manyEffects = generateManyEffects(200);

    const { container } = render(
      <Profiler id="timeline-test" onRender={measureRender}>
        <StoryboardEditor
          universeId={1}
          storyboardId={1}
          initialData={largeStoryboard}
          initialEffects={manyEffects}
        />
      </Profiler>
    );

    // Simulate timeline scrubbing
    await act(async () => {
      for (let i = 0; i < 100; i++) {
        const event = new CustomEvent('timeupdate', { detail: { currentTime: i } });
        window.dispatchEvent(event);
        await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
      }
    });

    const fps = await measureFPS();
    expect(fps).toBeGreaterThan(FPS_THRESHOLD);
  });

  it('handles rapid scene switching efficiently', async () => {
    const largeStoryboard = generateLargeStoryboard(100);

    const { container } = render(
      <Profiler id="scene-switching" onRender={measureRender}>
        <StoryboardEditor
          universeId={1}
          storyboardId={1}
          initialData={largeStoryboard}
        />
      </Profiler>
    );

    // Simulate rapid scene switching
    await act(async () => {
      for (let i = 0; i < 20; i++) {
        const event = new CustomEvent('scenechange', { detail: { sceneId: i } });
        window.dispatchEvent(event);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    });

    await measureMemory();
    const fps = await measureFPS();
    expect(fps).toBeGreaterThan(FPS_THRESHOLD);
  });

  it('maintains performance during playback with many effects', async () => {
    const manyEffects = generateManyEffects(300);

    const { container } = render(
      <Profiler id="playback-test" onRender={measureRender}>
        <StoryboardEditor
          universeId={1}
          storyboardId={1}
          initialEffects={manyEffects}
        />
      </Profiler>
    );

    // Simulate playback
    await act(async () => {
      const startPlayback = new CustomEvent('playback', { detail: { playing: true } });
      window.dispatchEvent(startPlayback);

      for (let i = 0; i < 300; i++) {
        const timeUpdate = new CustomEvent('timeupdate', { detail: { currentTime: i / 30 } });
        window.dispatchEvent(timeUpdate);
        await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
      }
    });

    const fps = await measureFPS();
    expect(fps).toBeGreaterThan(FPS_THRESHOLD);
  });
});
