import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';
import Spreadsheet from './components/Spreadsheet';

function App() {
  const [spreadsheetId, setSpreadsheetId] = useState('');

  useEffect(() => {
    // Check if there's an existing spreadsheet ID in local storage
    const existingId = localStorage.getItem('spreadsheetId');
    if (existingId) {
      setSpreadsheetId(existingId);
    } else {
      // Generate a new ID if one doesn't exist
      const newId = uuidv4();
      setSpreadsheetId(newId);
      localStorage.setItem('spreadsheetId', newId);
    }
  }, []);

  return (
    <div className="App">
      <h1>React Sheets</h1>
      <h2>
        Developed by <a href="https://github.com/YogiK2001" target="_blank" rel="noopener noreferrer">YogiK2001</a>
      </h2>
      {spreadsheetId && <Spreadsheet id={spreadsheetId} />}
    </div>
  );
}

export default App;