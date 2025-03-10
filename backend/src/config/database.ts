import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://webautomation:123456789@localhost:27017/webautomation?authSource=admin';

class Database {
  private static instance: Database;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public setConnected(connected: boolean): void {
    this.isConnected = connected;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('Using existing database connection');
      return;
    }

    if (this.connectionPromise) {
      console.log('Connection in progress, waiting...');
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      try {
        if (mongoose.connection.readyState === 1) {
          console.log('MongoDB is already connected');
          this.setConnected(true);
          return;
        }

        await mongoose.connect(MONGODB_URI);
        this.setConnected(true);
        console.log('MongoDB connected successfully');
      } catch (error) {
        console.error('MongoDB connection error:', error);
        this.setConnected(false);
        throw error;
      } finally {
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  public disconnect(): Promise<void> {
    return mongoose.disconnect().then(() => {
      this.setConnected(false);
      console.log('MongoDB disconnected');
    });
  }
}

// Set up event listeners
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  Database.getInstance().setConnected(false);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  Database.getInstance().setConnected(false);
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
  Database.getInstance().setConnected(true);
});

export const connectDB = () => Database.getInstance().connect();
export const disconnectDB = () => Database.getInstance().disconnect(); 