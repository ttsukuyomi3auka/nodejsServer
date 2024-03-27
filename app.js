const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { initTicTacToe } = require('./ticTacToe');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const port = 3000;

let gameStates = {};
let activeSessions = {};
let activePlayers = {
    players: []   // массив для объектов игроков
};



function generateId() {
    return Math.random().toString(36).substring(2, 9);
}
// key - id; value - name
// const activePlayers = ["", ""]

// key - id; value - name
// const activePlayers = ["", ""]

io.on('connection', (socket) => {
    console.log('A user connected.');

    // Добавление нового игрока //Это работает не трогать!!!
    socket.on('addPlayer', (playerName) => {
        const existingPlayer = activePlayers.players.find(player => player.name === playerName);
        if (existingPlayer) {
            socket.emit('playerAddError', { error: 'Nickname is already taken' });
        } else {
            const playerId = generateId();
            const player = { name: playerName, id: playerId };
            activePlayers.players.push(player);
            console.log('Player added:', playerName);
            socket.emit('playerAdded', { playerName });
        }
    });

    //удаление последнего игрока //Это говно не работает, думаю и не надо его делать, после закрытия все равно чистится память
    socket.on('deletePlayer', (deleteId) => {
        const deletePlayer = activePlayers.playerId.pop();
        // activePlayers = activePlayers.filter(i => i != deleteId);
        console.log('Player deleted:', deletePlayer);
        socket.emit('Player deleted', { playerId: deletePlayer });
    });

    //Вывод всех игроков // Это работает, не трогать!!!
    socket.on('allPlayer', () => {
        const allPLayer = activePlayers;
        console.log('allPlayer:', allPLayer);
        socket.emit('allPlayer', { players: allPLayer });
    });

    // Создание новой сессии //WIP надо подумать над тем как присвоить id к Players (вроде сделал, но чет криво)
    // переделал
    socket.on('createSession', (playerName) => {
        const sessionId = generateId();
        activeSessions[sessionId] = { id: sessionId, hostName: playerName };
        activePlayers[playerName] = sessionId;
        console.log('Session created:', activeSessions[sessionId]);
        socket.emit('sessionCreated', { sessionId });
    });

    // Присоединение к существующей сессии // Это сделать!!!
    // сделал надо тестировать
    socket.on('joinSession', (sessionId) => {
        const session = activeSessions[sessionId];
        if (!session) {
            socket.emit('sessionError', { error: 'Session not found' });
            return;
        }
        if (session.hostName !== playerName) {
            if (session.guestName === null) {
                session.guestName = playerName;
                activePlayers[playerName] = sessionId;
                socket.emit('sessionJoined', { sessionId, playerName });
            } else {
                socket.emit('sessionError', { error: 'Session already has a guest' });
            }
        } else {
            socket.emit('sessionError', { error: 'You are the host' });
        }
    });

    // Отправка текущего состояния игры // Это тоже наверное не надо хранить
    socket.on('requestGameState', (sessionId) => {
        const gameState = gameStates[sessionId];
        if (gameState) {
            socket.emit('gameState', gameState);
        } else {
            socket.emit('gameStateError', { error: 'Game not found' });
        }
    });

    //Запуск игры и создание игрового поля  .to --- сообщение ограниченному кругу, в данном случае тем кто в сессии
    socket.on('startGame', (sessionId) => {
        const gameState = {
            currentPlayer: activeSessions[sessionId].hostName,
            board: ['', '', '', '', '', '', '', '', '']
        };
        gameStates[sessionId] = gameState;
        io.to(sessionId).emit('gameStarted', gameState);
    });

    // Обработка хода игрока // Это сделать, пока еще не трогал
    // возвращается поле с никами -- сравниваем на фронте ник ячейки со своим и если свой то рисуем X иначе рисуем 0
    socket.on('move', ({ sessionId,cellIndex }) => {
        const gameState = gameStates[sessionId];
        if (!gameState) {
            socket.emit('moveError', { error: 'Game not found' });
            return;
        }
        if (gameState.currentPlayer !== activeSessions[sessionId].hostName) {
            socket.emit('moveError', { error: 'Invalid move' });
            return;
        }
        if (gameState.board[cellIndex] !== '') {
            socket.emit('moveError', { error: 'Cell is already occupied' });
            return;
        }
        gameState.board[cellIndex] = activeSessions[sessionId].hostName;
        gameState.currentPlayer = (gameState.currentPlayer === activeSessions[sessionId].hostName) ? activeSessions[sessionId].guestName : activeSessions[sessionId].hostName;
        io.to(sessionId).emit('gameState', gameState);
    });

    // Добавление нового игрока //Это работает не трогать!!!
    socket.on('addPlayer', (playerName) => {
        const playerId = generateId();
        const player = { name: playerName, id: playerId }; // Создание объекта игрока
  
        activePlayers.players.push(player); // Добавление нового игрока
        console.log('Player added:', playerName);
        socket.emit('playerAdded', { playerName }); // Отправка подтверждения клиенту
    });

    //удаление последнего игрока //Это говно не работает, думаю и не надо его делать, после закрытия все равно чистится память
    socket.on('deletePlayer', (deleteId) => {
        const deletePlayer = activePlayers.playerId.pop();
        // activePlayers = activePlayers.filter(i => i != deleteId);
        console.log('Player deleted:', deletePlayer);
        socket.emit('Player deleted', { playerId: deletePlayer });
    });

    //Вывод всех игроков // Это работает, не трогать!!!
    socket.on('allPlayer', () => {
        const allPLayer = activePlayers;
        console.log('allPlayer:', allPLayer);
        socket.emit('allPlayer', { players: allPLayer });
    });

    // Создание новой сессии //WIP надо подумать над тем как присвоить id к Players (вроде сделал, но чет криво)
    socket.on('createSession', () => {
        const sessionId = generateId();
        activePlayers.players.push = {sessionId: sessionId}
        activeSessions[sessionId] = { id: sessionId };
        console.log('Session created:', activeSessions[sessionId]);
        socket.emit('sessionCreated', { sessionId });
    });

    // Присоединение к существующей сессии // Это сделать!!!
    socket.on('joinSession', (sessionId) => {
        if (activeSessions[sessionId]) {
            // const playerId = generateId();
            activeSessions[sessionId].players.push(playerId);
            socket.emit('sessionJoined', { sessionId, playerId });
        } else {
            socket.emit('sessionError', { error: 'Session not found' });
        }
    });

    // Отправка текущего состояния игры // Это тоже наверное не надо хранить
    socket.on('requestGameState', (sessionId) => {
        const gameState = gameStates[sessionId];
        if (gameState) {
            socket.emit('gameState', gameState);
        } else {
            socket.emit('gameStateError', { error: 'Game not found' });
        }
    });

    // Обработка хода игрока // Это сделать, пока еще не трогал
    socket.on('move', ({ sessionId, playerId, cellIndex }) => {
        const gameState = gameStates[sessionId];
        if (gameState) {
            if (gameState.currentPlayer === playerId && gameState.board[cellIndex] === '') {
                gameState.board[cellIndex] = gameState.currentPlayer;
                gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
                io.to(sessionId).emit('gameState', gameState);
            } else {
                socket.emit('moveError', { error: 'Invalid move' });
            }
        } else {
            socket.emit('moveError', { error: 'Game not found' });
        }
    });

    // Обработка отключения клиента
    socket.on('disconnect', () => {
        console.log('A user disconnected.');
    });
});

server.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

//игрок поле name, поле id, sessionID
//сессия Id, hostname, guestname, добавить поле состояние игры
//игровое поле привязывается к сессии  поля: текущий игрок и поле
//нет хрени которая определяет победу, ничью и прочее
