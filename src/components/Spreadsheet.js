import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './Spreadsheet.css';
import axios from 'axios';

const socket = io('http://localhost:5000', {
    withCredentials: true,
    transports: ['websocket']
});

const Spreadsheet = ({ id }) => {
    const [cells, setCells] = useState({});
    const [activeCell, setActiveCell] = useState(null);
    const [columnWidths, setColumnWidths] = useState({});
    const [headerHeight, setHeaderHeight] = useState(25); // Default header height
    const [shareEmail, setShareEmail] = useState('');
    const [shareAccess, setShareAccess] = useState('view');
    const rows = 20;
    const cols = 26;
    const defaultColumnWidth = 100;
    const resizingRef = useRef(null);

    useEffect(() => {
        const initialCells = {};
        const initialColumnWidths = {};
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                initialCells[`${row}-${col}`] = '';
                if (row === 0) {
                    initialColumnWidths[col] = defaultColumnWidth;
                }
            }
        }
        setCells(initialCells);
        setColumnWidths(initialColumnWidths);

        socket.on('cellUpdated', (data) => {
            setCells(prevCells => ({
                ...prevCells,
                [data.cellId]: data.value
            }));
        });

        return () => {
            socket.off('cellUpdated');
        };
    }, []);

    const handleCellChange = (row, col, value) => {
        const cellId = `${row}-${col}`;
        setCells(prevCells => {
            const newCells = {
                ...prevCells,
                [cellId]: value
            };
            console.log('New cells state:', newCells);
            return newCells;
        });

        socket.emit('cellUpdate', { cellId, value });
    };

    const handleShare = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`/api/spreadsheets/${id}/share`, { email: shareEmail, access: shareAccess });
            alert('Spreadsheet shared successfully');
            setShareEmail('');
        } catch (err) {
            console.error('Error sharing spreadsheet:', err);
            alert('Error sharing spreadsheet');
        }
    };

    const handleCellFocus = (cellId) => {
        setActiveCell(cellId);
    };

    const handleCellBlur = () => {
        setActiveCell(null);
    };

    const startResizing = (col, e, isHeader = false) => {
        e.preventDefault();
        resizingRef.current = {
            col,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: columnWidths[col],
            startHeight: headerHeight,
            isHeader
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);
    };

    const handleMouseMove = (e) => {
        if (!resizingRef.current) return;
        const { col, startX, startY, startWidth, startHeight, isHeader } = resizingRef.current;

        if (isHeader) {
            const newHeight = Math.max(startHeight + e.clientY - startY, 25); // Minimum height of 25px
            setHeaderHeight(newHeight);
        } else {
            const newWidth = Math.max(startWidth + e.clientX - startX, 50); // Minimum width of 50px
            setColumnWidths(prev => ({ ...prev, [col]: newWidth }));
        }
    };

    const stopResizing = () => {
        resizingRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResizing);
    };

    const renderCell = (row, col) => {
        const cellId = `${row}-${col}`;
        const value = cells[cellId] || '';
        const isActive = activeCell === cellId;

        return (
            <div
                key={cellId}
                className="spreadsheet-cell"
                style={{ width: columnWidths[col] }}
            >
                {isActive ? (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleCellChange(row, col, e.target.value)}
                        onBlur={handleCellBlur}
                        autoFocus
                    />
                ) : (
                    <div
                        onClick={() => handleCellFocus(cellId)}
                        className="cell-content"
                    >
                        {value}
                    </div>
                )}
            </div>
        );
    };

    const renderHeaders = () => {
        return (
            <div className="spreadsheet-row header-row" style={{ height: headerHeight }}>
                <div className="corner-cell" style={{ height: headerHeight }}>
                    <div
                        className="row-resize-handle"
                        onMouseDown={(e) => startResizing(null, e, true)}
                    />
                </div>
                {[...Array(cols)].map((_, col) => (
                    <div
                        key={col}
                        className="header-cell"
                        style={{ width: columnWidths[col], height: headerHeight }}
                    >
                        {String.fromCharCode(65 + col)}
                        <div
                            className="column-resize-handle"
                            onMouseDown={(e) => startResizing(col, e)}
                        />
                    </div>
                ))}
            </div>
        );
    };

    const renderRows = () => {
        return [...Array(rows)].map((_, row) => (
            <div key={row} className="spreadsheet-row">
                <div className="row-header">{row + 1}</div>
                {[...Array(cols)].map((_, col) => renderCell(row, col))}
            </div>
        ));
    };

    return (
        <div className="spreadsheet">
            {renderHeaders()}
            <div className="spreadsheet-body">
                {renderRows()}
            </div>
            <form onSubmit={handleShare}>
                <input
                    type="email"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="Email to share with"
                    required
                />
                <select value={shareAccess} onChange={(e) => setShareAccess(e.target.value)}>
                    <option value="view">View</option>
                    <option value="edit">Edit</option>
                </select>
                <button type="submit">Share</button>
            </form>

        </div>
    );
};

export default Spreadsheet;