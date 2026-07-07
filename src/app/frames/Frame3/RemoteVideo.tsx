import { useEffect, useRef } from "react";
import {
  VideoStreamRenderer,
  type RemoteVideoStream,
} from "@azure/communication-calling";

export function RemoteVideo({
  stream,
}: {
  stream: RemoteVideoStream | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (!stream) {
      console.log("RemoteVideo: stream is null");
      containerRef.current.innerHTML = "";
      return;
    }

    if (!stream.isAvailable) {
      console.log("RemoteVideo: stream exists but isAvailable=false", {
        id: stream.id,
      });
      containerRef.current.innerHTML = "";
      return;
    }

    let disposed = false;
    const renderer = new VideoStreamRenderer(stream);
    let view: Awaited<ReturnType<typeof renderer.createView>> | null = null;

    console.log("RemoteVideo: createView start", {
      id: stream.id,
      isAvailable: stream.isAvailable,
    });

    renderer
      .createView()
      .then((createdView) => {
        if (disposed || !containerRef.current) {
          createdView.dispose();
          return;
        }

        view = createdView;
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(createdView.target);

        const video =
          containerRef.current.querySelector("video");

        if (video) {
          video.style.width = "100%";
          video.style.height = "100%";
          video.style.objectFit = "cover";
        }

        console.log("RemoteVideo: createView success", {
          id: stream.id,
        });
      })
      .catch((error) => {
        console.error(
          "원격 비디오 렌더링 실패:",
          error,
        );
      });

    return () => {
      disposed = true;

      try {
        view?.dispose();
      } catch (error) {
        console.error("RemoteVideo view dispose 실패:", error);
      }

      try {
        renderer.dispose();
      } catch (error) {
        console.error("RemoteVideo renderer dispose 실패:", error);
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [stream]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden bg-black"
    />
  );
}