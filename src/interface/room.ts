interface Room {
  id: string;
  snippet: {
    channelId: string;
    liveChatId: string;
  };
  pageToken?: string | null;
  roomType?: string[];
  additionalInfo?: {
    waitingList?: Member[];
    joinerList?: Member[];
    joinMessage?: string;
    goodbyeMessage?: string;
    welcomeMessage?: string;
    leaveMessage?: string;
  };
}

interface Member {
  channelId: string;
  additionalInfo?: any;
}

interface UserDetails{
    channelId: string;
    displayName: string;
    profileImageUrl: string;
}

interface RoomResponse {
    id: string;
    pageToken: string | null;
    roomType: string[];
    additionalInfo: {
        waitingList: Member[];
        joinerList: Member[];
        joinMessage?: string;
        goodbyeMessage?: string;
        welcomeMessage?: string;
        leaveMessage?: string;
    };
}

export {
    Room,
    Member,
    UserDetails,
    RoomResponse
}