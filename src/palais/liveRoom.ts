import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { db, dbConfigured } from "./layoutsDb";

/**
 * The livestream in the Boudoir's dresser.
 *
 * Molly stands in front of her camera and whoever is in the dresser watches
 * her, live. Nothing is recorded and nothing is stored: the pictures in the
 * drawer go to a bucket, but this goes nowhere at all. When she stops, or
 * closes the tab, it is simply over.
 *
 * Her camera reaches each watcher directly, browser to browser (WebRTC). All
 * that passes through Supabase is the introduction — Realtime carries the
 * offers, the answers and the ice, and presence is how a watcher learns she
 * is on at all. One connection per watcher is made from her machine, so this
 * is a parlour for a handful of people, not a broadcast to a thousand.
 *
 * The signalling room is not itself behind the dresser's word: anyone who
 * knew the room's name could listen to the introductions. So a watcher has
 * to prove it knows the word before she will answer — she publishes a nonce
 * with her presence, the watcher sends sha256(nonce:word), and she compares
 * it with her own. The word itself never crosses the wire, and a proof
 * overheard today is no use tomorrow, because the nonce changes every time
 * she goes on.
 */

export const livestreamConfigured = dbConfigured;

/** the room the introductions happen in */
const ROOM = "palais-live";

/* Google's public STUN is enough for two machines that can see each other.
   A watcher behind a strict network — an office, some mobile carriers —
   needs a TURN server to relay, and there is no free one: set
   REACT_APP_TURN_URL (comma-separated is fine), REACT_APP_TURN_USER and
   REACT_APP_TURN_PASS and it will be used. Without it those watchers simply
   never connect, and the frame tells them so. */
function iceServers(): RTCIceServer[] {
  const ice: RTCIceServer[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  ];
  const turn = process.env.REACT_APP_TURN_URL;
  if (turn) {
    ice.push({
      urls: turn.split(",").map((u) => u.trim()).filter(Boolean),
      username: process.env.REACT_APP_TURN_USER,
      credential: process.env.REACT_APP_TURN_PASS,
    });
  }
  return ice;
}

/** whether a relay is set up, so the frame can be honest about who may fail */
export const relayReady = Boolean(process.env.REACT_APP_TURN_URL);

type Kind = "hello" | "offer" | "answer" | "ice" | "bye";
interface Sig {
  from: string;
  /** left off means everyone */
  to?: string;
  kind: Kind;
  body?: unknown;
}
interface Here {
  role: "host" | "viewer";
  id: string;
  /** the host's challenge, new every time she goes on */
  nonce?: string;
  since?: number;
}

const hex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

