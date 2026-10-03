import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { MongoClient, Db } from 'mongodb';
import type { IUser, IIssue, INotification } from './models/types.ts';

export interface IDatabase {
  users: ICollection<IUser>;
  issues: ICollection<IIssue>;
  notifications: ICollection<INotification>;
  isMongoRemote: boolean;
  init(): Promise<void>;
}

export interface ICollection<T extends { _id: string }> {
  findOne(query: Partial<T> | ((item: T) => boolean)): Promise<T | null>;
  find(query?: Partial<T> | ((item: T) => boolean)): Promise<T[]>;
  insertOne(doc: Omit<T, '_id'> & { _id?: string }): Promise<T>;
  insertMany(docs: Array<Omit<T, '_id'> & { _id?: string }>): Promise<T[]>;
  updateOne(
    query: Partial<T> | { _id: string },
    update: { $set?: Partial<T>; $push?: Record<string, unknown> } | Partial<T>
  ): Promise<{ modifiedCount: number; matchedCount: number }>;
  deleteOne(query: Partial<T> | { _id: string }): Promise<{ deletedCount: number }>;
  countDocuments(query?: Partial<T> | ((item: T) => boolean)): Promise<number>;
  createIndex(field: string): Promise<void>;
}

/**
 * File-backed persistent collection that behaves like a MongoDB collection.
 * Persists data to JSON file so it survives server restarts even without external MongoDB.
 */
class JsonFileCollection<T extends { _id: string }> implements ICollection<T> {
  private filePath: string;
  private items: T[] = [];
  private indexes: Set<string> = new Set();

  constructor(filePath: string) {
    this.filePath = filePath;
    this.load();
  }

