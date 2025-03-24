import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../store/authThunks.js';
import '../styles/modal.css';

const LoginModal = ({ onClose }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const resultAction = await dispatch(login(formData));
            if (login.fulfilled.match(resultAction)) {
                onClose();
                navigate('/dashboard');
            } else {
                setError(resultAction.error.message);
            }
        } catch (err) {
            setError('An error occurred during login');
        }
    };

    return (
        <div className="modal-inner">
            <h2>Login</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-actions">
                    <button type="submit" className="button button-primary">
                        Login
                    </button>
                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

LoginModal.propTypes = {
    onClose: PropTypes.func.isRequired,
};

export default LoginModal;
