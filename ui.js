/* БЛОК ВРЕМЕНИ */
.available-time {
    margin-bottom: 25px;
    padding: 20px;
    background: #1a1a1a;
    border-radius: 12px;
    border-left: 4px solid #0066ff;
}

.time-selector {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 15px;
}

.time-label {
    font-size: 14px;
    color: #888;
    font-weight: 500;
    text-transform: uppercase;
}

.time-btn {
    background: #0a0a0a;
    border: 2px solid #333;
    color: #fff;
    padding: 12px 25px;
    border-radius: 10px;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.2s;
    min-width: 100px;
}

.time-btn:hover {
    border-color: #0066ff;
    transform: scale(1.05);
}

.time-btn.selected {
    background: #0066ff;
    border-color: #0066ff;
    color: white;
}

.no-time {
    text-align: center;
    padding: 25px;
    color: #888;
    font-size: 18px;
    border: 2px dashed #333;
    border-radius: 10px;
}

@media (max-width: 768px) {
    .time-selector {
        flex-direction: column;
    }
    .time-btn {
        width: 100%;
    }
}
