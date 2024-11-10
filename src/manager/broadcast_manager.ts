import { runMongoFunction } from "../core/mongoConnection";
import {Room, Member, RoomResponse} from "../interface/room";
import { HttpError } from "../core/Error";


class BroadcastManager {
  current_room: Room | null = null;
  db_string: string;
  collection_string: string;

  constructor() {
    this.db_string = "kinoChat";
    this.collection_string = "broadcasts";
  }

  async initBroadcast(room: Room): Promise<RoomResponse> {
    this.current_room = room;
    const broadcast = await runMongoFunction(
      this.db_string,
      this.collection_string,
      async (collection) => {
        return await collection.findOne({ id: room.id });
      }
    );

    if (broadcast != null) {
      this.current_room = {
        ...this.current_room,
        pageToken: broadcast.pageToken,
        roomType: broadcast.roomType,
        additionalInfo: broadcast.additionalInfo,
      };
      return broadcast;
    } else {
      await runMongoFunction(
        this.db_string,
        this.collection_string,
        async (collection) => {
          return await collection.insertOne({
            id: room.id,
            pageToken: null,
            roomType: ["privateBattle"],
            additionalInfo: {
              waitingList: [],
              joinerList: [],
            },
          });
        }
      );

      this.current_room = {
        ...this.current_room,
        pageToken: null,
        roomType: ["privateBattle"],
        additionalInfo: {
          waitingList: [],
          joinerList: [],
        },
      };

      return {
        id: room.id,
        pageToken: null,
        roomType: ["privateBattle"],
        additionalInfo: {
          waitingList: [],
          joinerList: [],
        },
      };
    }
  }

  async resetBroadcast(room: Room): Promise<RoomResponse> {
    this.current_room = room;
    await runMongoFunction(
      this.db_string,
      this.collection_string,
      async (collection) => {
        return await collection.updateOne(
          { id: room.id },
          {
            $set: {
              pageToken: null,
              roomType: ["privateBattle"],
              additionalInfo: {
                waitingList: [],
                joinerList: [],
              },
            },
          }
        );
      }
    );
    return {
      id: room.id,
      pageToken: null,
      roomType: ["privateBattle"],
      additionalInfo: {
        waitingList: [],
        joinerList: [],
      },
    };
  }

  async updatePageToken(token: string): Promise<void> {
    if (this.current_room) {
      this.current_room.pageToken = token;
      await runMongoFunction(
        this.db_string,
        this.collection_string,
        async (collection) => {
          return await collection.updateOne(
            { id: this.current_room!.id },
            { $set: { pageToken: token } }
          );
        }
      );
    }
  }

  getPageToken(): string | null {
    return this.current_room?.pageToken || null;
  }

  getCurrentBroadcastChatId(): string {
    if (!this.current_room || !this.current_room.snippet) {
      // throw error, status 404, room not found
      throw new HttpError(404, "Room not found");

    }
    return this.current_room.snippet.liveChatId!;
  }

  async updateRoomAdditionalInfo(additionalInfo: any): Promise<Room | null> {
    if (this.current_room) {
      this.current_room.additionalInfo = additionalInfo;
      await runMongoFunction(
        this.db_string,
        this.collection_string,
        async (collection) => {
          return await collection.updateOne(
            { id: this.current_room!.id },
            { $set: { additionalInfo: additionalInfo } }
          );
        }
      );
      return this.current_room;
    }
    return null;
  }

  isMemberInJoinerList(memberChannelId: string): boolean {
    return this.current_room?.additionalInfo?.joinerList?.some(
      (member) => member.channelId === memberChannelId
    ) || false;
  }

  isMemberInWaitingList(memberChannelId: string): boolean {
    return this.current_room?.additionalInfo?.waitingList?.some(
      (member) => member.channelId === memberChannelId
    ) || false;
  }

  async addMemberToWaitingList(member: Member): Promise<void> {
    if (this.current_room) {
      this.current_room.additionalInfo!.waitingList?.push(member);
      await runMongoFunction(
        this.db_string,
        this.collection_string,
        async (collection) => {
          return await collection.updateOne(
            { id: this.current_room!.id },
            {
              $set: { additionalInfo: this.current_room!.additionalInfo },
            }
          );
        }
      );
    }
  }

  async addMemberToJoinerList(member: Member): Promise<void> {
    if (this.current_room) {
      this.current_room.additionalInfo!.joinerList?.push(member);
      await runMongoFunction(
        this.db_string,
        this.collection_string,
        async (collection) => {
          return await collection.updateOne(
            { id: this.current_room!.id },
            {
              $set: { additionalInfo: this.current_room!.additionalInfo },
            }
          );
        }
      );
    }
  }

  async rmvMemberFromBothLists(memberChannelId: string): Promise<void> {
    if (this.current_room) {
      console.log("removing member from both lists", memberChannelId);
      this.current_room.additionalInfo!.waitingList =
        this.current_room.additionalInfo!.waitingList?.filter(
          (member) => member.channelId !== memberChannelId
        );
      this.current_room.additionalInfo!.joinerList =
        this.current_room.additionalInfo!.joinerList?.filter(
          (member) => member.channelId !== memberChannelId
        );

      await runMongoFunction(
        this.db_string,
        this.collection_string,
        async (collection) => {
          return await collection.updateOne(
            { id: this.current_room!.id },
            {
              $set: { additionalInfo: this.current_room!.additionalInfo },
            }
          );
        }
      );
    }
  }

  async updateMemberInListAndDB(memberChannelId: string, additionalInfo: any): Promise<void> {
    if (this.current_room) {
      if (this.isMemberInJoinerList(memberChannelId)) {
        this.current_room.additionalInfo!.joinerList =
          this.current_room.additionalInfo!.joinerList?.map((member) => {
            if (member.channelId === memberChannelId) {
              return {
                ...member,
                additionalInfo: additionalInfo,
              };
            }
            return member;
          });
      }

      if (this.isMemberInWaitingList(memberChannelId)) {
        this.current_room.additionalInfo!.waitingList =
          this.current_room.additionalInfo!.waitingList?.map((member) => {
            if (member.channelId === memberChannelId) {
              return {
                ...member,
                additionalInfo: additionalInfo,
              };
            }
            return member;
          });
      }

      await runMongoFunction(
        this.db_string,
        this.collection_string,
        async (collection) => {
          return await collection.updateOne(
            { id: this.current_room!.id },
            {
              $set: { additionalInfo: this.current_room!.additionalInfo },
            }
          );
        }
      );
    }
  }

  async updateBothListsAndDB(joinerList: Member[], waitingList: Member[]): Promise<void> {
    if (this.current_room) {
      this.current_room.additionalInfo!.joinerList = joinerList;
      this.current_room.additionalInfo!.waitingList = waitingList;

      await runMongoFunction(
        this.db_string,
        this.collection_string,
        async (collection) => {
          return await collection.updateOne(
            { id: this.current_room!.id },
            {
              $set: { additionalInfo: this.current_room!.additionalInfo },
            }
          );
        }
      );
    }
  }
}

export default BroadcastManager;
