<script setup lang="ts">
import Peer, { MediaConnection } from 'peerjs';
import { onMounted, onUnmounted, ref } from "vue";
import { io, Socket } from 'socket.io-client';

import IconMicrophoneOn from '@/components/icons/IconMicrophoneOn.vue';
import IconMicrophoneOff from '@/components/icons/IconMicrophoneOff.vue';
import IconVideo from '@/components/icons/IconVideo.vue';
import IconVideoOff from '@/components/icons/IconVideoOff.vue';
import IconSend from '@/components/icons/IconSend.vue';

const localVideo = ref<HTMLVideoElement | null>(null)
const remoteVideo = ref<HTMLVideoElement | null>(null)

const localId = ref<string>("");
const remoteId = ref<string>("");

const isMicOn = ref<boolean>(false);
const isVideoOn = ref<boolean>(false);

const socket = ref<Socket | null>(null);

// Peer instance and stream
let peer: Peer | null = null;

let localStream = ref<MediaStream | null>(null);
let currentCall: MediaConnection | null = null;



function makeCall() {

  socket.value?.emit("find-peer", localId.value);

  console.log("Making call");
}


function toggleMic() {
  if (!localStream.value) return

  localStream.value.getAudioTracks().forEach(track => {
    track.enabled = !track.enabled
    isMicOn.value = track.enabled
  })
}

function toggleVideo() {
  if (!localStream.value) return

  localStream.value.getVideoTracks().forEach(track => {
    track.enabled = !track.enabled
    isVideoOn.value = track.enabled
  })
}


function endCall() {
  if (currentCall) {
    currentCall.close();
    currentCall = null;
  }
}


function cleanupRemoteVideo() {
  if (remoteVideo.value?.srcObject) {
    const stream = remoteVideo.value.srcObject as MediaStream
    stream.getTracks().forEach(track => track.stop())
    remoteVideo.value.srcObject = null
  }
}


onMounted(() => {
  peer = new Peer();


  // set ang local
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then(val => {
      localStream.value = val;
      if (!!localVideo.value) localVideo.value.srcObject = localStream.value;

      isMicOn.value = true;
      isVideoOn.value = true;
    })
    .catch(error => {
      // Wala pa ko para handle sa error?
      console.error("device error:", error);
    });

  peer.on("open", id => {
    console.log(id);
    localId.value = id;

    socket.value = io("http://localhost:5000", {
      query: {
        peerId: localId.value
      }
    });



    socket.value.on("peer-found", remotePeerId => {
      console.log("Peer found");

      if (!peer) {
        alert("Peer has not been initialized..");
        return;
      }

      if (!localId.value) return;

      console.log("Remote:", remotePeerId);
      let call: MediaConnection;
      if (localStream.value)
        call = peer.call(remotePeerId, localStream.value);
      else
        call = peer.call(remotePeerId, new MediaStream());

      currentCall = call;

      call.on("stream", (remoteStream: MediaStream) => {
        console.log("Streaming");
        if (!remoteVideo.value) {
          alert("Remote video has not been initialized");
          return;
        };

        console.log(remoteStream);
        remoteVideo.value.srcObject = remoteStream;
      });
    });

    socket.value?.on("peer-not-found", message => {
      console.log(message);
    });
  });


  // Handle incoming call
  peer.on("call", (connection) => {
    console.log("Naay call");
    currentCall = connection;
    if (localStream.value) {
      console.log("answering with local stream");
      connection.answer(localStream.value);
    }
    else
      connection.answer();

    connection.on("stream", (remoteStream) => {
        console.log("Streaming");
      if (!remoteVideo.value) {
        alert("Remote video has not been initialized");
        return;
      };
      console.log("Streaming caller's video");
      remoteVideo.value.srcObject = remoteStream;
    });
  });
});


onUnmounted(() => {
  cleanupRemoteVideo();
  localStream.value?.getTracks().forEach(track => track.stop());
  peer?.destroy();
  socket.value?.disconnect();
});

</script>

<template>
  <header class="h-16 px-5 flex items-center">
    <p class=""><span class="font-semibold">id:</span class="text-sm"> {{ localId }}</p>
  </header>
  <main class="px-5 flex flex-col h-[calc(100vh-64px)]">
    <div class="flex flex-1 gap-5">
      <div class="flex-1 flex flex-col">

        <div class="flex-1 flex gap-5 relative">

          <!-- Remote video -->
          <video ref="remoteVideo" class="flex-1 border" autoplay playsinline></video>

          <video ref="localVideo" class="absolute z-10 bottom-5 right-5 rounded w-96" autoplay muted
            playsinline></video>
        </div>

        <!-- Call controls -->
        <div class="h-20 flex items-center justify-center">
          <div class="flex gap-3">
            <button class="btn btn-soft btn-circle" @click="toggleMic()">
              <IconMicrophoneOn v-if="isMicOn" />
              <IconMicrophoneOff v-else />
            </button>

            <button class="btn btn-soft btn-circle" @click="toggleVideo()">
              <IconVideo v-if="isVideoOn" />
              <IconVideoOff v-else />
            </button>

            <button class="btn btn-soft" @click="makeCall()">
              Find Peer
            </button>
          </div>
        </div>
      </div>

      <!-- Chat section -->
      <div class="w-96 flex flex-col">
        <div class="flex-1 shadow rounded p-2">
          <div class="chat chat-end">
            <div class="chat-header">
              You
              <time class="text-xs opacity-50">2 hours ago</time>
            </div>
            <div class="chat-bubble">You underestimate my power!</div>
          </div>

          <div class="chat chat-start">
            <div class="chat-header">
              Obi-Wan Kenobi
              <time class="text-xs opacity-50">2 hours ago</time>
            </div>
            <div class="chat-bubble">You underestimate my power!</div>
          </div>
        </div>
        <div class="h-20 flex items-center">
          <label for="" class="input pr-0 flex-1 w-full">
            <input type="text" class="grow" placeholder="Type your message">
            <button class="btn btn-sm btn-ghost btn-primary">
              <IconSend />
            </button>
          </label>
        </div>
      </div>
    </div>
  </main>
</template>
