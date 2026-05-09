import { FORM_CONFIG } from "../../helpers";
import type { DynamicModalProps, FormField } from "../../types/dynamicForm";
import styles from '../General.module.css'



export const GenericModal: React.FC<DynamicModalProps> = ({ isOpen, onClose, type, toolbox, fields:customFields, item }) => {

    const { formData, updateField, handleSave } = toolbox;

    const fields = customFields || (FORM_CONFIG as any)[type];


    if (!isOpen || !fields) return null;
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2>{item ? `Edit ${type}` : `Create ${type}`}</h2>

                <form onSubmit={(e) => { e.preventDefault(); handleSave(); onClose(); }}>
                    {fields.map((field: FormField) => (
                        
                        <div key={field.name} className="field-group">
                            <label>{field.label}</label>
                            {field.type === 'textarea' ? (
                                <textarea
                                    value={formData[field.name] || ''}
                                    onChange={(e) => updateField(field.name, e.target.value)}
                                    placeholder={field.placeholder}
                                />
                            ) : field.type === 'select' ? (
                                <select
                                    value={formData?.[field?.name] || ''}
                                    onChange={(e) => {
                                        const raw = e.target.value;
                                        const parsed = Number(raw);
                                        updateField(field.name, isNaN(parsed) || raw === '' ? raw: parsed)}}
                                >
                                    <option value="">{field.placeholder || 'Select an Option'}</option>
                                    {field.options?.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type || 'text'}
                                    value={formData[field?.name] || ''}
                                    onChange={(e) => updateField(field.name, e.target.value)}
                                    placeholder={field.placeholder}
                                />
                            )}
                        </div>
                    ))}

                    <div className="modal-actions">
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </form>

            </div>
        </div>
    )

}