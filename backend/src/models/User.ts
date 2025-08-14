import mongoose, { Schema, Document } from 'mongoose';

export interface IFriend {
  friend: mongoose.Types.ObjectId;
  level: number;
}

export interface IUser extends Document {
  email: string;
  password: string; // hashed
  nickname?: string;
  avatar?: string; // URL to avatar image or base64 data
  lastSeen?: Date;
  friends: IFriend[];
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  friends: [
    {
      friend: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      level: {
        type: Number,
        default: 1
      }
    }
  ],
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  versionKey: false // Disable the __v field
});

// Index for faster queries
UserSchema.index({ email: 1 });

export default mongoose.model<IUser>('User', UserSchema);
