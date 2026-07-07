import {
  CallClient,
  LocalVideoStream,
  type Call,
  type CallAgent,
  type DeviceManager,
  type RemoteParticipant,
  type RemoteVideoStream,
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

type RemoteVideoMap = Record<string, RemoteVideoStream | null>;

function getRemoteParticipantKey(
  participant: RemoteParticipant,
): string {
  const rawId =
    "rawId" in participant.identifier
      ? participant.identifier.rawId
      : undefined;

  return rawId || participant.displayName || "unknown";
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

  const [remoteParticipants, setRemoteParticipants] =
    useState<RemoteParticipant[]>([]);
  const [remoteVideoMap, setRemoteVideoMap] =
    useState<RemoteVideoMap>({});

  const callAgentRef = useRef<CallAgent | null>(null);
  const deviceManagerRef = useRef<DeviceManager | null>(null);

  const participantListenersRef = useRef<
    Map<
      string,
      {
        participant: RemoteParticipant;
        onVideoStreamsUpdated: () => void;
        streamAvailabilityListeners: Map<
          number,
          () => void
        >;
      }
    >
  >(new Map());

  function updateRemoteVideoMap(
    participant: RemoteParticipant,
  ) {
    const key = getRemoteParticipantKey(participant);

    const availableStream =
      participant.videoStreams.find(
        (stream) => stream.isAvailable,
      ) ?? null;

    setRemoteVideoMap((prev) => ({
      ...prev,
      [key]: availableStream,
    }));
  }

  function detachParticipantListeners(
    participant: RemoteParticipant,
  ) {
    const key = getRemoteParticipantKey(participant);
    const saved =
      participantListenersRef.current.get(key);

    if (!saved) {
      return;
    }

    participant.off(
      "videoStreamsUpdated",
      saved.onVideoStreamsUpdated,
    );

    participant.videoStreams.forEach((stream) => {
      const listener =
        saved.streamAvailabilityListeners.get(
          stream.id,
        );

      if (listener) {
        stream.off("isAvailableChanged", listener);
      }
    });

    participantListenersRef.current.delete(key);
  }

  function attachStreamAvailabilityListeners(
    participant: RemoteParticipant,
  ) {
    const key = getRemoteParticipantKey(participant);
    const saved =
      participantListenersRef.current.get(key);

    if (!saved) {
      return;
    }

    participant.videoStreams.forEach((stream) => {
      if (
        saved.streamAvailabilityListeners.has(
          stream.id,
        )
      ) {
        return;
      }

      const onIsAvailableChanged = () => {
        updateRemoteVideoMap(participant);
      };

      stream.on(
        "isAvailableChanged",
        onIsAvailableChanged,
      );

      saved.streamAvailabilityListeners.set(
        stream.id,
        onIsAvailableChanged,
      );
    });
  }

  function subscribeRemoteParticipant(
    participant: RemoteParticipant,
  ) {
    const key = getRemoteParticipantKey(participant);

    if (
      participantListenersRef.current.has(key)
    ) {
      updateRemoteVideoMap(participant);
      attachStreamAvailabilityListeners(participant);
      return;
    }

    const onVideoStreamsUpdated = () => {
      attachStreamAvailabilityListeners(participant);
      updateRemoteVideoMap(participant);
    };

    participant.on(
      "videoStreamsUpdated",
      onVideoStreamsUpdated,
    );

    participantListenersRef.current.set(key, {
      participant,
      onVideoStreamsUpdated,
      streamAvailabilityListeners: new Map(),
    });

    attachStreamAvailabilityListeners(participant);
    updateRemoteVideoMap(participant);
  }

  useEffect(() => {
    let disposed = false;
    let joinedCall: Call | null = null;

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

        joinedCall = callAgent.join(
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
          setCallState(joinedCall?.state ?? "None");
        });

        joinedCall.remoteParticipants.forEach(
          (participant) => {
            subscribeRemoteParticipant(participant);
          },
        );

        setRemoteParticipants([
          ...joinedCall.remoteParticipants,
        ]);

        joinedCall.on(
          "remoteParticipantsUpdated",
          (event) => {
            console.log(
              "remoteParticipantsUpdated",
              joinedCall?.remoteParticipants.map((p) => ({
                displayName: p.displayName,
                rawId:
                  "rawId" in p.identifier
                    ? p.identifier.rawId
                    : null,
                streamCount: p.videoStreams.length,
                streams: p.videoStreams.map((s) => ({
                  id: s.id,
                  isAvailable: s.isAvailable,
                })),
              })),
            );

            event.added.forEach((participant) => {
              subscribeRemoteParticipant(
                participant,
              );
            });

            event.removed.forEach((participant) => {
              const key =
                getRemoteParticipantKey(participant);

              detachParticipantListeners(
                participant,
              );

              setRemoteVideoMap((prev) => ({
                ...prev,
                [key]: null,
              }));
            });

            setRemoteParticipants([
              ...joinedCall!.remoteParticipants,
            ]);
          },
        );
      } catch (error) {
        console.error(
          "ACS 영상회의 연결 실패:",
          error,
        );
      }
    }

    void startCall();

    return () => {
      disposed = true;

      participantListenersRef.current.forEach(
        ({ participant }) => {
          detachParticipantListeners(participant);
        },
      );

      if (joinedCall) {
        joinedCall
          .hangUp({
            forEveryone: false,
          })
          .catch(console.error);
      }

      callAgentRef.current
        ?.dispose()
        .catch(console.error);
    };
  }, [token, username, meetingId]);

  return {
    call,
    callState,
    localVideoStream,
    remoteParticipants,
    remoteVideoMap,
    deviceManager: deviceManagerRef.current,
  };
}