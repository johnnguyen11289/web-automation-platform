import axios, { AxiosError } from 'axios';

export class HtmlScraperService {
    /**
     * Fetches HTML content from a given URL
     */
    public async fetchHtmlContent(url: string): Promise<string> {
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error: unknown) {
            const axiosError = error as AxiosError;
            throw new Error(`Failed to fetch HTML content: ${axiosError.message}`);
        }
    }

    /**
     * Extracts the INITIAL_STATE data from HTML content
     */
    public extractInitialState(htmlContent: string): any {
        try {
            const regex = /<script>window\.__INITIAL_STATE__=({.*?})<\/script>/;
            const match = htmlContent.match(regex);
            
            if (!match || !match[1]) {
                throw new Error('INITIAL_STATE data not found in HTML');
            }

            // Replace undefined values with null before parsing
            const sanitizedJson = match[1].replace(/:undefined/g, ':null');
            
            // Parse the JSON data
            const initialStateData = JSON.parse(sanitizedJson);
            return initialStateData;
        } catch (error: unknown) {
            if (error instanceof Error) {
                throw new Error(`Failed to extract INITIAL_STATE data: ${error.message}`);
            }
            throw new Error('Failed to extract INITIAL_STATE data: Unknown error');
        }
    }

    /**
     * Fetches HTML and extracts INITIAL_STATE data in one step
     */
    public async getInitialStateFromUrl(url: string): Promise<any> {
        const htmlContent = await this.fetchHtmlContent(url);
        return this.extractInitialState(htmlContent);
    }
} 