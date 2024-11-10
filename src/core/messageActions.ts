import axios from "axios";
import { AxiosInstance } from "axios";
import { ModuleManager } from "./moduleManager";

import { Room, UserDetails } from "../interface/room";

import {moduleManagerInstance} from "../core/moduleManager";

interface Message {
  snippet: {
    type: string;
    textMessageDetails: {
      messageText: string;
    };
  };
  authorDetails: UserDetails;
}

interface Result {
  newWaitingList?: any[];
  rmvWaitingList?: string[];
}

const roomActions: { [key: string]: Function[] } = {
  privateBattle: [handleJoinMessageAction, handleExitMessageAction],
};

const axiosInstance: AxiosInstance = axios.create({
  baseURL: "https://www.googleapis.com/youtube/v3",
  headers: {
    "Content-Type": "application/json",
  },
});

async function handleJoinMessageAction(
  roomInfo: Room,
  message: Message,
  previousResult: Result
): Promise<Result> {
  let result = previousResult;
  let joinMessage = roomInfo.additionalInfo?.joinMessage || "join";
  console.log("Join message action", joinMessage);
  if (
    message.snippet.type === "textMessageEvent" &&
    message.snippet.textMessageDetails.messageText === joinMessage
  ) {
    console.log("Join message received");

    let userInfo = await moduleManagerInstance.userManager.getUserInfo(
      message.authorDetails,
      roomInfo.snippet.channelId
    );

    console.log("result newWaitingList", result.newWaitingList);
    console.log(
      "in waiting list",
      moduleManagerInstance.broadcastManager.isMemberInWaitingList(
        message.authorDetails.channelId
      )
    );

    if (
      moduleManagerInstance.broadcastManager.isMemberInWaitingList(
        message.authorDetails.channelId
      )
    ) {
      console.log("already in waiting list");
      return result;
    }

    if (userInfo) {
      userInfo.additionalInfo.playCount = 0;
    }

    if (result.newWaitingList) {
      if (
        result.newWaitingList.find(
          (element) => element.channelId === message.authorDetails.channelId
        )
      ) {
        console.log("already in waiting list");
        return result;
      }
      result.newWaitingList.push(userInfo);
    } else {
      result.newWaitingList = [userInfo];
    }

    if (userInfo) {
      moduleManagerInstance.broadcastManager.addMemberToWaitingList(userInfo);
    }

    let welcomeMessage = roomInfo.additionalInfo?.welcomeMessage || "Welcome!";
    if (userInfo) {
      welcomeMessage = welcomeMessage.replace(":name", userInfo.displayName);
    }

    let data = {
      snippet: {
        type: "textMessageEvent",
        liveChatId: roomInfo.snippet.liveChatId,
        textMessageDetails: {
          messageText: "[きのボット] " + welcomeMessage,
        },
      },
    };

    axiosInstance
      .post("/liveChat/messages", data, {
        headers: {
          Authorization:
            "Bearer " + moduleManagerInstance.authManager.getAccessToken(),
        },
        params: {
          part: "snippet",
        },
      })
      .then((response) => {
        console.log("Welcome message sent");
      })
      .catch((err) => {
        console.log("Error sending welcome message", err);
      });
  }
  return result;
}

async function handleExitMessageAction(
  roomInfo: Room,
  message: Message,
  previousResult: Result
): Promise<Result> {
  let result = previousResult;
  let exitMessage = roomInfo.additionalInfo?.leaveMessage || "exit";
  if (
    message.snippet.type === "textMessageEvent" &&
    message.snippet.textMessageDetails.messageText === exitMessage
  ) {
    console.log(
      "Exit message received",
      message.authorDetails.channelId,
      message.snippet.textMessageDetails.messageText
    );

    if (
      !moduleManagerInstance.broadcastManager.isMemberInWaitingList(
        message.authorDetails.channelId
      ) &&
      !moduleManagerInstance.broadcastManager.isMemberInJoinerList(
        message.authorDetails.channelId
      )
    ) {
      console.log("not in waiting list or joiner list");
      return result;
    }

    console.log("Removing:", result);
    if (result.rmvWaitingList) {
      console.log("result rmvWaitingList", result.rmvWaitingList);
      if (result.rmvWaitingList.includes(message.authorDetails.channelId)) {
        return result;
      }
      result.rmvWaitingList.push(message.authorDetails.channelId);
    } else {
      result.rmvWaitingList = [message.authorDetails.channelId];
    }

    moduleManagerInstance.broadcastManager.rmvMemberFromBothLists(
      message.authorDetails.channelId
    );

    let goodbyeMessage = roomInfo.additionalInfo?.goodbyeMessage || "Goodbye!";
    goodbyeMessage = goodbyeMessage.replace(
      ":name",
      message.authorDetails.displayName
    );

    let data = {
      snippet: {
        type: "textMessageEvent",
        liveChatId: roomInfo.snippet.liveChatId,
        textMessageDetails: {
          messageText: "[きのボット] " + goodbyeMessage,
        },
      },
    };

    axiosInstance
      .post("/liveChat/messages", data, {
        headers: {
          Authorization:
            "Bearer " + moduleManagerInstance.authManager.getAccessToken(),
        },
        params: {
          part: "snippet",
        },
      })
      .then((response) => {
        console.log("Goodbye message sent");
      })
      .catch((err) => {
        console.log("Error sending goodbye message", err);
      });
  }
  return result;
}

async function messageActions(
  roomInfo: Room | null,
  message: Message,
  batchResults: Result
): Promise<Result> {
  let result = batchResults;
  if (!roomInfo) {
    return result;
  }
  if(!roomInfo.roomType){
    return result;
  }
  for(let i = 0; i < roomInfo.roomType.length; i++){
    if(!roomActions[roomInfo.roomType[i]]){
      return result;
    }
    for(let j = 0; j < roomActions[roomInfo.roomType[i]].length; j++){
      result = await roomActions[roomInfo.roomType[i]][j](roomInfo, message, result);
    }
  }
  return result;
}

export default messageActions;
