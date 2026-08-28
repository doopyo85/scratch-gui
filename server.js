const express = require('express');
const compression = require('compression');
const path = require('path');
const app = express();

// gzip 압축 (gui.js 27MB → ~6MB)
app.use(compression());

// 정적 파일 제공 — chunks/는 파일명에 해시 포함, 1년 캐시
app.use('/chunks', express.static(path.join(__dirname, 'build', 'chunks'), {
  maxAge: '1y',
  immutable: true,
}));
app.use(express.static(path.join(__dirname, 'build')));

// 모든 요청을 index.html로 라우팅 (SPA를 위해)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 8601;
app.listen(PORT, () => {
  console.log('Scratch server running on port ' + PORT + ' (gzip on)');
});
