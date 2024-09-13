import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const SpreadsheetList = () => {
    const [spreadsheets, setSpreadsheets] = useState([]);

    useEffect(() => {
        const fetchSpreadsheets = async () => {
            try {
                const res = await axios.get('/api/spreadsheets');
                setSpreadsheets(res.data);
            } catch (err) {
                console.error('Error fetching spreadsheets:', err);
            }
        };
        fetchSpreadsheets();
    }, []);

    return (
        <div>
            <h2>Your Spreadsheets</h2>
            <ul>
                {spreadsheets.map(spreadsheet => (
                    <li key={spreadsheet._id}>
                        <Link to={`/spreadsheet/${spreadsheet._id}`}>{spreadsheet.title}</Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SpreadsheetList;