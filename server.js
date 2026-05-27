const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));

/* ===========================================
   WORD LIST WITH CATEGORIES
   =========================================== */
const WORDS = [
  // 动物
  { word: '猫', cat: '动物' }, { word: '狗', cat: '动物' }, { word: '鱼', cat: '动物' },
  { word: '鸟', cat: '动物' }, { word: '兔子', cat: '动物' }, { word: '熊猫', cat: '动物' },
  { word: '老虎', cat: '动物' }, { word: '狮子', cat: '动物' }, { word: '大象', cat: '动物' },
  { word: '猴子', cat: '动物' }, { word: '蝴蝶', cat: '动物' }, { word: '乌龟', cat: '动物' },
  { word: '螃蟹', cat: '动物' }, { word: '鲸鱼', cat: '动物' }, { word: '海豚', cat: '动物' },
  { word: '企鹅', cat: '动物' }, { word: '长颈鹿', cat: '动物' }, { word: '鹦鹉', cat: '动物' },
  { word: '蛇', cat: '动物' }, { word: '蜜蜂', cat: '动物' },
  // 食物
  { word: '苹果', cat: '食物' }, { word: '香蕉', cat: '食物' }, { word: '西瓜', cat: '食物' },
  { word: '蛋糕', cat: '食物' }, { word: '冰淇淋', cat: '食物' }, { word: '汉堡', cat: '食物' },
  { word: '披萨', cat: '食物' }, { word: '面条', cat: '食物' }, { word: '饺子', cat: '食物' },
  { word: '寿司', cat: '食物' }, { word: '鸡蛋', cat: '食物' }, { word: '牛奶', cat: '食物' },
  { word: '咖啡', cat: '食物' }, { word: '巧克力', cat: '食物' }, { word: '薯条', cat: '食物' },
  { word: '热狗', cat: '食物' }, { word: '月饼', cat: '食物' }, { word: '棒棒糖', cat: '食物' },
  { word: '三明治', cat: '食物' }, { word: '啤酒', cat: '食物' },
  // 物品
  { word: '手机', cat: '物品' }, { word: '电脑', cat: '物品' }, { word: '电视', cat: '物品' },
  { word: '雨伞', cat: '物品' }, { word: '钥匙', cat: '物品' }, { word: '眼镜', cat: '物品' },
  { word: '帽子', cat: '物品' }, { word: '鞋子', cat: '物品' }, { word: '气球', cat: '物品' },
  { word: '风筝', cat: '物品' }, { word: '吉他', cat: '物品' }, { word: '钢琴', cat: '物品' },
  { word: '书包', cat: '物品' }, { word: '铅笔', cat: '物品' }, { word: '剪刀', cat: '物品' },
  { word: '蜡烛', cat: '物品' }, { word: '灯泡', cat: '物品' }, { word: '闹钟', cat: '物品' },
  { word: '照相机', cat: '物品' }, { word: '望远镜', cat: '物品' },
  // 自然
  { word: '太阳', cat: '自然' }, { word: '月亮', cat: '自然' }, { word: '星星', cat: '自然' },
  { word: '彩虹', cat: '自然' }, { word: '云朵', cat: '自然' }, { word: '闪电', cat: '自然' },
  { word: '雪花', cat: '自然' }, { word: '火焰', cat: '自然' }, { word: '火山', cat: '自然' },
  { word: '龙卷风', cat: '自然' }, { word: '大海', cat: '自然' }, { word: '河流', cat: '自然' },
  { word: '仙人掌', cat: '自然' }, { word: '蘑菇', cat: '自然' }, { word: '石头', cat: '自然' },
  { word: '树', cat: '自然' }, { word: '花', cat: '自然' },
  // 交通
  { word: '汽车', cat: '交通' }, { word: '火车', cat: '交通' }, { word: '飞机', cat: '交通' },
  { word: '自行车', cat: '交通' }, { word: '轮船', cat: '交通' }, { word: '火箭', cat: '交通' },
  { word: '热气球', cat: '交通' }, { word: '直升机', cat: '交通' }, { word: '摩托车', cat: '交通' },
  { word: '公交车', cat: '交通' },
  // 建筑
  { word: '房子', cat: '建筑' }, { word: '城堡', cat: '建筑' }, { word: '桥', cat: '建筑' },
  { word: '灯塔', cat: '建筑' }, { word: '学校', cat: '建筑' }, { word: '医院', cat: '建筑' },
  { word: '超市', cat: '建筑' }, { word: '电影院', cat: '建筑' }, { word: '动物园', cat: '建筑' },
  { word: '游乐场', cat: '建筑' },
  // 运动
  { word: '足球', cat: '运动' }, { word: '篮球', cat: '运动' }, { word: '乒乓球', cat: '运动' },
  { word: '游泳', cat: '运动' }, { word: '滑雪', cat: '运动' }, { word: '跳绳', cat: '运动' },
  { word: '拳击', cat: '运动' }, { word: '射箭', cat: '运动' }, { word: '跑步', cat: '运动' },
  { word: '过山车', cat: '运动' },
  // 职业
  { word: '医生', cat: '职业' }, { word: '警察', cat: '职业' }, { word: '消防员', cat: '职业' },
  { word: '老师', cat: '职业' }, { word: '厨师', cat: '职业' }, { word: '宇航员', cat: '职业' },
  { word: '画家', cat: '职业' }, { word: '歌手', cat: '职业' }, { word: '魔术师', cat: '职业' },
  { word: '忍者', cat: '职业' },
  // 其他
  { word: '笑脸', cat: '符号' }, { word: '爱心', cat: '符号' }, { word: '皇冠', cat: '符号' },
  { word: '钻石', cat: '符号' }, { word: '魔方', cat: '玩具' }, { word: '拼图', cat: '玩具' },
  { word: '指南针', cat: '物品' }, { word: '沙漏', cat: '物品' }, { word: '天平', cat: '物品' },
];

