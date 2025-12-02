🌊 HobbyWave (Kidult SNS)

키덜트·취미 기반 SNS 플랫폼
취향 기반 피드, 파도타기 알고리즘, 북마크, 프로필 시스템을 제공하는 SNS 프로젝트입니다.

⭐ 주요 기능
🏠 1. 홈 피드 (전체 피드)

전체 사용자 피드를 최신순으로 조회

게시글 카드 UI로 이미지/내용 표시

좋아요/북마크 여부 표시

🌊 2. 파도타기 (랜덤 탐색)

전체 피드를 랜덤으로 섞어 노출

새로운 취미를 탐험하는 컨셉

파도타기 전용 설명 모달

🔖 3. 북마크 (다시보기)

tbl_feed_bookmark 기반

클릭 시 toggle 방식 (북마크 추가/삭제)

북마크한 게시글만 모아보기

🧑‍💻 4. 마이페이지

사용자 프로필 정보

닉네임, 소개글, 프로필사진

브론즈 등급 이상 → 프로필사진 업로드 가능

📝 5. 회원가입/로그인

JWT 기반 로그인

로그인 후 토큰에서 userId 추출하여 피드/북마크/파도타기 연결

🗂️ 프로젝트 구조 (React + Node + MySQL)
📁 Frontend (React)
src/
 ├─ components/
 │    ├─ Menu.js          # 좌측 네비게이션 (아이콘 확장 애니메이션)
 │    ├─ Feed.js          # 파도타기
 │    ├─ FeedAll.js       # 전체 피드
 │    ├─ BookmarkFeed.js  # 북마크 피드
 │    ├─ MyPage.js        # 마이페이지 + 프로필 변경
 │    ├─ Login.js
 │    └─ Register.js
 └─ App.js                # 라우팅 관리

📁 Backend (Node/Express)
server/
 ├─ routes/
 │    ├─ feed.js
 │    ├─ bookmark.js
 │    ├─ user.js
 │    └─ upload.js
 ├─ uploads/              # 이미지 정적 폴더
 ├─ db.js                 # MySQL 연결 설정
 └─ server.js

🗄️ Database (MySQL)

DB 이름: sns
문자셋: utf8mb4

🛠️ 주요 테이블
📌 tbl_user
Column	Type	Desc
userId	varchar(500)	PK
pwd	varchar(500)	패스워드
userName	varchar(50)	닉네임
profileImgPath	varchar(500)	프로필 이미지
intro	varchar(300)	자기소개 (default: “안녕하세요?”)
follower / following	int	팔로우 수
📌 tbl_feed

게시글 기본 테이블
이미지: tbl_feed_img 와 1:N

📌 tbl_feed_img
Column	Desc
imgId	PK
feedId	FK → tbl_feed
imgPath	이미지 경로
📌 tbl_feed_bookmark

feedId + userId 를 복합 PK로 사용하는 북마크 테이블

Column	Desc
feedId	FK → tbl_feed
userId	FK → tbl_user
cdatetime	등록 시간
🎨 UI 특징
📌 Menu 사이드바

기본은 아이콘만 보임

hover 시 텍스트 자연스럽게 펼쳐짐

선택된 메뉴는 hover 상태를 유지하는 디자인

📌 파도타기 설명 모달

? 아이콘 클릭 시 모달 등장

파도타기 컨셉: “무작위로 여러 취미를 탐색”

📌 마이페이지 프로필

프로필 정보 변경 버튼

이미지 업로드 (등급 조건 적용)

닉네임/소개 수정 가능

🌐 API 요약
🔖 북마크 토글

POST /bookmark/toggle/:feedId

{
  "userId": "유저ID토큰에서",
  "feedId": 82,
  "isBookmarked": true
}

📥 전체 피드 불러오기

GET /feed/all

🌊 파도타기

GET /feed/random

🧑 프로필 수정

POST /user/update

🖼 이미지 업로드

POST /upload/profile

🔧 오류 해결 정리
✔ MySQL 인증 오류
ER_ACCESS_DENIED_ERROR (using password: YES)


→ MySQL root 비번이 잘못되었거나 Workbench 설정과 Node 설정이 다른 경우

확인해야 할 것

host

user

password

port

database

📦 세팅 방법
1) 서버 실행
cd server
npm install
node server.js

2) 프론트 실행
cd client
npm install
npm start

3) 이미지 업로드 경로
server/uploads/

🏁 앞으로 추가될 기능

🔥 등급 시스템 (브론즈/실버/골드)

📨 메시지 기능

🏷 태그 기반 추천 알고리즘 강화

🧩 프로필 배지 시스템
