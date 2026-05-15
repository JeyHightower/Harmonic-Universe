export interface DynamicFormProps {
    type:'user' | 'universe' | 'character' | 'note' | 'location',
    item?: any,
    parentId?: string | number;
    onClose: () => void;
    isOpen: boolean;
    toolbox?: any;
    fields?: any;

}


export interface DynamicModalProps extends DynamicFormProps{}


export interface FormOption {
    value: string;
    label: string;
}

export interface FormField {
    name: string;
    label: string;
    defaultValue?: string | number;
    type?: 'text' | 'textarea' | 'select' | 'number' | 'password';
    placeholder?: string;
    options?: FormOption[]; // Only needed for 'select' types
}