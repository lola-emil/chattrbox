import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const PORT = parseInt(process.env["PORT"] ?? "5000");

const server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const waitingPool = new Set<string>();
const peerMap = new Map<string, string>();

function findPeer(localPeerId: string, skipPeerId?: string) {
    const poolArray = Array.from(waitingPool);

    let matchedId: string | null = null;
    for (let i = 0; i < poolArray.length; i++) {
        matchedId = poolArray[i];

        if (matchedId == skipPeerId || matchedId == localPeerId)
            continue;

        break;
    }

    return matchedId;
}

io.on("connection", socket => {

    const peerId = <string>socket.handshake.query.peerId;
    const currentSocketId = socket.id;

    socket.on("wait-for-peer", async (id) => {
        peerMap.set(id, currentSocketId);

        const matchedId = findPeer(id);


        console.log("Bullshit", matchedId);

        const poolArray = Array.from(waitingPool);

        if (matchedId) {
            let matchedId = poolArray[0];
               waitingPool.delete(matchedId);

            const matchedSocketId = peerMap.get(matchedId);

            if (matchedSocketId)
                socket.to(matchedSocketId).emit("found-you", id);

            // TODO: should send the event to a specific socket id
            socket.emit("peer-found", matchedId);

        } else {
            waitingPool.add(id);
            console.log("Can't find peer")
            console.log({ waitingPool, peerMap, matchedId });
            socket.emit("waiting", "Can't find peer. Waiting...");
        }

    });


    socket.on("skip", (localPeerId: string, previousRemotePeerId: string) => {
        const matchedId = findPeer(localPeerId, previousRemotePeerId);

        if (matchedId)
            socket.emit("peer-found", matchedId);

        waitingPool.add(localPeerId);
        socket.emit("waiting", "Can't find peer. Waiting...");
    });

    socket.on("disconnect", () => {
        waitingPool.delete(peerId);
        peerMap.delete(peerId);
    });

    socket.on("leave", localPeerId => {
        waitingPool.delete(localPeerId);
    });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}...`));