  private load(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        this.items = JSON.parse(data);
      } else {
        this.items = [];
        this.save();
      }
    } catch (err) {
      console.error(`Error reading ${this.filePath}:`, err);
      this.items = [];
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.items, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error saving ${this.filePath}:`, err);
    }
  }

  private matchQuery(item: T, query?: Partial<T> | ((item: T) => boolean)): boolean {
    if (!query) return true;
    if (typeof query === 'function') {
      return query(item);
    }
    return Object.entries(query).every(([key, val]) => {
      return (item as Record<string, unknown>)[key] === val;
    });
  }

  async findOne(query: Partial<T> | ((item: T) => boolean)): Promise<T | null> {
    const item = this.items.find((i) => this.matchQuery(i, query));
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  async find(query?: Partial<T> | ((item: T) => boolean)): Promise<T[]> {
    const matched = this.items.filter((i) => this.matchQuery(i, query));
    return JSON.parse(JSON.stringify(matched));
  }

  async insertOne(doc: Omit<T, '_id'> & { _id?: string }): Promise<T> {
    const newDoc = {
      ...doc,
      _id: doc._id || crypto.randomUUID(),
    } as T;
    this.items.push(newDoc);
    this.save();
    return JSON.parse(JSON.stringify(newDoc));
  }

  async insertMany(docs: Array<Omit<T, '_id'> & { _id?: string }>): Promise<T[]> {
    const created: T[] = [];
    for (const doc of docs) {
      const newDoc = {
        ...doc,
        _id: doc._id || crypto.randomUUID(),
      } as T;
      this.items.push(newDoc);
      created.push(newDoc);
    }
    this.save();
    return JSON.parse(JSON.stringify(created));
  }

  async updateOne(
    query: Partial<T> | { _id: string },
    update: { $set?: Partial<T>; $push?: Record<string, unknown> } | Partial<T>
  ): Promise<{ modifiedCount: number; matchedCount: number }> {
    const index = this.items.findIndex((i) => this.matchQuery(i, query as any));
    if (index === -1) {
      return { modifiedCount: 0, matchedCount: 0 };
    }

    const current = this.items[index] as Record<string, unknown>;
    const updateObj = update as Record<string, unknown>;

    if (updateObj.$set) {
      Object.assign(current, updateObj.$set);
    }
    if (updateObj.$push) {
      for (const [key, pushVal] of Object.entries(updateObj.$push)) {
        if (!Array.isArray(current[key])) {
          current[key] = [];
        }
        (current[key] as unknown[]).push(pushVal);
      }
    }
    if (!updateObj.$set && !updateObj.$push) {
      Object.assign(current, update);
    }

    this.items[index] = current as T;
    this.save();
    return { modifiedCount: 1, matchedCount: 1 };
  }

  async deleteOne(query: Partial<T> | { _id: string }): Promise<{ deletedCount: number }> {
    const index = this.items.findIndex((i) => this.matchQuery(i, query as any));
    if (index === -1) {
      return { deletedCount: 0 };
    }
    this.items.splice(index, 1);
    this.save();
    return { deletedCount: 1 };
  }

  async countDocuments(query?: Partial<T> | ((item: T) => boolean)): Promise<number> {
    return this.items.filter((i) => this.matchQuery(i, query)).length;
  }

  async createIndex(field: string): Promise<void> {
    this.indexes.add(field);
  }
}

/**
 * MongoDB Native Client Collection wrapper
 */
class MongoCollectionWrapper<T extends { _id: string }> implements ICollection<T> {
  private col: any;

  constructor(col: any) {
    this.col = col;
  }

  async findOne(query: Partial<T> | ((item: T) => boolean)): Promise<T | null> {
    if (typeof query === 'function') {
      const all = await this.col.find({}).toArray();
      const match = all.find(query);
      return match || null;
    }
    return this.col.findOne(query);
  }

  async find(query?: Partial<T> | ((item: T) => boolean)): Promise<T[]> {
    if (typeof query === 'function') {
      const all = await this.col.find({}).toArray();
      return all.filter(query);
    }
    return this.col.find(query || {}).toArray();
  }

  async insertOne(doc: Omit<T, '_id'> & { _id?: string }): Promise<T> {
    const newDoc = {
      ...doc,
      _id: doc._id || crypto.randomUUID(),
    };
    await this.col.insertOne(newDoc);
    return newDoc as T;
  }

  async insertMany(docs: Array<Omit<T, '_id'> & { _id?: string }>): Promise<T[]> {
    const formatted = docs.map((doc) => ({
      ...doc,
      _id: doc._id || crypto.randomUUID(),
    }));
    if (formatted.length > 0) {
      await this.col.insertMany(formatted);
    }
    return formatted as T[];
  }

  async updateOne(
    query: Partial<T> | { _id: string },
    update: { $set?: Partial<T>; $push?: Record<string, unknown> } | Partial<T>
  ): Promise<{ modifiedCount: number; matchedCount: number }> {
    let mongoUpdate: any = update;
    if (!(update as any).$set && !(update as any).$push) {
      mongoUpdate = { $set: update };
    }
    const res = await this.col.updateOne(query, mongoUpdate);
    return {
      modifiedCount: res.modifiedCount,
      matchedCount: res.matchedCount,
    };
  }

  async deleteOne(query: Partial<T> | { _id: string }): Promise<{ deletedCount: number }> {
    const res = await this.col.deleteOne(query);
    return { deletedCount: res.deletedCount };
  }

  async countDocuments(query?: Partial<T> | ((item: T) => boolean)): Promise<number> {
    if (typeof query === 'function') {
      const all = await this.col.find({}).toArray();
      return all.filter(query).length;
    }
    return this.col.countDocuments(query || {});
  }

  async createIndex(field: string): Promise<void> {
    try {
      await this.col.createIndex({ [field]: 1 });
    } catch (e) {
      console.warn(`Failed to create index for ${field}:`, e);
    }
  }
}

class DatabaseManager implements IDatabase {
  public users!: ICollection<IUser>;
  public issues!: ICollection<IIssue>;
  public notifications!: ICollection<INotification>;
  public isMongoRemote: boolean = false;
  private initialized: boolean = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    const mongoUri = process.env.MONGODB_URI;
    const isLocalhostDefault = !mongoUri || mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1');

    if (mongoUri && !isLocalhostDefault) {
      try {
        console.log('Connecting to remote MongoDB at', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'));
        const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 3000 });
        await client.connect();
        const db = client.db();
        this.users = new MongoCollectionWrapper<IUser>(db.collection('users'));
        this.issues = new MongoCollectionWrapper<IIssue>(db.collection('issues'));
        this.notifications = new MongoCollectionWrapper<INotification>(db.collection('notifications'));
        this.isMongoRemote = true;
        console.log('Connected to remote MongoDB successfully');
      } catch (err) {
        console.warn('MongoDB connection failed, falling back to persistent JSON storage:', (err as Error).message);
        this.initFileDb();
      }
    } else {
      console.log('Using persistent embedded database storage (data/db_*.json)');
      this.initFileDb();
    }

    // Create required indexes
    await this.users.createIndex('email');
    await this.issues.createIndex('issueId');
    await this.issues.createIndex('studentId');
    await this.issues.createIndex('status');
    await this.issues.createIndex('category');
    await this.notifications.createIndex('userId');

    this.initialized = true;
  }

  private initFileDb(): void {
    const dataDir = path.resolve(process.cwd(), 'data');
    this.users = new JsonFileCollection<IUser>(path.join(dataDir, 'db_users.json'));
    this.issues = new JsonFileCollection<IIssue>(path.join(dataDir, 'db_issues.json'));
    this.notifications = new JsonFileCollection<INotification>(path.join(dataDir, 'db_notifications.json'));
    this.isMongoRemote = false;
  }
}

export const db = new DatabaseManager();
