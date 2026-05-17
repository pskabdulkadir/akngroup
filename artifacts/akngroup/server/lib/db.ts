import mongoose from 'mongoose';

export async function connectDB() {
  let mongoUri = process.env.MONGODB_URI;
  
  const isPlaceholder = mongoUri && (
    mongoUri.includes("username:password") || 
    mongoUri.includes("<password>") ||
    (mongoUri.includes("cluster.mongodb.net") && (mongoUri.includes("username") || mongoUri.includes("password")))
  );

  if (isPlaceholder || !mongoUri) {
    mongoUri = 'mongodb://127.0.0.1:27017/mlm';
  }

  return mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 2000
  });
}

export async function disconnectDB() {
  return mongoose.disconnect();
}