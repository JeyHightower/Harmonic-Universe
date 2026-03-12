type ListAction = 'ADD' | 'REMOVE' | 'CLEAR';
type BooleanAction = 'TOGGLE' | 'SET_TRUE' | 'SET_FALSE';
type ObjectAction = 'UPDATE_FIELD' | 'RESET' | 'SET_LOGIN_IDENTIFIER' | 'ADD_FIELDS';

export const ListSetterEngine = <T> (
    action: ListAction, 
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    item?: T
) => {
    switch(action){
        case 'ADD':
            if (item != undefined) setter(prev => [...prev, item]);
            break;
        case 'REMOVE':
            setter(prev => prev.filter((i) => i !== item));
            break;
        
        case 'CLEAR':
            setter([]);
            break;
    }
}


export const BooleanSetterEngine = (
    action: BooleanAction,
    setter: React.Dispatch<React.SetStateAction<boolean>>
) => {
    switch(action){
        case 'TOGGLE':
            setter(prev => !prev);
            break;
        case 'SET_TRUE':
            setter(true);
            break;
        case 'SET_FALSE':
            setter(false);
            break;
    }
}

export const ObjectSetterEngine = <T> (
    action: ObjectAction,
    setter: React.Dispatch<React.SetStateAction<T>>,
    key?: keyof T,
    value?: any
) => {
    switch(action){
        case 'UPDATE_FIELD':
            if (key != undefined)
            setter(prev => ({...prev, [key]:value}));
            break;
        case 'SET_LOGIN_IDENTIFIER':
            if (key !== undefined){
                setter(prev => {
                    const base = { ...prev, password: (prev as any).password };
                    return (key === 'username'
                        ? { ...base, username: value, email: undefined }
                        : { ...base, email: value, username: undefined }  
                    ) as unknown as T;
                  });
            }
            break;
        case 'ADD_FIELDS':
            if(value && typeof value === 'object'){
                setter(prev => ({
                    ...prev,
                    ...value
                }));
            }
            break;
        case 'RESET':
            if (value != undefined)
                setter(value);
            break;
    }
}


