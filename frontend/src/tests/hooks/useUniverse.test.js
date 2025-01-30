import { renderHook, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import rootReducer from '../../store/reducers'
import { useUniverse } from '../../hooks/useUniverse'
import { createTestUniverse } from '../utils'

describe('useUniverse', () => {
  const mockStore = configureStore({
    reducer: rootReducer,
    preloadedState: {
      auth: {
        user: { id: 1, username: 'testuser' },
        token: 'test_token'
      },
      universes: {
        items: [createTestUniverse({ id: 1 })],
        selectedUniverse: null,
        loading: false,
        error: null
      }
    }
  })

  const wrapper = ({ children }) => (
    <Provider store={mockStore}>
      {children}
    </Provider>
  )

  it('should fetch universe data', async () => {
    const { result } = renderHook(() => useUniverse(1), { wrapper })

    await act(async () => {
      await result.current.fetchData()
    })

    expect(result.current.universe).toBeTruthy()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should update universe', async () => {
    const { result } = renderHook(() => useUniverse(1), { wrapper })
    const updates = { name: 'Updated Universe' }

    await act(async () => {
      await result.current.updateUniverse(updates)
    })

    expect(result.current.universe.name).toBe('Updated Universe')
  })

  it('should handle update errors', async () => {
    const { result } = renderHook(() => useUniverse(999), { wrapper })
    const updates = { name: 'Updated Universe' }

    await act(async () => {
      await result.current.updateUniverse(updates)
    })

    expect(result.current.error).toBeTruthy()
  })

  it('should delete universe', async () => {
    const { result } = renderHook(() => useUniverse(1), { wrapper })

    await act(async () => {
      await result.current.deleteUniverse()
    })

    expect(result.current.universe).toBe(null)
  })

  it('should handle loading state', () => {
    const loadingStore = configureStore({
      reducer: rootReducer,
      preloadedState: {
        ...mockStore.getState(),
        universes: {
          ...mockStore.getState().universes,
          loading: true
        }
      }
    })

    const loadingWrapper = ({ children }) => (
      <Provider store={loadingStore}>
        {children}
      </Provider>
    )

    const { result } = renderHook(() => useUniverse(1), { wrapper: loadingWrapper })

    expect(result.current.loading).toBe(true)
  })

  it('should handle error state', () => {
    const errorStore = configureStore({
      reducer: rootReducer,
      preloadedState: {
        ...mockStore.getState(),
        universes: {
          ...mockStore.getState().universes,
          error: 'Failed to fetch universe'
        }
      }
    })

    const errorWrapper = ({ children }) => (
      <Provider store={errorStore}>
        {children}
      </Provider>
    )

    const { result } = renderHook(() => useUniverse(1), { wrapper: errorWrapper })

    expect(result.current.error).toBe('Failed to fetch universe')
  })

  it('should handle universe not found', () => {
    const { result } = renderHook(() => useUniverse(999), { wrapper })

    expect(result.current.universe).toBe(null)
    expect(result.current.error).toBe(null)
  })

  it('should update local state', async () => {
    const { result } = renderHook(() => useUniverse(1), { wrapper })

    await act(async () => {
      result.current.setLocalState({ isEditing: true })
    })

    expect(result.current.localState.isEditing).toBe(true)
  })

  it('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useUniverse(1), { wrapper })

    act(() => {
      result.current.setLocalState({ isEditing: true })
    })

    unmount()

    const { result: newResult } = renderHook(() => useUniverse(1), { wrapper })
    expect(newResult.current.localState.isEditing).toBe(false)
  })

  it('should handle concurrent updates', async () => {
    const { result } = renderHook(() => useUniverse(1), { wrapper })

    await act(async () => {
      const update1 = result.current.updateUniverse({ name: 'Update 1' })
      const update2 = result.current.updateUniverse({ name: 'Update 2' })
      await Promise.all([update1, update2])
    })

