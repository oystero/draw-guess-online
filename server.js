const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, 'public')));

/* ===========================================
   WORD LIST
   =========================================== */
const WORDS = [
  '猫','狗','鱼','鸟','兔子','熊猫','老虎','狮子','大象','猴子',
  '蛇','蝴蝶','蜜蜂','乌龟','螃蟹','鲸鱼','海豚','企鹅','长颈鹿','鹦鹉',
  '苹果','香蕉','西瓜','蛋糕','冰淇淋','汉堡','披萨','面条','饺子','寿司',
  '鸡蛋','牛奶','咖啡','啤酒','巧克力','薯条','热狗','三明治','月饼','棒棒糖',
  '手机','电脑','电视','雨伞','钥匙','眼镜','帽子','鞋子','气球','风筝',
  '吉他','钢琴','书包','铅笔','剪刀','蜡烛','灯泡','闹钟','照相机','望远镜',
  '太阳','月亮','星星','彩虹','云朵','闪电','雪花','火焰','山','河流',
  '大海','树','花','仙人掌','蘑菇','石头','风','雨','火山','龙卷风',
  '汽车','火车','飞机','自行车','公交车','轮船','火箭','热气球','直升机','摩托车',
  '房子','城堡','桥','灯塔','学校','医院','超市','电影院','动物园','游乐场',
  '足球','篮球','乒乓球','游泳','滑雪','跳绳','拳击','射箭','跑步','过山车',
  '医生','警察','消防员','老师','厨师','宇航员','画家','歌手','魔术师','忍者',
  '笑脸','爱心','皇冠','钻石','魔方','拼图','指南针','沙漏','天平','火箭筒',
];

/* ===========================================
   ROOMS
   =========================================== */
const rooms = new Map();

function createRoom(hostName) {
  const code = generateCode();
  const room = {
    code,
    players: [],
    state: 'waiting',    // waiting | playing | transition
    round: 0,
    totalRounds: 6,
    roundTime: 60,
    currentWord: '',
    currentDrawer: null,
    timeLeft: 0,
    timer: null,
    usedWords: [],
    scores: {},
    turnOrder: [],
    turnIndex: 0,
    canvasSize: 32,
  };
  rooms.set(code, room);
  return room;
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? generateCode() : code;
}

function getRoom(code) {
  return rooms.get(code.toUpperCase());
}

function cleanupRoom(code) {
  const room = rooms.get(code);
  if (room) {
    clearInterval(room.timer);
    rooms.delete(code);
  }
}

function broadcastRoom(room) {
  const info = getRoomInfo(room);
  io.to(room.code).emit('room:update', info);
}

function getRoomInfo(room) {
  return {
    code: room.code,
    state: room.state,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      score: room.scores[p.id] || 0,
    })),
    round: room.round,
    totalRounds: room.totalRounds,
    roundTime: room.roundTime,
    timeLeft: room.timeLeft,
    currentWord: room.currentWord,
    currentDrawer: room.currentDrawer ? {
      id: room.currentDrawer.id,
      name: room.currentDrawer.name,
    } : null,
    canvasSize: room.canvasSize,
  };
}

/* ===========================================
   GAME LOGIC
   =========================================== */
function startGame(room) {
  if (room.players.length < 2) return;

  room.state = 'playing';
  room.round = 1;
  room.turnIndex = 0;
  room.usedWords = [];
  room.scores = {};
  room.players.forEach(p => room.scores[p.id] = 0);

  // Build turn order: alternate between players
  room.turnOrder = [];
  for (let i = 0; i < room.totalRounds; i++) {
    room.turnOrder.push(room.players[i % room.players.length]);
    room.turnOrder.push(room.players[(i + 1) % room.players.length]);
  }

  startTurn(room);
}

function startTurn(room) {
  // Pick word
  const available = WORDS.filter(w => !room.usedWords.includes(w));
  if (available.length === 0) room.usedWords = [];
  room.currentWord = available[Math.floor(Math.random() * available.length)];
  room.usedWords.push(room.currentWord);

  room.currentDrawer = room.turnOrder[room.turnIndex];
  room.state = 'playing';
  room.timeLeft = room.roundTime;

  // Clear canvas state (new turn = fresh canvas)
  io.to(room.code).emit('game:new-turn', {
    drawer: { id: room.currentDrawer.id, name: room.currentDrawer.name },
    word: room.currentWord,
    round: room.round,
    turnIndex: room.turnIndex,
    totalTurns: room.turnOrder.length,
    canvasSize: room.canvasSize,
  });

  // Send word only to drawer
  io.to(room.currentDrawer.id).emit('game:your-word', room.currentWord);

  // Tell others the word length as hint
  room.players.forEach(p => {
    if (p.id !== room.currentDrawer.id) {
      io.to(p.id).emit('game:hint', {
        length: room.currentWord.length,
        drawerName: room.currentDrawer.name,
      });
    }
  });

  broadcastRoom(room);

  // Start timer
  clearInterval(room.timer);
  room.timer = setInterval(() => {
    room.timeLeft--;
    io.to(room.code).emit('game:timer', room.timeLeft);

    if (room.timeLeft <= 0) {
      clearInterval(room.timer);
      endTurn(room, false);
    }
  }, 1000);
}

