import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { debounce } from '../../utils/debounceUtils';
import styles from './VirtualList.module.css';

const BUFFER_SIZE = 5;
const DEFAULT_ITEM_HEIGHT = 120;
const SCROLL_DEBOUNCE_MS = 16; // ~60fps

const VirtualList = ({
  items,
  renderItem,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  overscan = BUFFER_SIZE,
}) => {
  const containerRef = useRef(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  // Memoize calculations
  const totalHeight = useMemo(
    () => items.length * itemHeight,
    [items.length, itemHeight]
  );
  const visibleItems = useMemo(
    () => items.slice(visibleRange.start, visibleRange.end),
    [items, visibleRange]
  );
  const offsetY = useMemo(
    () => visibleRange.start * itemHeight,
    [visibleRange.start, itemHeight]
  );

  const updateVisibleRange = useCallback(
    (height, scroll) => {
      const visibleCount = Math.ceil(height / itemHeight);
      const startIndex = Math.max(
        0,
        Math.floor(scroll / itemHeight) - overscan
      );
      const endIndex = Math.min(
        items.length,
        Math.ceil((scroll + height) / itemHeight) + overscan
      );

      setVisibleRange(prev => {
        if (prev.start === startIndex && prev.end === endIndex) return prev;
        return { start: startIndex, end: endIndex };
      });
    },
    [itemHeight, items.length, overscan]
  );

  // Debounced scroll handler
  const debouncedScroll = useMemo(
    () =>
      debounce(newScrollTop => {
        setScrollTop(newScrollTop);
        updateVisibleRange(containerHeight, newScrollTop);
      }, SCROLL_DEBOUNCE_MS),
    [containerHeight, updateVisibleRange]
  );

  const handleScroll = useCallback(
    e => {
      const newScrollTop = e.target.scrollTop;
      debouncedScroll(newScrollTop);
    },
    [debouncedScroll]
  );

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const { height } = entries[0].contentRect;
      setContainerHeight(height);
      updateVisibleRange(height, scrollTop);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      debouncedScroll.cancel?.();
    };
  }, [scrollTop, updateVisibleRange, debouncedScroll]);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onScroll={handleScroll}
    >
      <div className={styles.content} style={{ height: totalHeight }}>
        <div
          className={styles.items}
          style={{
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleItems.map((item, index) =>
            renderItem(item, visibleRange.start + index)
          )}
        </div>
      </div>
    </div>
  );
};

VirtualList.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  itemHeight: PropTypes.number,
  overscan: PropTypes.number,
};

export default React.memo(VirtualList);
