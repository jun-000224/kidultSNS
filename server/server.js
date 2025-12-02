// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

// router 영역
const userRouter = require("./routes/user");
const feedRouter = require("./routes/feed");
const bookmarkRouter = require("./routes/bookmark");
const notificationRouter = require("./routes/notification");

const app = express();

app.use(cors({
    origin: "*",
    credentials: true
}));

// json 파싱
app.use(express.json());

// 업로드 폴더 정적 경로
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 개별 라우터 연결
app.use('/bookmark', bookmarkRouter);
app.use("/user", userRouter);
app.use("/feed", feedRouter);
app.use("/notification", notificationRouter);

// 서버 시작
app.listen(3010, () => {
    console.log("server start!");
});
