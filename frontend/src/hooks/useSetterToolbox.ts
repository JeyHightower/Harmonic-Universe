import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../types/universal';
import { useState } from 'react';
import { ListSetterEngine, BooleanSetterEngine, ObjectSetterEngine } from '../types/setter';
import type { LoginMethod } from '../types/auth';


const useListSetter = <T>(initialValue: T[] = []) => {
    const [list, setList] = useState<T[]>(initialValue);
    const [error, setError] = useState<string | null>(null);


    const add = (item: T) => {
        setError(null);
        try {
            ListSetterEngine('ADD', setList, item)
        } catch (e) {
            setError(`${e}`);
        }
    };
    const remove = (item: T) => {
        setError(null);
        try {
            ListSetterEngine('REMOVE', setList, item);
        } catch (e) {
            setError(`${e}`);
        }
    };

    const clear = () => {
        setError(null);
        try {
            ListSetterEngine('CLEAR', setList);
        } catch (e) {
            setError(`${e}`);
        }
    };
    const addUnique = (item: T) => {
        setError(null);
        try {
            ListSetterEngine('ADD_UNIQUE', setList, item)
        } catch (e) {
            setError(`${e}`);
        }
    };
    return { list, add, error, remove, clear, addUnique }
}


const useBooleanSetter = (initialValue: boolean = false) => {
    const [boolean, setBoolean] = useState<boolean>(initialValue);
    const [error, setError] = useState<string | null>(null);

 

    const toggle = () => {
        setError(null);
        try {
            BooleanSetterEngine('TOGGLE', setBoolean);
        } catch (e) {
            setError(`${e}`);
        }

    };
    const setTrue = () => {
        setError(null);
        try {
            BooleanSetterEngine('SET_TRUE', setBoolean);

        } catch (e) {
            setError(`${e}`);
        }
    };

    const setFalse = () => {
        setError(null);
        try {
            BooleanSetterEngine('SET_FALSE', setBoolean);
        } catch (e) {
            setError(`${e}`);
        }
    };

    return { boolean, error, toggle, setTrue, setFalse };
}


const useObjectSetter = <T>(initialValue: T) => {
    const [object, setObject] = useState<T>(initialValue);
    const [error, setError] = useState<string | null>(null);



    const updateField = (key: keyof T, value: any) => {
        setError(null);
        try {
            ObjectSetterEngine('UPDATE_FIELD', setObject, key, value);

        } catch (e) {
            setError(`${e}`);
        }
    };
    const reset = () => {
        setError(null);
        try {
            ObjectSetterEngine('RESET', setObject, undefined, initialValue);
        } catch (e) {
            setError(`${e}`);
        }
    }
    const setLoginIdentifier = (method: LoginMethod, value: string) => {
        setError(null);
        try {
            ObjectSetterEngine('SET_LOGIN_IDENTIFIER', setObject, method as keyof T, value)
        } catch (e) {
            setError(`${e}`);
        }
    }
    const addFields = (fields: object) => {
        setError(null);
        try {

            ObjectSetterEngine('ADD_FIELDS', setObject, undefined, fields)
        } catch (e) {
            setError(`${e}`);
        }
    };
    return { object, error, updateField, reset, setLoginIdentifier, addFields };
}







export const useSetterToolbox = () => {
    return {  useObjectSetter, useBooleanSetter, useListSetter }
}

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;