/** what a watcher sends instead of the word itself */
export async function proofOf(word: string, nonce: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${nonce}:${word}`);
  return hex(await crypto.subtle.digest("SHA-256", bytes));
}

const newId = () =>
  typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export interface Live {
  /** she is on right now */
  on: boolean;
  /** this browser is the one broadcasting */
  hosting: boolean;
  /** what to put in the frame: her camera, or what has reached us of it */
  stream: MediaStream | null;
  /** how many are watching (she is the only one who can know) */
  watching: number;
  /** a line for under the frame */
  say: string;
  trouble: string;
  goLive: () => Promise<void>;
  stop: () => void;
}

/**
 * Join the room. `word` is the dresser's word, which a watcher needs to prove
 * it has; `canHost` is whether this browser is allowed to turn the camera on
 * (Molly, signed in). Everyone else only ever watches.
 */
export function useLivestream(word: string | null, canHost: boolean): Live {
  const [on, setOn] = useState(false);
  const [hosting, setHosting] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [watching, setWatching] = useState(0);
  const [say, setSay] = useState("");
  const [trouble, setTrouble] = useState("");

  const me = useRef(newId());
  const chan = useRef<RealtimeChannel | null>(null);
  /** one connection per person on the other end */
  const peers = useRef(new Map<string, RTCPeerConnection>());
  /** her camera, while she is on */
  const mine = useRef<MediaStream | null>(null);
  const nonce = useRef("");
  /** who is broadcasting, as presence last said */
  const host = useRef<Here | null>(null);
  const wordNow = useRef(word);
  wordNow.current = word;

  const send = useCallback((sig: Omit<Sig, "from">) => {
    void chan.current?.send({ type: "broadcast", event: "sig", payload: { ...sig, from: me.current } });
  }, []);

  const drop = useCallback((who: string) => {
    peers.current.get(who)?.close();
    peers.current.delete(who);
    setWatching(peers.current.size);
  }, []);

  const dropAll = useCallback(() => {
    peers.current.forEach((pc) => pc.close());
    peers.current.clear();
    setWatching(0);
  }, []);

  /** the connection she makes towards one watcher, carrying her camera */
  const offerTo = useCallback(
    async (who: string) => {
      const media = mine.current;
      if (!media) return;
      drop(who);
      const pc = new RTCPeerConnection({ iceServers: iceServers() });
      peers.current.set(who, pc);
      setWatching(peers.current.size);
      media.getTracks().forEach((t) => pc.addTrack(t, media));
      pc.onicecandidate = (e) => e.candidate && send({ to: who, kind: "ice", body: e.candidate.toJSON() });
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") drop(who);
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      send({ to: who, kind: "offer", body: offer });
    },
    [drop, send],
  );

  /** the connection a watcher makes back towards her */
  const answerTo = useCallback(
    async (who: string, offer: RTCSessionDescriptionInit) => {
      peers.current.get(who)?.close();
      const pc = new RTCPeerConnection({ iceServers: iceServers() });
      peers.current.set(who, pc);
      pc.ontrack = (e) => {
        setStream(e.streams[0] ?? null);
        setSay("");
      };
      pc.onicecandidate = (e) => e.candidate && send({ to: who, kind: "ice", body: e.candidate.toJSON() });
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setSay("");
        if (pc.connectionState === "failed") {
          setSay("");
          setTrouble(
            relayReady
              ? "Couldn't reach her camera from this network."
              : "Couldn't reach her camera from this network — it needs a relay to get through.",
          );
        }
      };
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      send({ to: who, kind: "answer", body: answer });
    },
    [send],
  );

  /* ---- the room itself: joined while the tab is open, left when it closes -- */

  useEffect(() => {
    if (!dbConfigured) return;
    let gone = false;
    let ch: RealtimeChannel | null = null;

    void db()
      .then((sb) => {
        if (gone) return;
        ch = sb.channel(ROOM, {
          config: { presence: { key: me.current }, broadcast: { self: false } },
        });
        chan.current = ch;

        ch.on("presence", { event: "sync" }, () => {
          const all = Object.values(ch!.presenceState<Here>()).flat() as Here[];
          // the earliest one wins, on the day two of her are somehow on at once
          const found = all
            .filter((h) => h.role === "host")
            .sort((a, b) => (a.since ?? 0) - (b.since ?? 0))[0] ?? null;
          const was = host.current?.id;
          host.current = found;
          setOn(Boolean(found));
          if (!found) {
            // she has gone: nothing to watch, and nothing to watch it with
            if (!mine.current) {
              dropAll();
              setStream(null);
              setSay("");
            }
            return;
          }
          if (found.id === me.current || mine.current) return;   // she is us
          if (found.id === was) return;                          // already saying hello
          setTrouble("");
          setSay("Knocking…");
          const w = wordNow.current;
          if (!w || !found.nonce) {
            setSay("");
            return;
          }
          void proofOf(w, found.nonce).then((proof) => {
            if (!gone) send({ to: found.id, kind: "hello", body: { proof } });
          });
        });

        ch.on("broadcast", { event: "sig" }, ({ payload }) => {
          const sig = payload as Sig;
          if (!sig || (sig.to && sig.to !== me.current)) return;
          void (async () => {
            try {
              if (sig.kind === "hello" && mine.current) {
                // she only answers someone who can show it knows the word
                const w = wordNow.current;
                const given = (sig.body as { proof?: string } | null)?.proof;
                if (!w || !given || given !== (await proofOf(w, nonce.current))) return;
                await offerTo(sig.from);
              } else if (sig.kind === "offer") {
                await answerTo(sig.from, sig.body as RTCSessionDescriptionInit);
              } else if (sig.kind === "answer") {
                await peers.current.get(sig.from)?.setRemoteDescription(sig.body as RTCSessionDescriptionInit);
              } else if (sig.kind === "ice") {
                await peers.current.get(sig.from)?.addIceCandidate(sig.body as RTCIceCandidateInit);
              } else if (sig.kind === "bye") {
                drop(sig.from);
                if (!mine.current) setStream(null);
              }
            } catch {
              /* a handshake that falls over just doesn't connect */
            }
          })();
        });

        void ch.subscribe((status) => {
          if (status === "SUBSCRIBED") void ch!.track({ role: "viewer", id: me.current } satisfies Here);
          if (status === "CHANNEL_ERROR") setTrouble("Couldn't reach the room.");
        });
      })
      .catch(() => setTrouble("Couldn't reach the room."));

    return () => {
      gone = true;
      send({ kind: "bye" });
      dropAll();
      mine.current?.getTracks().forEach((t) => t.stop());
      mine.current = null;
      chan.current = null;
      void ch?.unsubscribe();
    };
  }, [answerTo, drop, dropAll, offerTo, send]);

  /* ---- turning the camera on and off -------------------------------------- */

  const goLive = useCallback(async () => {
    if (!canHost || mine.current) return;
    setTrouble("");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      mine.current = media;
      nonce.current = newId();
      setStream(media);
      setHosting(true);
      setOn(true);
      dropAll();
      await chan.current?.track({
        role: "host",
        id: me.current,
        nonce: nonce.current,
        since: Date.now(),
      } satisfies Here);
    } catch (e) {
      const why = e instanceof Error ? e.name : "";
      setTrouble(
        why === "NotAllowedError"
          ? "The browser wouldn't let this page have the camera."
          : why === "NotFoundError"
            ? "No camera on this machine."
            : "The camera wouldn't start.",
      );
    }
  }, [canHost, dropAll]);

  const stop = useCallback(() => {
    if (!mine.current) return;
    send({ kind: "bye" });
    dropAll();
    mine.current.getTracks().forEach((t) => t.stop());
    mine.current = null;
    nonce.current = "";
    setStream(null);
    setHosting(false);
    setOn(false);
    void chan.current?.track({ role: "viewer", id: me.current } satisfies Here);
  }, [dropAll, send]);

  return { on, hosting, stream, watching, say, trouble, goLive, stop };
}