/* ===========================================
   ROOMS
   =========================================== */
const rooms = new Map();

function createRoom(hostName) {
  const code = generateCode();
  const room = {
    code, players: [], state: 'waiting',
    round: 0, totalRounds: 6, roundTime: 60,
    currentWord: null, currentDrawer: null,
    timeLeft: 0, timer: null, usedWords: [],
    scores: {}, turnOrder: [], turnIndex: 0,
    wrongGuesses: {}, // { playerId: count }
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

function getRoom(code) { return rooms.get(code.toUpperCase()); }

function cleanupRoom(code) {
  const room = rooms.get(code);
  if (room) { clearInterval(room.timer); rooms.delete(code); }
}

function broadcastRoom(room) {
  io.to(room.code).emit('room:update', getRoomInfo(room));
}

function getRoomInfo(room) {
  return {
    code: room.code, state: room.state,
    players: room.players.map(p => ({ id: p.id, name: p.name, score: room.scores[p.id] || 0 })),
    round: room.round, totalRounds: room.totalRounds,
    roundTime: room.roundTime, timeLeft: room.timeLeft,
    currentWord: room.currentWord,
    currentDrawer: room.currentDrawer ? { id: room.currentDrawer.id, name: room.currentDrawer.name } : null,
  };
}

/* ===========================================
   PARTIAL MATCH: compare guess vs answer
   =========================================== */
function partialMatch(guess, answer) {
  // Returns array of { char, correct } for each character
  const result = [];
  const answerChars = [...answer];
  const guessChars = [...guess];
  const used = new Array(answerChars.length).fill(false);

  // First pass: exact matches
  for (let i = 0; i < guessChars.length; i++) {
    if (i < answerChars.length && guessChars[i] === answerChars[i]) {
      result.push({ char: guessChars[i], correct: true });
      used[i] = true;
    } else {
      result.push({ char: guessChars[i], correct: false });
    }
  }

  // Second pass: correct char in wrong position
  for (let i = 0; i < result.length; i++) {
    if (result[i].correct) continue;
    const gChar = result[i].char;
    for (let j = 0; j < answerChars.length; j++) {
      if (!used[j] && answerChars[j] === gChar) {
        result[i].correct = false; // still wrong position, but mark it
        result[i].present = true;  // exists in answer
        used[j] = true;
        break;
      }
    }
  }

  return result;
}

function formatPartial(match) {
  return match.map(m => {
    if (m.correct) return m.char;
    if (m.present) return m.char; // same char but wrong position - still show it
    return '*';
  }).join('');
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

  room.turnOrder = [];
  for (let i = 0; i < room.totalRounds; i++) {
    room.turnOrder.push(room.players[i % room.players.length]);
    room.turnOrder.push(room.players[(i + 1) % room.players.length]);
  }
  startTurn(room);
}

function startTurn(room) {
  const available = WORDS.filter(w => !room.usedWords.includes(w.word));
  if (available.length === 0) room.usedWords = [];
  const picked = available[Math.floor(Math.random() * available.length)];
  room.currentWord = picked;
  room.usedWords.push(picked.word);

  room.currentDrawer = room.turnOrder[room.turnIndex];
  room.state = 'playing';
  room.timeLeft = room.roundTime;
  room.wrongGuesses = {};

  io.to(room.code).emit('game:new-turn', {
    drawer: { id: room.currentDrawer.id, name: room.currentDrawer.name },
    wordLen: picked.word.length,
    round: room.round,
    turnIndex: room.turnIndex,
    totalTurns: room.turnOrder.length,
  });

  // Send word + category to drawer
  io.to(room.currentDrawer.id).emit('game:your-word', { word: picked.word, cat: picked.cat });

  // Tell others only the length
  room.players.forEach(p => {
    if (p.id !== room.currentDrawer.id) {
      io.to(p.id).emit('game:hint', { length: picked.word.length, drawerName: room.currentDrawer.name });
    }
  });

  broadcastRoom(room);

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
  io.to(room.code).emit('game:turn-end', {
    word: room.currentWord.word,
    cat: room.currentWord.cat,
    correct, guesserName,
    scores: room.players.map(p => ({ id: p.id, name: p.name, score: room.scores[p.id] || 0 })),
  });

  room.state = 'transition';
  setTimeout(() => {
    room.turnIndex++;
    if (room.turnIndex >= room.turnOrder.length) { endGame(room); return; }
    room.round = Math.floor(room.turnIndex / 2) + 1;
    startTurn(room);
  }, 4000);
}

function endGame(room) {
  room.state = 'finished';
  const results = room.players.map(p => ({ id: p.id, name: p.name, score: room.scores[p.id] || 0 }));
  results.sort((a, b) => b.score - a.score);
  io.to(room.code).emit('game:over', { results });
  broadcastRoom(room);

  setTimeout(() => {
    if (rooms.has(room.code)) {
      room.state = 'waiting'; room.round = 0; room.turnIndex = 0;
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

  socket.on('room:create', ({ playerName }, cb) => {
    const room = createRoom(playerName);
    room.players.push({ id: socket.id, name: playerName });
    room.scores[socket.id] = 0;
    socket.join(room.code);
    socket.data = { roomCode: room.code, playerName };
    cb({ ok: true, code: room.code });
    broadcastRoom(room);
  });

  socket.on('room:join', ({ code, playerName }, cb) => {
    const room = getRoom(code);
    if (!room) return cb({ ok: false, error: '房间不存在' });
    if (room.players.length >= 8) return cb({ ok: false, error: '房间已满 (最多8人)' });
    if (room.state === 'playing') return cb({ ok: false, error: '游戏进行中，无法加入' });
    room.players.push({ id: socket.id, name: playerName });
    room.scores[socket.id] = 0;
    socket.join(room.code);
    socket.data = { roomCode: room.code, playerName };
    cb({ ok: true, code: room.code });
    broadcastRoom(room);
    io.to(room.code).emit('room:player-join', { name: playerName });
  });

  socket.on('game:start', (_, cb) => {
    const room = rooms.get(socket.data?.roomCode);
    if (!room) return;
    if (room.players.length < 2) return cb?.({ ok: false, error: '至少需要2名玩家' });
    startGame(room);
    cb?.({ ok: true });
  });

  // Drawing - smooth line segments
  socket.on('draw:stroke', (data) => {
    const room = rooms.get(socket.data?.roomCode);
    if (!room || room.state !== 'playing') return;
    if (room.currentDrawer?.id !== socket.id) return;
    socket.to(room.code).emit('draw:stroke', data);
  });

  socket.on('draw:clear', () => {
    const room = rooms.get(socket.data?.roomCode);
    if (!room || room.state !== 'playing') return;
    if (room.currentDrawer?.id !== socket.id) return;
    socket.to(room.code).emit('draw:clear');
  });

  // Guess with partial match
  socket.on('game:guess', ({ guess }) => {
    const room = rooms.get(socket.data?.roomCode);
    if (!room || room.state !== 'playing') return;
    if (room.currentDrawer?.id === socket.id) return;

    const guesser = room.players.find(p => p.id === socket.id);
    if (!guesser) return;
    const trimmed = guess.trim();
    if (!trimmed) return;

    if (trimmed === room.currentWord.word) {
      // Correct!
      const timeBonus = Math.ceil(room.timeLeft / room.roundTime * 50);
      const points = 100 + timeBonus;
      room.scores[guesser.id] = (room.scores[guesser.id] || 0) + Math.ceil(points * 0.6);
      room.scores[room.currentDrawer.id] = (room.scores[room.currentDrawer.id] || 0) + Math.floor(points * 0.4);

      io.to(room.code).emit('game:correct', {
        guesserName: guesser.name, points, word: room.currentWord.word,
      });
      endTurn(room, true, guesser.name);
    } else {
      // Wrong - compute partial match
      const match = partialMatch(trimmed, room.currentWord.word);
      const display = formatPartial(match);

      // Track wrong guesses
      if (!room.wrongGuesses[guesser.id]) room.wrongGuesses[guesser.id] = 0;
      room.wrongGuesses[guesser.id]++;

      const totalWrong = Object.values(room.wrongGuesses).reduce((a, b) => a + b, 0);

      // Determine hint to give
      let hint = null;
      if (totalWrong >= 6) {
        // Give category hint
        hint = `💡 提示：这个词属于「${room.currentWord.cat}」类`;
      } else if (totalWrong >= 3) {
        // Give length/detail hint
        hint = `💡 提示：这个词有 ${room.currentWord.word.length} 个字`;
      }

      io.to(room.code).emit('game:wrong-guess', {
        name: guesser.name, guess: trimmed, display, hint,
      });
    }
  });

  socket.on('game:skip', () => {
    const room = rooms.get(socket.data?.roomCode);
    if (!room || room.state !== 'playing') return;
    if (room.currentDrawer?.id !== socket.id) return;
    endTurn(room, false);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    const room = rooms.get(socket.data?.roomCode);
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socket.id);
    if (room.players.length === 0) { cleanupRoom(room.code); return; }
    if (room.currentDrawer?.id === socket.id && room.state === 'playing') endTurn(room, false);
    broadcastRoom(room);
    io.to(room.code).emit('room:player-leave', { name: socket.data?.playerName });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
