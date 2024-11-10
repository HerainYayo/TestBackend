import axios from "axios";
import { Application, Request, Response } from "express";

import messageActions from "../core/messageActions";
import { ModuleManager } from "../core/moduleManager";

const axiosInstance = axios.create({
  baseURL: "https://www.googleapis.com/youtube/v3",
  headers: {
    "Content-Type": "application/json",
  },
});

function register(app: Application, moduleManagerInstance: ModuleManager) {
  // get all live broadcasts
  app.get("/listLiveBroadcasts", async (req: Request, res: Response) => {
    try {
      const response = await axiosInstance.get("/liveBroadcasts", {
        params: {
          part: "snippet",
          broadcastType: "all",
          broadcastStatus: "all",
        },
        headers: {
          Authorization:
            "Bearer " + moduleManagerInstance.authManager.getAccessToken(),
        },
      });
      res.json(response.data);
    } catch (err: any) {
      console.error(err);
      res.status(err.response?.status || 500).json({ message: err.message });
    }
  });

  // app.post("/listLiveChatMessages", async (req: Request, res: Response) => {
  //   try {
  //     const nextPageToken = req.session?.nextPageToken || null;
  //     const response = await axiosInstance.get("/liveChat/messages", {
  //       params: {
  //         part: "snippet, authorDetails",
  //         liveChatId: req.body.liveChatId,
  //         pageToken: nextPageToken,
  //       },
  //       headers: {
  //         Authorization:
  //           "Bearer " + moduleManagerInstance.authManager.getAccessToken(),
  //       },
  //     });
  //     req.session.nextPageToken = response.data.nextPageToken;
  //     res.json(response.data);
  //   } catch (err) {
  //     res.status(err.response?.status || 500).json({ message: err.message });
  //   }
  // });

  app.post("/insertLiveChatMessage", async (req: Request, res: Response) => {
    try {

      const data = {
        snippet: {
          type: "textMessageEvent",
          liveChatId: req.body.liveChatId,
          textMessageDetails: {
            messageText: req.body.message,
          },
        },
      };

      

      const response = await axiosInstance.post("/liveChat/messages", data, {
        headers: {
          Authorization:
            "Bearer " + moduleManagerInstance.authManager.getAccessToken(),
        },
        params: {
          part: "snippet",
        },
      });
      res.json(response.data);
    } catch (err: any) {
      console.error(err);
      res.status(err.response?.status || 500).json({ message: err.message });
    }
  });

  app.get("/broadcasts", async (req: Request, res: Response) => {
    try {
      const broadCastId = req.query.broadCastId as string;
      const response = await axiosInstance.get("/liveBroadcasts", {
        params: {
          part: "snippet",
          id: broadCastId,
        },
        headers: {
          Authorization:
            "Bearer " + moduleManagerInstance.authManager.getAccessToken(),
        },
      });

      let responseData = {};
      if (response.data.items.length > 0) {
        const broadcast = response.data.items[0];
        const dbInfo =
          await moduleManagerInstance.broadcastManager.initBroadcast(
            broadcast
          );
        responseData = {
          ...broadcast,
          dbInfo: dbInfo,
        };
      }
      res.json(responseData);
    } catch (err: any) {
      res.status(err.response?.status || 500).json({ message: err.message });
    }
  });

  app.get("/resetBroadcast", async (req: Request, res: Response) => {
    try {
      const broadCastId = req.query.broadCastId as string;
      const response = await axiosInstance.get("/liveBroadcasts", {
        params: {
          part: "snippet",
          id: broadCastId,
        },
        headers: {
          Authorization:
            "Bearer " + moduleManagerInstance.authManager.getAccessToken(),
        },
      });

      let responseData = {};
      if (response.data.items.length > 0) {
        const broadcast = response.data.items[0];
        const dbInfo =
          await moduleManagerInstance.broadcastManager.resetBroadcast(
            broadcast
          );
        responseData = {
          ...broadcast,
          dbInfo: dbInfo,
        };
      }
      res.json(responseData);
    } catch (err: any) {
      res.status(err.response?.status || 500).json({ message: err.message });
    }
  });

  app.post("/processMessages", async (req: Request, res: Response) => {
    console.log("processMessages", Date.now());
    try {
      const chatId =
        moduleManagerInstance.broadcastManager.getCurrentBroadcastChatId();
      const nextPageToken =
        moduleManagerInstance.broadcastManager.getPageToken();
      const response = await axiosInstance.get("/liveChat/messages", {
        params: {
          part: "snippet, authorDetails",
          liveChatId: chatId,
          pageToken: nextPageToken,
        },
        headers: {
          Authorization:
            "Bearer " + moduleManagerInstance.authManager.getAccessToken(),
        },
      });

      moduleManagerInstance.broadcastManager.updatePageToken(
        response.data.nextPageToken
      );

      const messages = response.data.items;
      let batchResults = {};
      for (const message of messages) {
        batchResults = await messageActions(
          moduleManagerInstance.broadcastManager.current_room,
          message,
          batchResults
        );
      }

      res.json({
        ...batchResults,
      });
    } catch (err : any) {
      console.error(err);
      res.status(err.response?.status || 500).json({ message: err.message });
    }
  });

  app.post("/updateRoomAdditionalInfo", async (req: Request, res: Response) => {
    try {
      const additionalInfo = req.body.additionalInfo;
      const updatedRoomInfo =
        await moduleManagerInstance.broadcastManager.updateRoomAdditionalInfo(
          additionalInfo
        );
      res.json(updatedRoomInfo);
    } catch (err : any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/updateUserAdditionalInfo", async (req: Request, res: Response) => {
    try {
      const userChannelId = req.body.channelId;
      const additionalInfo = req.body.additionalInfo;
      const channelId =
        moduleManagerInstance.broadcastManager.current_room?.snippet.channelId || '';
      console.log("channelId", channelId);
      console.log("userChannelId", userChannelId);
      console.log("additionalInfo", additionalInfo);

      moduleManagerInstance.userManager.setUserAdditionalInfo(
        channelId,
        userChannelId,
        additionalInfo
      );

      moduleManagerInstance.broadcastManager.updateMemberInListAndDB(
        userChannelId,
        additionalInfo
      );

      res.json("Update Message Received");
    } catch (err : any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/removeMember", async (req: Request, res: Response) => {
    try {
      const memberChannelId = req.body.channelId;
      moduleManagerInstance.broadcastManager.rmvMemberFromBothLists(
        memberChannelId
      );
      res.json("Member Removed");
    } catch (err : any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/startGame", async (req: Request, res: Response) => {
    try {
      const joinerList = req.body.joinerList;
      const waitingList = req.body.waitingList;

      moduleManagerInstance.broadcastManager.updateBothListsAndDB(
        joinerList,
        waitingList
      );

      res.json("Game Started Message Received");
    } catch (err : any) {
      res.status(500).json({ message: err.message });
    }
  });
}

export { register };
