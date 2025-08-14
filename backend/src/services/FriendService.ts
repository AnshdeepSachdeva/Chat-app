import User from '../models/User.js';
import FriendRequest, { IFriendRequest } from '../models/FriendRequest.js';

export class FriendService {
  /**
   * Send a friend request from senderId to receiverId
   */
  static async sendRequest(senderId: string, receiverId: string): Promise<IFriendRequest> {
    if (senderId === receiverId) {
      throw new Error('Cannot send friend request to yourself');
    }

    const alreadyFriends = await User.exists({ _id: senderId, 'friends.friend': receiverId });
    if (alreadyFriends) {
      throw new Error('Users are already friends');
    }

    const existing = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiverId,
      status: 'pending'
    }).exec();

    if (existing) {
      throw new Error('Friend request already sent');
    }

    const request = new FriendRequest({ sender: senderId, receiver: receiverId });
    return await request.save();
  }

  /**
   * Accept a friend request by id
   */
  static async acceptRequest(requestId: string): Promise<IFriendRequest | null> {
    const request = await FriendRequest.findById(requestId).exec();
    if (!request || request.status !== 'pending') {
      return null;
    }

    request.status = 'accepted';
    await request.save();

    await User.findByIdAndUpdate(request.sender, {
      $push: { friends: { friend: request.receiver, level: 1 } }
    }).exec();

    await User.findByIdAndUpdate(request.receiver, {
      $push: { friends: { friend: request.sender, level: 1 } }
    }).exec();

    return request;
  }

  /**
   * Decline a friend request by id
   */
  static async declineRequest(requestId: string): Promise<boolean> {
    const request = await FriendRequest.findById(requestId).exec();
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'declined';
    await request.save();
    return true;
  }

  /**
   * Check if two users are friends
   */
  static async areFriends(userIdA: string, userIdB: string): Promise<boolean> {
    const user = await User.findOne({ _id: userIdA, 'friends.friend': userIdB }).exec();
    return !!user;
  }

  /**
   * List friends for a user
   */
  static async listFriends(userId: string) {
    const user = await User.findById(userId).populate('friends.friend', '-password').exec();
    return user ? user.friends : [];
  }

  /**
   * List pending friend requests for a user
   */
  static async listPendingRequests(userId: string) {
    return FriendRequest.find({ receiver: userId, status: 'pending' })
      .populate('sender', '-password')
      .exec();
  }
}

export default FriendService;
