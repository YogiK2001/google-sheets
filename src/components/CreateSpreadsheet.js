import React, { useState } from 'react';
import axios from 'axios';

const CreateSpreadsheet = () => {
    const [title, setTitle] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/spreadsheets', { title });
            console.log('New spreadsheet created:', res.data);
            setTitle('');
        } catch (err) {
            console.error('Error creating spreadsheet:', err);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Spreadsheet title"
                required
            />
            <button type="submit">Create Spreadsheet</button>
        </form>
    );
};

export default CreateSpreadsheet;