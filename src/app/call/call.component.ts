import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {WebRtcPeer} from 'kurento-utils';
import {RxStompService} from '@stomp/ng2-stompjs';
import {User} from './user';
import { ɵHAMMER_PROVIDERS__POST_R3__ } from '@angular/platform-browser';


@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.css']
})
export class CallComponent implements OnInit, OnDestroy {

  @ViewChild('local-video')
  localVideo: ElementRef<HTMLVideoElement>;

  @ViewChild('remote-video')
  remoteVideo: ElementRef<HTMLVideoElement>;


  public callWith: string;
  public currentUser: User;
  public poster: string;

  private topicSubscription: any;
  private webRtcPeer: WebRtcPeer;
  private inCall: boolean;
  private inPlay: boolean;
  private hasRecord: boolean;


  public modes: string[];
  public mode: string;

  constructor(
    private rxStompService: RxStompService
  ) {
    this.currentUser.name = '';
    this.currentUser.id = 999999;
    this.inCall = false;
    this.inPlay = false;
    this.hasRecord = false;
    this.mode = 'default';
    this.modes = ['default', 'audio', 'video'];
    this.poster = '/assets/images/webrtc.png';
  }
  ngOnDestroy(): void {
    this.topicSubscription.unsubscribe();
    this.rxStompService.deactivate();
  }

  ngOnInit(): void {

  }

  private onPlayResponse(payload): void {  // gerer la reponse du play
    if (payload.response === 'accepted') {
      this.webRtcPeer.processAnswer(payload.sdpAnswer, (error) => {
        if (error) {
          console.error(error);
        }
      });
    } else {
      this.stopPlay();
      console.error(payload.error);
    }
  }

  private onCallResponse(payload): void { // gerer la reponse de l'appel
    if (payload.response === 'accepted') {
      this.webRtcPeer.processAnswer(payload.sdpAnswer, (error) => {
        if (error) {
          console.error(error);
        }
      });
    } else {
      this.stop();
      console.error(payload.message);
    }
  }

  private onStartCommunication(payload): void { // fach ghaybda ydouz appel
    this.inCall = true;
    this.webRtcPeer.processAnswer(payload.sdpAnswer, (error) => {
      if (error) {
        console.error(error);
      }
    });
  }

  private onStopCommunication(): void { // fach ghay7bbs appel
    this.finalizeWebRtcPeer();
  }

  register(): void {  // enregistrer l'utilisateur
    this.sendStompMessage('register', this.currentUser);
    console.log(this.currentUser);
  }
  getName(name): void{ // retourner le nom de l'utilisqteur
    this.currentUser.name = name;
  }

  public call(): void { // appeler call
    this.inCall = true;
    const options = {
      mediaConstraints: {
        audio: this.isWithAudio(),
        video: this.isWithVideo()
      },
      localVideo: this.localVideo,
      remoteVideo: this.remoteVideo,
      onicecandidate: (iceCandidate: any) => {
        this.sendStompMessage('ice-candidate', {candidate: iceCandidate});
      }
    };
    this.webRtcPeer = WebRtcPeer.WebRtcPeerSendrecv(options, (error) => {
      if (error) {
        console.error(error);
      }
      // tslint:disable-next-line: no-shadowed-variable
      this.webRtcPeer.generateOffer((error: string, sdp: string) => {
        if (error) {
          console.error(error);
        }
        this.sendStompMessage('call', {
          from: this.currentUser.name,
          to: this.callWith,
          sdpOffer: sdp,
          mode: this.mode
        });
      });
    });
  }

  private onIncomingCall(payload): void { // recevoir un appel
    if (confirm('the user ' + payload.from + ' is calling you accept?')) {
      this.callWith = payload.from;
      this.inCall = true;

      const options = {
        mediaConstraints: {
          audio: this.isWithAudio(),
          video: this.isWithVideo()
        },
        localVideo: this.localVideo,
        remoteVideo: this.remoteVideo,
        onicecandidate: (iceCandidate: any) => {
          this.sendStompMessage('ice-candidate', {candidate: iceCandidate});
        }
      };

      this.webRtcPeer = WebRtcPeer.WebRtcPeerSendrecv(options, (error) => {
        if (error) {
          console.error(error);
        }
        // tslint:disable-next-line: no-shadowed-variable
        this.webRtcPeer.generateOffer((error: string, sdp: string) => {
          if (error) {
            console.error(error);
          }
          this.sendStompMessage('incoming-call-response', {
            from: payload.from,
            callResponse: 'accept',
            sdpOffer: sdp,
            mode: this.mode
          });
        });
      });
    } else {
      this.inCall = false;
      this.sendStompMessage('incoming-call-response', {
        from: payload.from,
        callResponse: 'reject',
        message: 'user declined'
      });
      stop();
    }
  }






// stop
public stop(): void {
    this.sendStompMessage('stop', {});
    this.finalizeWebRtcPeer();
  }

  public stopPlay(): void { // arrete le play
    this.sendStompMessage('stop-play', {});
    this.finalizeWebRtcPeer();
  }

  // safi salina cummunication ghadi nfixiw dakchi nredouh kima kan
   private finalizeWebRtcPeer(): void {
    this.inCall = false;
    this.inPlay = false;
    this.hasRecord = true;

    if (this.webRtcPeer) {
      this.webRtcPeer.dispose();
      this.webRtcPeer = null;
    }
    this.localVideo.nativeElement.setAttribute('src', '');
    this.localVideo.nativeElement.setAttribute('poster', this.poster);
    this.remoteVideo.nativeElement.setAttribute('src', '');
    this.remoteVideo.nativeElement.setAttribute('poster', this.poster);
  }



// send messages and see what happens
  private sendStompMessage(destination: string, message: object): void {
    const body = JSON.stringify(message);
    console.log('Send message to ' + destination + ': ' + body);
    this.rxStompService.publish({destination: '/' + destination, body});
  }




  // Disable Buttons
  public disableCall(): boolean {
    return this.callWith === '' || this.callWith == null || this.inCall || this.inPlay;
  }

  public disableStop(): boolean {
    return !this.inCall;
  }

  public disablePlay(): boolean {
    return this.callWith === '' || this.callWith == null || this.inCall || this.inPlay || !this.hasRecord;
  }

  public disableStopPlay(): boolean {
    return !this.inPlay;
  }
// controll wach video wla ghi audio
  private isWithAudio(): boolean {
    return this.mode === 'audio' || this.mode === 'default';
  }

  private isWithVideo(): boolean {
    return this.mode === 'video' || this.mode === 'default';
  }

}
