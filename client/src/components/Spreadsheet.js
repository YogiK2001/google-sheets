import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './Spreadsheet.css';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const socket = io(BACKEND_URL, {
    withCredentials: true,
    transports: ['websocket']
});

const Spreadsheet = ({ id }) => {
    const [cells, setCells] = useState({});
    const [activeCell, setActiveCell] = useState(null);
    const [columnWidths, setColumnWidths] = useState({});
    const [headerHeight, setHeaderHeight] = useState(25);
    const [shareLink, setShareLink] = useState('');
    const [activeUsers, setActiveUsers] = useState([]);
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

        const userId = uuidv4();
        socket.emit('joinSpreadsheet', { spreadsheetId: id, userId });

        socket.on('cellUpdated', (data) => {
            setCells(prevCells => ({
                ...prevCells,
                [data.cellId]: data.value
            }));
        });

        socket.on('activeUsers', (users) => {
            setActiveUsers(users);
        });

        const shareLink = `${process.env.REACT_APP_FRONTEND_URL || window.location.origin}/spreadsheet/${id}`;
        setShareLink(shareLink);

        return () => {
            socket.off('cellUpdated');
            socket.off('activeUsers');
            socket.emit('leaveSpreadsheet', { spreadsheetId: id, userId });
        };
    }, [id]);

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

        socket.emit('cellUpdate', { spreadsheetId: id, cellId, value });
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
        <div>
            <nav>
                <div>Active Users: {activeUsers.length}</div>
                <div>Share Link: <input readOnly value={shareLink} /></div>
            </nav>
            <div className="spreadsheet">
                {renderHeaders()}
                <div className="spreadsheet-body">
                    {renderRows()}
                </div>
            </div>
        </div>
    );
};

export default Spreadsheet;