function endTurn(room, correct, guesserName) {
  clearInterval(room.timer);

  const result = {
    word: room.currentWord,
    correct,
    guesserName,
    scores: room.players.map(p => ({
      id: p.id,
      name: p.name,
      score: room.scores[p.id] || 0,
    })),
  };

  room.state = 'transition';
  io.to(room.code).emit('game:turn-end', result);

  // Auto-advance after 3 seconds
  setTimeout(() => {
    room.turnIndex++;

    if (room.turnIndex >= room.turnOrder.length) {
      // Game over
      endGame(room);
      return;
    }

    // Advance round number
    room.round = Math.floor(room.turnIndex / 2) + 1;

    startTurn(room);
  }, 4000);
}

function endGame(room) {
  room.state = 'finished';
  const results = room.players.map(p => ({
    id: p.id,
    name: p.name,
    score: room.scores[p.id] || 0,
  }));
  results.sort((a, b) => b.score - a.score);

  io.to(room.code).emit('game:over', { results });
  broadcastRoom(room);

  // Cleanup after 10 seconds
  setTimeout(() => {
    if (rooms.has(room.code)) {
      room.state = 'waiting';
      room.round = 0;
      room.turnIndex = 0;
      room.players.forEach(p => room.scores[p.id] = 0);
      broadcastRoom(room);
    }
  }, 10000);
}

/* ===========================================
   SOCKET HANDLERS
   =========================================== */
io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  // Create room
  socket.on('room:create', ({ playerName }, cb) => {
    const room = createRoom(playerName);
    const player = { id: socket.id, name: playerName };
    room.players.push(player);
    room.scores[socket.id] = 0;
    socket.join(room.code);
    socket.data = { roomCode: room.code, playerName };
    cb({ ok: true, code: room.code });
    broadcastRoom(room);
  });

  // Join room
  socket.on('room:join', ({ code, playerName }, cb) => {
    const room = getRoom(code);
    if (!room) return cb({ ok: false, error: '房间不存在' });
    if (room.players.length >= 8) return cb({ ok: false, error: '房间已满 (最多8人)' });
    if (room.state === 'playing') return cb({ ok: false, error: '游戏进行中，无法加入' });

    const player = { id: socket.id, name: playerName };
    room.players.push(player);
    room.scores[socket.id] = 0;
    socket.join(room.code);
    socket.data = { roomCode: room.code, playerName };
    cb({ ok: true, code: room.code });
    broadcastRoom(room);
    io.to(room.code).emit('room:player-join', { name: playerName });
  });

  // Start game (host only)
  socket.on('game:start', (_, cb) => {
    const room = rooms.get(socket.data?.roomCode);
    if (!room) return;
    if (room.players.length < 2) {
      return cb?.({ ok: false, error: '至少需要2名玩家' });
    }
    startGame(room);
    cb?.({ ok: true });
  });

  // Drawing events
  socket.on('draw:pixel', (data) => {
    const room = rooms.get(socket.data?.roomCode);
    if (!room || room.state !== 'playing') return;
    if (room.currentDrawer?.id !== socket.id) return;
    socket.to(room.code).emit('draw:pixel', data);
  });

  socket.on('draw:line', (data) => {
    const room = rooms.get(socket.data?.roomCode);
    if (!room || room.state !== 'playing') return;
    if (room.currentDrawer?.id !== socket.id) return;
    socket.to(room.code).emit('draw:line', data);
  });

  socket.on('draw:clear', () => {
    const room = rooms.get(socket.data?.roomCode);
    if (!room || room.state !== 'playing') return;
    if (room.currentDrawer?.id !== socket.id) return;
    socket.to(room.code).emit('draw:clear');
  });

  // Guess
  socket.on('game:guess', ({ guess }) => {
    const room = rooms.get(socket.data?.roomCode);
    if (!room || room.state !== 'playing') return;
    if (room.currentDrawer?.id === socket.id) return; // drawer can't guess

    const guesser = room.players.find(p => p.id === socket.id);
    if (!guesser) return;

    if (guess.trim() === room.currentWord) {
      // Correct!
      const timeBonus = Math.ceil(room.timeLeft / room.roundTime * 50);
      const points = 100 + timeBonus;
      room.scores[guesser.id] = (room.scores[guesser.id] || 0) + Math.ceil(points * 0.6);
      room.scores[room.currentDrawer.id] = (room.scores[room.currentDrawer.id] || 0) + Math.floor(points * 0.4);

      io.to(room.code).emit('game:correct', {
        guesserName: guesser.name,
        points,
        word: room.currentWord,
      });

      endTurn(room, true, guesser.name);
    } else {
      io.to(room.code).emit('game:wrong-guess', {
        name: guesser.name,
        guess,
      });
    }
  });

  // Skip turn (drawer only)
  socket.on('game:skip', () => {
    const room = rooms.get(socket.data?.roomCode);
    if (!room || room.state !== 'playing') return;
    if (room.currentDrawer?.id !== socket.id) return;
    endTurn(room, false);
  });

  // Chat (optional, for fun)
  socket.on('chat:message', ({ message }) => {
    const room = rooms.get(socket.data?.roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    io.to(room.code).emit('chat:message', {
      name: player.name,
      message: message.slice(0, 100),
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    const room = rooms.get(socket.data?.roomCode);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);

    if (room.players.length === 0) {
      cleanupRoom(room.code);
      return;
    }

    // If the drawer disconnected, end turn
    if (room.currentDrawer?.id === socket.id && room.state === 'playing') {
      endTurn(room, false);
    }

    broadcastRoom(room);
    io.to(room.code).emit('room:player-leave', { name: socket.data?.playerName });
  });
});

/* ===========================================
   START SERVER
   =========================================== */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
