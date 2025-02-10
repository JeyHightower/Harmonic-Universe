import universeReducer, {
    createUniverse,
    deleteUniverse,
    fetchUniverses,
    selectUniverse,
    updateUniverse
} from '../../store/slices/universeSlice'
import { createTestUniverse } from '../utils'

describe('universeSlice', () => {
  const initialState = {
    items: [],
    selectedUniverse: null,
    loading: false,
    error: null
  }

  it('should handle initial state', () => {
    expect(universeReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  describe('fetchUniverses', () => {
    it('should handle pending state', () => {
      const action = { type: fetchUniverses.pending.type }
      const state = universeReducer(initialState, action)

      expect(state.loading).toBe(true)
      expect(state.error).toBe(null)
    })

    it('should handle fulfilled state', () => {
      const mockUniverses = [
        createTestUniverse({ id: 1 }),
        createTestUniverse({ id: 2 })
      ]
      const action = {
        type: fetchUniverses.fulfilled.type,
        payload: mockUniverses
      }
      const state = universeReducer(initialState, action)

      expect(state.loading).toBe(false)
      expect(state.items).toEqual(mockUniverses)
      expect(state.error).toBe(null)
    })

    it('should handle rejected state', () => {
      const errorMessage = 'Failed to fetch universes'
      const action = {
        type: fetchUniverses.rejected.type,
        error: { message: errorMessage }
      }
      const state = universeReducer(initialState, action)

      expect(state.loading).toBe(false)
      expect(state.error).toBe(errorMessage)
    })
  })

  describe('createUniverse', () => {
    it('should handle fulfilled state', () => {
      const newUniverse = createTestUniverse({ id: 1 })
      const action = {
        type: createUniverse.fulfilled.type,
        payload: newUniverse
      }
      const state = universeReducer(initialState, action)

      expect(state.items).toContainEqual(newUniverse)
    })
  })

  describe('updateUniverse', () => {
    it('should handle fulfilled state', () => {
      const initialStateWithUniverse = {
        ...initialState,
        items: [createTestUniverse({ id: 1, name: 'Old Name' })]
      }
      const updatedUniverse = createTestUniverse({ id: 1, name: 'New Name' })
      const action = {
        type: updateUniverse.fulfilled.type,
        payload: updatedUniverse
      }
      const state = universeReducer(initialStateWithUniverse, action)

      expect(state.items[0].name).toBe('New Name')
    })
  })

  describe('deleteUniverse', () => {
    it('should handle fulfilled state', () => {
      const universeId = 1
      const initialStateWithUniverse = {
        ...initialState,
        items: [createTestUniverse({ id: universeId })]
      }
      const action = {
        type: deleteUniverse.fulfilled.type,
        payload: universeId
      }
      const state = universeReducer(initialStateWithUniverse, action)

      expect(state.items).toHaveLength(0)
    })
  })

  describe('selectUniverse', () => {
    it('should set selected universe', () => {
      const universeId = 1
      const action = selectUniverse(universeId)
      const state = universeReducer(initialState, action)

      expect(state.selectedUniverse).toBe(universeId)
    })
  })

  describe('error handling', () => {
    it('should clear error when starting new request', () => {
      const stateWithError = {
        ...initialState,
        error: 'Previous error'
      }
      const action = { type: fetchUniverses.pending.type }
      const state = universeReducer(stateWithError, action)

      expect(state.error).toBe(null)
    })

    it('should preserve existing items on error', () => {
      const existingUniverses = [createTestUniverse({ id: 1 })]
      const stateWithItems = {
        ...initialState,
        items: existingUniverses
      }
      const action = {
        type: fetchUniverses.rejected.type,
        error: { message: 'Error' }
      }
      const state = universeReducer(stateWithItems, action)

      expect(state.items).toEqual(existingUniverses)
    })
  })

  describe('optimistic updates', () => {
    it('should handle create universe optimistically', () => {
      const newUniverse = createTestUniverse({ id: 1 })
      const action = {
        type: createUniverse.pending.type,
        meta: { arg: newUniverse }
      }
      const state = universeReducer(initialState, action)

      expect(state.items).toContainEqual(expect.objectContaining({
        ...newUniverse,
        temporary: true
      }))
    })

    it('should handle update universe optimistically', () => {
      const initialStateWithUniverse = {
        ...initialState,
        items: [createTestUniverse({ id: 1, name: 'Old Name' })]
      }
      const updatedUniverse = { id: 1, name: 'New Name' }
      const action = {
        type: updateUniverse.pending.type,
        meta: { arg: updatedUniverse }
      }
      const state = universeReducer(initialStateWithUniverse, action)

      expect(state.items[0].name).toBe('New Name')
      expect(state.items[0].updating).toBe(true)
    })

    it('should handle delete universe optimistically', () => {
      const universeId = 1
      const initialStateWithUniverse = {
        ...initialState,
        items: [createTestUniverse({ id: universeId })]
      }
      const action = {
        type: deleteUniverse.pending.type,
        meta: { arg: universeId }
      }
      const state = universeReducer(initialStateWithUniverse, action)

      expect(state.items[0].deleting).toBe(true)
    })
  })
})
