import UserGroup, { IUserGroup } from "../models/UserGroup"; // adjust the path as needed
import mongoose from "mongoose";

/**
 * Returns all active user groups a user belongs to.
 * @param userId - MongoDB ObjectId string of the user
 * @returns Promise resolving to an array of IUserGroup documents
 */
export async function getUserGroups(userId: string): Promise<IUserGroup[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
    }

    const groups = await UserGroup.find({
        members: new mongoose.Types.ObjectId(userId),
        is_active: true,
    }).lean();

    return groups;
}
