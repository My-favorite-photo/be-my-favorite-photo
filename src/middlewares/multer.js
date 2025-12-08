import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { BadRequestException } from '../common/exceptions/badRequestException.js';

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  // file sys mkdir
  fs.mkdirSync(uploadDir);
}

/**
 * render 백엔드 서버에 그냥 넣으면 비영구적 디스크 때문에 이미지가 휘발될 가능성이 존재하여
 *  클라우드 R2등을 이용한다.
 */
// @TODO local -> S3
// //프로덕션일경우 로컬일경만함시도해볼만함
// const storage = isProduction ? multerS3(S3) : multer.diskStorage(기존로컬)
const storage = multer.diskStorage({
  // 저장위치
  filename: (req, file, done) => {
    const randomId = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = randomId + ext;
    done(null, filename);
  },
  destination: (req, file, done) => {
    done(null, uploadDir);
  },
});

const fileFilter = (req, file, done) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    done(null, true);
  } else {
    done(new BadRequestException('이미지 파일(jpg,png)만 업로드 가능합니다.'), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  // 5MB 제한
  limits: { fileSize: 5 * 1024 * 1024 },
});
