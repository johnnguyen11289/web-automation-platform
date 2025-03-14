import { Router } from 'express';
import multer from 'multer';
import { FileDownloadController } from '../controllers/file.download.controller';

const router = Router();
const fileDownloadController = new FileDownloadController();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Routes
router.get('/download/:filename', fileDownloadController.downloadFile);
router.post('/upload', upload.single('file'), fileDownloadController.uploadFile);
router.delete('/delete/:filename', fileDownloadController.deleteFile);

export default router; 