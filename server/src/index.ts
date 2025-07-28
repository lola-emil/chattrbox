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

io.on("connection", socket => {
    const peerId = <string>socket.handshake.query.peerId;
    waitingPool.add(peerId);

    socket.on("find-peer", (localPeerId) => {
        console.log(waitingPool);

        console.log("Peer Id", localPeerId);

        console.log({ peerId, localPeerId })

        // Remove imong self para dili ma match sa imong self
        waitingPool.delete(localPeerId);

        const poolArray = Array.from(waitingPool);
        if (poolArray.length > 0) {
            let matchedId = poolArray[0]; // ang pinaka una nga naghuwat
            waitingPool.delete(matchedId); // remove ang peer
            console.log("matched Id", matchedId);
            socket.emit("peer-found", matchedId);
        } else {
            waitingPool.add(localPeerId);
            socket.emit("peer-not-found", "Can't find peer");
        }

    });

    socket.on("disconnect", () => {
        waitingPool.delete(peerId);
    });

    socket.on("leave", localPeerId => {
        waitingPool.delete(localPeerId);
    });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}...`));