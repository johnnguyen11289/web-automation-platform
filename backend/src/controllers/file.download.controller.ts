import { Request, Response } from 'express';
import { FileDownloadService } from '../services/file.download.service';
import { Multer } from 'multer';

// Add multer type for file uploads
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

export class FileDownloadController {
    private fileDownloadService: FileDownloadService;

    constructor() {
        this.fileDownloadService = new FileDownloadService();
    }

    public downloadFile = async (req: Request, res: Response): Promise<void> => {
        try {
            const { filename } = req.params;
            
            if (!filename) {
                res.status(400).json({ error: 'Filename is required' });
                return;
            }

            await this.fileDownloadService.downloadFile(res, filename);
        } catch (error) {
            if (error instanceof Error && error.message === 'File not found') {
                res.status(404).json({ error: 'File not found' });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    };

    public uploadFile = async (req: MulterRequest, res: Response): Promise<void> => {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }

            const { buffer, originalname } = req.file;
            const filePath = await this.fileDownloadService.saveFile(buffer, originalname, 'uploads');
            
            res.status(200).json({ 
                message: 'File uploaded successfully',
                filename: originalname,
                path: filePath
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };

    public deleteFile = async (req: Request, res: Response): Promise<void> => {
        try {
            const { filename } = req.params;
            
            if (!filename) {
                res.status(400).json({ error: 'Filename is required' });
                return;
            }

            await this.fileDownloadService.deleteFile(filename);
            res.status(200).json({ message: 'File deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
} 