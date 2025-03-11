export const config = {
    api: {
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
        wsURL: process.env.REACT_APP_WS_URL || 'ws://localhost:5000'
    },
    defaultViewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false
    }
}; 