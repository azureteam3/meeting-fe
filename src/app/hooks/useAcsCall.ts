import {
  CallClient,
  LocalVideoStream,
  VideoStreamRenderer,
  type Call,
  type CallAgent,
  type DeviceManager,
} from "@azure/communication-calling";

import {
  AzureCommunicationTokenCredential,
} from "@azure/communication-common";

import {
  useEffect,
  useRef,
  useState,
} from "react";

interface UseAcsCallParams {
  token: string;
  username: string;
  meetingId: string;
}

export function useAcsCall({
  token,
  username,
  meetingId,
}: UseAcsCallParams) {
  const [call, setCall] = useState<Call | null>(null);
  const [callState, setCallState] = useState("None");
  const [localVideoStream, setLocalVideoStream] =
    useState<LocalVideoStream | null>(null);

  const callAgentRef = useRef<CallAgent | null>(null);
  const deviceManagerRef = useRef<DeviceManager | null>(null);

  useEffect(() => {
    let disposed = false;

    async function startCall() {
      try {
        const credential =
          new AzureCommunicationTokenCredential(token);

        const callClient = new CallClient();

        const callAgent =
          await callClient.createCallAgent(
            credential,
            {
              displayName: username,
            },
          );

        if (disposed) {
          await callAgent.dispose();
          return;
        }

        callAgentRef.current = callAgent;

        const deviceManager =
          await callClient.getDeviceManager();

        deviceManagerRef.current = deviceManager;

        await deviceManager.askDevicePermission({
          audio: true,
          video: true,
        });

        const cameras =
          await deviceManager.getCameras();

        let videoStream:
          | LocalVideoStream
          | undefined;

        if (cameras.length > 0) {
          videoStream =
            new LocalVideoStream(cameras[0]);

          setLocalVideoStream(videoStream);
        }

        const joinedCall = callAgent.join(
          {
            groupId: meetingId,
          },
          {
            audioOptions: {
              muted: false,
            },
            videoOptions: videoStream
              ? {
                  localVideoStreams: [videoStream],
                }
              : undefined,
          },
        );

        setCall(joinedCall);
        setCallState(joinedCall.state);

        joinedCall.on("stateChanged", () => {
          setCallState(joinedCall.state);
        });
      } catch (error) {
        console.error(
          "ACS 영상회의 연결 실패:",
          error,
        );
      }
    }

    startCall();

    return () => {
      disposed = true;

      call?.hangUp({
        forEveryone: false,
      }).catch(console.error);

      callAgentRef.current
        ?.dispose()
        .catch(console.error);
    };
  }, [token, username, meetingId]);

  return {
    call,
    callState,
    localVideoStream,
    deviceManager: deviceManagerRef.current,
  };
}

