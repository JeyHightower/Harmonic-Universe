import {type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../types/universal';
import { useState } from 'react';
import { ListSetterEngine, BooleanSetterEngine, ObjectSetterEngine } from '../types/setter';
import type { LoginMethod } from '../types/auth';



const useListSetter = <T> (initialValue: T[] = []) => {
    const [list, setList] = useState<T[]>(initialValue);
    
    const add = (item:T) => ListSetterEngine('ADD', setList, item);
    const remove = (item:T) => ListSetterEngine('REMOVE', setList, item);
    const clear = () => ListSetterEngine('CLEAR', setList);
    const addUnique = (item:T) => ListSetterEngine('ADD_UNIQUE', setList, item)
    return { list, add, remove, clear, addUnique } 
}


const useBooleanSetter = (initialValue:boolean = false) => {
    const [boolean, setBoolean] = useState<boolean>(initialValue);
    
    const toggle = () => BooleanSetterEngine('TOGGLE' , setBoolean);
    const setTrue = () => BooleanSetterEngine('SET_TRUE', setBoolean);
    const setFalse = () => BooleanSetterEngine('SET_FALSE', setBoolean);
    return { boolean, toggle, setTrue, setFalse };
}


const useObjectSetter = <T>(initialValue:T) => {
    const [object, setObject] = useState<T>(initialValue);
    
    const updateField = (key: keyof T, value: any) => ObjectSetterEngine('UPDATE_FIELD', setObject, key, value);
    const reset = () => ObjectSetterEngine('RESET', setObject, undefined, initialValue);
    const setLoginIdentifier = (method: LoginMethod, value: string) => ObjectSetterEngine('SET_LOGIN_IDENTIFIER', setObject, method as keyof T, value)
    const addFields = (fields: object) => ObjectSetterEngine('ADD_FIELDS', setObject, undefined, fields )
    return { object, updateField, reset, setLoginIdentifier, addFields };
}


const useAudioTrigger = (soundSource: string) => {
    const audio = new Audio(soundSource);
    audio.volume = 0.2;

    const play = () => {
        audio.currentTime = 0;
        audio.play().catch(() => {

        })
    }

    return { play };
};


export const useUniversalToolbox = ()  => {
return { useObjectSetter, useBooleanSetter, useListSetter, useAudioTrigger}
}

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;