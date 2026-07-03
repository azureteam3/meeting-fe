import { useEffect, useRef } from "react";

import {
  VideoStreamRenderer,
  type LocalVideoStream,
} from "@azure/communication-calling";

export function LocalVideo({
  stream,
}: {
  stream: LocalVideoStream | null;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!stream || !containerRef.current) {
      return;
    }

    const renderer = new VideoStreamRenderer(stream);

    let view: Awaited<
      ReturnType<typeof renderer.createView>
    > | null = null;

    renderer
      .createView()
      .then((createdView) => {
        view = createdView;

        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          containerRef.current.appendChild(
            createdView.target,
          );
        }
      })
      .catch((error) => {
        console.error(
          "로컬 비디오 렌더링 실패:",
          error,
        );
      });

    return () => {
      view?.dispose();
      renderer.dispose();

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [stream]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-black"
    />
  );
}