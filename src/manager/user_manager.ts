import { runMongoFunction } from "../core/mongoConnection";
import { UserDetails } from "../interface/room";

interface User {
  commenterChannelId: string;
  channelId: string;
  displayName: string;
  profileImage: string;
  additionalInfo: Record<string, unknown>;
}

class UserManager {
  db_string: string;
  collection_string: string;

  constructor() {
    this.db_string = "kinoChat";
    this.collection_string = "users";
  }

  async getUserInfo(userDetails: UserDetails, commenterChannelId: string): Promise<User | null> {
    const user = await runMongoFunction(
      this.db_string,
      this.collection_string,
      async (collection) => {
        return await collection.findOne({
          channelId: userDetails.channelId,
          commenterChannelId: commenterChannelId,
        });
      }
    );

    console.log("User info", user);

    if (user != null) {
      return user;
    } else {
      await runMongoFunction(
        this.db_string,
        this.collection_string,
        async (collection) => {
          collection.insertOne({
            commenterChannelId: commenterChannelId,
            channelId: userDetails.channelId,
            displayName: userDetails.displayName,
            profileImage: userDetails.profileImageUrl,
            additionalInfo: {},
          });
        }
      );

      return {
        commenterChannelId: commenterChannelId,
        channelId: userDetails.channelId,
        displayName: userDetails.displayName,
        profileImage: userDetails.profileImageUrl,
        additionalInfo: {},
      };
    }
  }

  async setUserAdditionalInfo(channelId: string, commenterChannelId: string, additionalInfo: Record<string, unknown>): Promise<void> {
    await runMongoFunction(
      this.db_string,
      this.collection_string,
      async (collection) => {
        await collection.updateOne(
          {
            channelId: channelId,
            commenterChannelId: commenterChannelId,
          },
          {
            $set: {
              additionalInfo: additionalInfo,
            },
          }
        );
      }
    );
  }
}

export default UserManager;
