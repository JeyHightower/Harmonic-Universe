import { registerUser } from '../../features/Auth/authActions';
import { useAppDispatch, useSetterToolbox } from '../../hooks/useSetterToolbox';
import type { UserDraft } from '../../types/user';


export const Register = () => {
    const dispatch = useAppDispatch();
    const { useObjectSetter } = useSetterToolbox();
    const { object: form, updateField } = useObjectSetter(
        {
            name: '',
            username: '',
            email: '',
            password: '',
            bio: '',
            is_admin: false
        }
    );

    const registrationFields = [
        { id: 'name', type: 'text', label: 'Name', placeholder: 'Enter Your Name' },
        { id: 'username', type: 'text', label: 'Username', placeholder: 'Enter Your Username' },
        { id: 'email', type: 'email', label: 'Email', placeholder: 'Enter Your Email' },
        { id: 'password', type: 'password', label: 'Password', placeholder: 'Enter Your Password' },
        { id: 'bio', type: 'text', label: 'Bio', placeholder: 'Enter Your Bio (optional)' },
        { id: 'is_admin', type: 'checkbox', label: 'Grant Admin Privileges.' }

    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(registerUser(form as UserDraft))
    }

    return (
        <div className="registerPage">
            <div className="registerCard">
                <h2> Create Account</h2>
                <p className="subtitle">Start Building Your Universe. </p>
        <form className="registrationForm" onSubmit={handleSubmit}>
            {registrationFields.map((field) => (
                <div key={field.id} className="inputGroup">
                    <label htmlFor={field.label}>{field.label}</label>
                    <input
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={field.type !== 'checkbox' ? (form[field.id as keyof UserDraft] as string) : undefined}
                        checked={field.type === 'checkbox' ? (form[field.id as keyof UserDraft] as boolean) : undefined}
                        onChange={(e) => {
                            const val = field.type === 'checkbox' ? e.target.checked : e.target.value;
                            updateField(field.id as keyof UserDraft, val)
                        }}
                        />

                </div>
            ))}
            <button type='submit'>Register</button>
        </form>
            </div>
        </div>

    );
};