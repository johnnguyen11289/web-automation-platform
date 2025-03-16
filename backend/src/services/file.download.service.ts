import fs from 'fs';
import path from 'path';
import { Response } from 'express';
import { setInterval } from 'timers';
import { HtmlScraperService } from './html.scraper.service';
import { BrowserProfile } from '../types/browser.types';
import { BrowserProfileModel } from '../models/BrowserProfile';
import axios from 'axios';
import fsExtra from 'fs-extra';
import { exiftool } from 'exiftool-vendored';


export class FileDownloadService {
    private readonly baseVideoDirectory: string = 'D:/videos';
    private readonly downloadDirectory: string;
    private readonly htmlScraperService: HtmlScraperService; // TODO: Replace with proper type once BrowserProfileModel is found
    
    private downloadInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.downloadDirectory = path.join(__dirname, '../../downloads');
        this.ensureDownloadDirectory();
        this.htmlScraperService = new HtmlScraperService();
        
        // Start the download interval automatically
        this.startDownloadFileInterval();
    }

    private ensureDownloadDirectory(): void {
        if (!fs.existsSync(this.downloadDirectory)) {
            fs.mkdirSync(this.downloadDirectory, { recursive: true });
        }
    }

    private ensureBusinessTypeDirectory(businessType: string): string {
        const businessTypeDir = path.join(this.baseVideoDirectory, businessType);
        if (!fs.existsSync(businessTypeDir)) {
            fs.mkdirSync(businessTypeDir, { recursive: true });
        }
        return businessTypeDir;
    }

    private sanitizeFilename(filename: string): string {
        // Remove invalid characters but keep Chinese characters
        return filename
            .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
            .replace(/\s+/g, '_')         // Replace spaces with underscores
            .trim();                      // Remove leading/trailing spaces
    }

    public startDownloadFileInterval(): void {
        this.downloadInterval = setInterval(async () => {
            try {
                const browserProfiles = await BrowserProfileModel.find({}).lean();
                if (!browserProfiles || !Array.isArray(browserProfiles)) return;

                const filteredProfiles = browserProfiles.filter((profile: BrowserProfile) => 
                    profile.businessType && profile.businessType !== ''
                );
                for (const profile of filteredProfiles) {
                    try {
                        const businessType = profile.businessType;
                        if (!businessType) continue;

                        const url = `https://www.xiaohongshu.com/explore?channel_id=homefeed.${businessType}`;
                        const htmlContent = await this.htmlScraperService.getInitialStateFromUrl(url);
                        if (!htmlContent) continue;

                        if (htmlContent.feed?.feeds) {
                            const videoFeeds = htmlContent.feed.feeds.filter((feed: { noteCard?: { type: string } }) => 
                                feed.noteCard?.type === "video"
                            );
                            
                            for (const feed of videoFeeds) {
                                try {
                                    if (!feed.trackId || !feed.xsecToken) continue;

                                    const detailUrl = `https://www.xiaohongshu.com/explore/${feed.trackId}?xsec_token=${feed.xsecToken}&xsec_source=pc_cfeed`;
                                    const detailContent = await this.htmlScraperService.getInitialStateFromUrl(detailUrl);
                                    if (!detailContent?.note?.noteDetailMap) continue;

                                    const noteDetail = detailContent.note.noteDetailMap[feed.id];
                                    if (!noteDetail?.note?.video?.media?.stream) continue;

                                    const stream = noteDetail.note.video.media.stream;
                                    let selectedStream = null;

                                    if (stream.h264?.length > 0) {
                                        selectedStream = stream.h264[0];
                                    } else if (stream.h265?.length > 0) {
                                        selectedStream = stream.h265[0];
                                    } else if (stream.h266?.length > 0) {
                                        selectedStream = stream.h266[0];
                                    } else if (stream.av1?.length > 0) {
                                        selectedStream = stream.av1[0];
                                    }

                                    if (selectedStream?.masterUrl) {
                                        const videoDesc = noteDetail.note?.title || noteDetail.note?.desc || 'untitled';
                                        const sanitizedDesc = this.sanitizeFilename(videoDesc);
                                        const filename = `${sanitizedDesc}.mp4`;
                                        
                                        const response = await axios.get(selectedStream.masterUrl, {
                                            responseType: 'arraybuffer'
                                        });
                                        
                                        // Get additional metadata for description
                                        const description = {
                                            title: noteDetail.note?.title || '',
                                            desc: noteDetail.note?.desc || '',
                                            type: noteDetail.note?.type || '',
                                            tags: noteDetail.note?.tags || [],
                                            user: noteDetail.note?.user?.nickname || '',
                                            timestamp: new Date().toISOString()
                                        };
                                        
                                        await this.saveFile(response.data, filename, businessType, JSON.stringify(description, null, 2));
                                    }
                                } catch (feedError) {
                                    continue;
                                }
                            }
                        }
                    } catch (profileError) {
                        continue;
                    }
                }
            } catch (error) {
                // Silent error handling
            }
        }, 20* 60 * 1000);
    }

    public stopDownloadFileInterval(): void {
        if (this.downloadInterval) {
            clearInterval(this.downloadInterval);
            this.downloadInterval = null;
        }
    }
    
    public async downloadFile(res: Response, filename: string): Promise<void> {
        try {
            const filePath = path.join(this.downloadDirectory, filename);
            
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                throw new Error('File not found');
            }

            // Set headers for file download
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            // Stream the file to response
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        } catch (error) {
            throw error;
        }
    }

    public async saveFile(fileBuffer: Buffer, filename: string, businessType: string, description?: string): Promise<string> {
        try {
            const businessTypeDir = this.ensureBusinessTypeDirectory(businessType);
            const filePath = path.join(businessTypeDir, filename);
            
            // Save the video file
            await fs.promises.writeFile(filePath, fileBuffer);

            // Add file metadata using exiftool
            try {
                const parsedDescription = description ? JSON.parse(description) : {};
                await exiftool.write(filePath, {
                    Title: parsedDescription.title || filename,
                    Comment: parsedDescription.desc || '',
                    Keywords: parsedDescription.tags?.join(';') || '',
                    Artist: parsedDescription.user || '',
                    Subject: businessType,
                    Category: 'Video'
                }, ['-overwrite_original']);
            } catch (metadataError) {
                console.warn('[FileDownload] Could not set file metadata:', metadataError);
            }
            
            return filePath;
        } catch (error) {
            console.error('[FileDownload] Error saving file:', error);
            throw error;
        }
    }

    public async deleteFile(filename: string): Promise<void> {
        try {
            const filePath = path.join(this.downloadDirectory, filename);
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
            }
        } catch (error) {
            throw error;
        }
    }
} 