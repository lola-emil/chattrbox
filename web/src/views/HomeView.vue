<script setup lang="ts">
import Peer, { MediaConnection } from 'peerjs';
import { onMounted, ref } from "vue";

const localVideo = ref<HTMLVideoElement | null>(null)
const remoteVideo = ref<HTMLVideoElement | null>(null)

const localId = ref<string>("");
const remoteId = ref<string>("");

// Peer instance and stream
let peer: Peer | null = null;

let localStream: MediaStream | null = null;
let currentCall: MediaConnection | null = null;

function makeCall() {
  if (!localId.value || !localStream) return;

  const call = peer?.call(remoteId.value, localStream);

  call?.on("stream", (remoteStream: MediaStream) => {
    if (!remoteVideo.value) {
      alert("Remote video has not been initialized");
      return;
    };

    remoteVideo.value.srcObject = remoteStream;
  })
}


onMounted(() => {
  peer = new Peer();

  // set ang local
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then(val => {
      localStream = val;
      if (!!localVideo.value) localVideo.value.srcObject = localStream;
    })
    .catch(error => {
      // Wala pa ko para handle sa error?
      console.error("device error:", error);
    });

  peer.on("open", id => {
    console.log(id);
  });


  // Handle incoming call
  peer.on("call", (connection) => {
    if (localStream) {
      connection.answer(localStream);

      connection.on("stream", (remoteStream) => {
        if (!remoteVideo.value) {
          alert("Remote video has not been initialized");
          return;
        };
        remoteVideo.value.srcObject = remoteStream;
      })
    }
  });
});


</script>

<template>
  <header class="h-16"></header>
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
        <div class="h-20 "></div>
      </div>

      <!-- Chat section -->
      <div class="w-96 flex flex-col">
        <div class="flex-1 bg-green-500"></div>
        <div class="h-20 bg-pink-500"></div>
      </div>
    </div>
  </main>
</template>
