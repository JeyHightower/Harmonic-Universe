import {type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../app/store';
import { useState } from 'react';
import { ListSetterEngine, BooleanSetterEngine, ObjectSetterEngine } from '../types/setter';
import type { LoginMethod } from '../types/auth';




export const useListSetter = <T> (initialValue: T[] = []) => {
    const [list, setList] = useState<T[]>(initialValue);
    
    const add = (item:T) => ListSetterEngine('ADD', setList, item);
    const remove = (item:T) => ListSetterEngine('REMOVE', setList, item);
    const clear = () => ListSetterEngine('CLEAR', setList);
    return { list, add, remove, clear } 
}


export const useBooleanSetter = (initialValue:boolean = false) => {
    const [value, setValue] = useState<boolean>(initialValue);

    const toggle = () => BooleanSetterEngine('TOGGLE' , setValue);
    const setTrue = () => BooleanSetterEngine('SET_TRUE', setValue);
    const setFalse = () => BooleanSetterEngine('SET_FALSE', setValue);
    return { value, toggle, setTrue, setFalse };
}


export const useObjectSetter = <T>(initialValue:T) => {
    const [data, setData] = useState<T>(initialValue);

    const updateField = (key: keyof T, value: any) => ObjectSetterEngine('UPDATE_FIELD', setData, key, value);
    const reset = () => ObjectSetterEngine('RESET', setData, undefined, initialValue);
    const toggleLoginMethod = (method: LoginMethod, value: string) => ObjectSetterEngine('LOGIN_TOGGLE', setData, method as keyof T, value)
    return { data, updateField, reset, toggleLoginMethod };
}


export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;