
<img width="1917" height="1101" alt="main" src="https://github.com/user-attachments/assets/4ed477d8-838b-46be-9036-0f9fe4df4035" />

---
## 목차
  1. [프로젝트 개요](#overview) 
  2. [팀원 소개](#team-members)
  3. [BE 아키텍처](#be-architecture)
  4. [기술 스택](#tech-stack)
  5. [주요 기능](#key-features)
  6. [팀 문서](#team-documents)
  7. [프론트 구경해보기](#check-out-the-frontend)
  8. [폴더 구조](#directory)
---

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## Overview

**최애의 포토**는 단순히 사진을 저장하는 것을 넘어, 소중한 순간을 **포토카드**라는 자산으로 만들어 소장하고 유저들과 교류하는 웹 플랫폼입니다.

휘발되는 SNS 피드와 달리, 이곳에서는 당신의 '최애' 순간들이 고유한 가치를 지닌 카드가 됩니다. 나만의 컬렉션을 완성하고, 마켓플레이스에서 취향이 맞는 사람들과 카드를 교환하거나 거래하며 덕질의 즐거움을 확장해 보세요.

## Play
https://github.com/user-attachments/assets/08b327b4-3443-4e87-886d-e6f00b6160e4


### 핵심 가치
- **Create**: 나만의 소중한 사진을 고유 등급과 장르를 가진 카드로 생성
- **Collect**: 랜덤 포인트 드로우를 통한 수집의 재미
- **Trade**: 유저 간 1:1 교환 및 마켓플레이스를 통한 경제 활동
- **Connect**: 같은 취향을 가진 팬덤과의 연결

---

## Team Members

| **Role** | **Name** | **GitHub / Contact** |
| :---: | :---: | :---: |
| **Team Leader** | **김윤기** | [@youn_gi_kim](https://github.com/rklpoi5678) |
| **FE/BE Developer** | **박창기** | [@changki](https://github.com/p-changki) |
| **FE/BE Developer** | **이유리** | [@yoorrll](https://github.com/yoorrll) |
| **FE/QA Developer** | **오마린** | [@oh1marin](https://github.com/oh1marin) |

---
## BE Architecture
<img width="1596" height="979" alt="Web App Reference Architecture" src="https://github.com/user-attachments/assets/992d21c2-01df-4bef-8368-3a9a0feb988a" />

---

## Tech Stack

본 프로젝트는 최신 웹 트렌드를 반영하여 **Next.js 16 (App Router)** 과 **React 19** 환경에서 구축되었습니다.

### **Backend Core**
![Express Badge](https://img.shields.io/badge/Express-000?logo=express&logoColor=fff&style=for-the-badge)![Node.js Badge](https://img.shields.io/badge/Node.js-5FA04E?logo=nodedotjs&logoColor=fff&style=for-the-badge)

### **Authentication**
![Passport Badge](https://img.shields.io/badge/Passport-34E27A?logo=passport&logoColor=000&style=for-the-badge)
![JSON Web Tokens Badge](https://img.shields.io/badge/JSON%20Web%20Tokens-000?logo=jsonwebtokens&logoColor=fff&style=for-the-badge)

### **Validation**
![Zod Badge](https://img.shields.io/badge/Zod-408AFF?logo=zod&logoColor=fff&style=for-the-badge)

### **Database & ORM**
![Prisma Badge](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=fff&style=for-the-badge)
![PostgreSQL Badge](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=fff&style=for-the-badge)

### **File Handling**
Multer

### **API DOCS**
![Swagger Badge](https://img.shields.io/badge/Swagger-85EA2D?logo=swagger&logoColor=000&style=for-the-badge)

### **Dev Tools & CI/CD**
![Prettier](https://img.shields.io/badge/prettier-%23192a32?style=for-the-badge&logo=prettier&logoColor=dc524a)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)
![Render Badge](https://img.shields.io/badge/Render-000?logo=render&logoColor=fff&style=for-the-badge)
![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)

**other**: husky,lint-stage,nodemon,dotenv

---

## Key Features


### 1️⃣ 마켓플레이스 (Marketplace)
- **둘러보기**: 판매 등록된 전 세계 유저들의 포토카드를 구경할 수 있습니다.
- **스마트 검색**: 키워드, 희귀도(등급), 가격순, 매진 여부 등 다양한 필터를 제공합니다.
- **무한 탐색**: 무한 스크롤(Infinite Scroll)을 적용하여 끊김 없는 사용자 경험을 제공합니다.

### 2️⃣ 나만의 갤러리 (My Gallery)
- **카드 생성(Minting)**: Cloudinary 연동을 통해 이미지를 업로드하고 나만의 포토카드를 발행합니다.
- **컬렉션 관리**: 내가 보유한 카드를 등급별로 정리하고 감상할 수 있습니다.

### 3️⃣ 포인트 시스템 (point system)
- **포인트 드로우**: 1시간마다 랜덤 포인트를 획득하여 구매 자금을 마련할 수 있습니다.
- **거래(Trading)**: 보유한 카드를 마켓에 판매 등록하거나, 원하는 카드를 구매할 수 있습니다.
- **물물 교환**: 포인트가 없어도 걱정 마세요. 1:1 카드 맞교환 제안 기능을 지원합니다.

### 4️⃣ 인터랙션 & 알림 (Interaction)
- **실시간 알림**: 내 카드에 대한 구매 요청, 교환 신청, 거래 성사 여부를 알림 센터에서 즉시 확인합니다.
- **거래 히스토리**: 나의 판매 및 구매 이력을 투명하게 관리합니다.

---

## Team Documents

노션 주소
https://www.notion.so/2b662f1437fd806eb6a6dc792d704f26

미로 주소
https://miro.com/app/board/uXjVGfn7wg8=/


## Check out the Frontend
[나의 최애의 포토 백엔드](https://github.com/My-favorite-photo/fe-my-favorite-photo)

## directory
```
├── prisma/                    # 데이터베이스 스키마 및 마이그레이션 관리
│   ├── schema/                
│   └── migrations/            
├── src/                       
│   ├── common/                # 전역 공통 모듈
│   │   └── exceptions/        # 커스텀 에러 핸들러 (HttpException 등)
│   ├── configs/               # 환경 설정 및 외부 라이브러리 세팅
│   │   ├── prismaClient.js    # DB 연결 설정
│   │   └── swagger.js         # API 문서 설정
│   ├── controllers/           # 컨트롤러
│   ├── middlewares/           # 인증, 에러 핸들링, 파일 업로드(Multer) 등 중간 처리
│   ├── repositories/          # 데이터베이스 레포지토리
│   ├── routes/                # 엔드포인트 경로 정의
│   ├── services/              # 핵비즈니스 로직 처리
│   ├── swaggerDocs/           # API 상세 명세서 (YAML 형식) - 배포시 dist/src로
│   └── app.js                 # Express 앱 설정 및 서버 실행 메인 파일
├── http/                      # API 테스트용 .http 파일 (Rest Client)
├── .github/                   # CI/CD 및 협업 템플릿 (Issue, PR)
├── .husky/                    # Git Hooks 설정 (Lint-staged)
├── .env.example               # 환경 변수 샘플
├── package.json               
└── README.md
```
