import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { webSocket } from 'rxjs/webSocket';
import { WebRtcPeer } from 'kurento-utils';
import { User } from './user';
import { ɵHAMMER_PROVIDERS__POST_R3__ } from '@angular/platform-browser';




@Component({
  selector: 'app-call',
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.css'],
})
export class CallComponent implements OnInit, OnDestroy {

  constructor() {
    this.inCall = false;
    this.inPlay = false;
    this.hasRecord = false;
    this.mode = 'default';
    this.modes = ['default', 'audio', 'video'];
    this.poster = '/assets/images/webrtc.png';
  }
  @ViewChild('local-video')
  localVideo: ElementRef<HTMLVideoElement>;

  @ViewChild('remote-video')
  remoteVideo: ElementRef<HTMLVideoElement>;

  public callWith: string;
  public currentUser = new User('default');
  public poster: string;


  private webRtcPeer: WebRtcPeer;
  private inCall: boolean;
  private inPlay: boolean;
  private hasRecord: boolean;
  public subject = webSocket('ws://localhost:3000');// the servers adress
  public modes: string[];
  public mode: string;
  
  
  

 ngOnDestroy(): void {
    
}

ngOnInit(): void {
  this.subject.subscribe(
    msg=>this.onmessage(msg),
    err=>console.error(err),
    ()=>console.log('completed')
   );
}
  
  


 public onPlayResponse(payload): void {
    // gerer la reponse du play
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

 public  onCallResponse(payload): void {
    // gerer la reponse de l'appel
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

public onStartCommunication(payload): void {
    // fach ghaybda ydouz appel
    this.inCall = true;
    this.webRtcPeer.processAnswer(payload.sdpAnswer, (error) => {
      if (error) {
        console.error(error);
      }
    });
  }

  public onStopCommunication(): void {
    // fach ghay7bbs appel
    this.finalizeWebRtcPeer();
  }

register(): void {
    // enregistrer l'utilisateur
    this.sendMessage({action: 'register', user : this.currentUser});
    console.log(this.currentUser);
  }
getName(name:string): void {
    // retourner le nom de l'utilisqteur
    this.currentUser.name = name;
  }

  public call(): void {
    // appeler call
    this.inCall = true;
    const options = {
      mediaConstraints: {
        audio: this.isWithAudio(),
        video: this.isWithVideo(),
      },
      localVideo: this.localVideo,
      remoteVideo: this.remoteVideo,
      onicecandidate: (iceCandidate: any) => {
        this.sendMessage({action: 'iceCandidate',  candidate: iceCandidate });
      },
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
        this.sendMessage({action: 'call', 
          from: this.currentUser.name,
          to: this.callWith,
          sdpOffer: sdp,
          mode: this.mode,
        });
      });
    });
  }

  private onIncomingCall(payload): void {
    // recevoir un appel
    if (confirm('the user ' + payload.from + ' is calling you accept?')) {
      this.callWith = payload.from;
      this.inCall = true;

      const options = {
        mediaConstraints: {
          audio: this.isWithAudio(),
          video: this.isWithVideo(),
        },
        localVideo: this.localVideo,
        remoteVideo: this.remoteVideo,
        onicecandidate: (iceCandidate: any) => {
          this.sendMessage({action: 'iceCandidate', candidate: iceCandidate });
        },
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
          this.sendMessage({action: 'incomingCallResponse',
            from: payload.from,
            callResponse: 'accept',
            sdpOffer: sdp,
            mode: this.mode,
          });
        });
      });
    } else {
      this.inCall = false;
      this.sendMessage({action: 'incomingCallResponse', 
        from: payload.from,
        callResponse: 'reject',
        reason: 'user declined',
      });
      stop();
    }
  }


  public play(): void { ///play video
    this.inPlay = true;
    const options = {
      mediaConstraints: {
        audio: this.isWithAudio(),
        video: this.isWithVideo()
      },
      remoteVideo: this.remoteVideo,
      onicecandidate: (iceCandidate: any) => {
        this.sendMessage({action: 'iceCandidate', candidate: iceCandidate});
      }
    };
    this.webRtcPeer = WebRtcPeer.WebRtcPeerRecvonly(options, (error) => {
      if (error) {
        console.error(error);
      }
      this.webRtcPeer.generateOffer((error: string, sdp: string) => {
        this.sendMessage({action: 'play',
          user: this.callWith,
          sdpOffer: sdp
        });
      });
    });
  }
  // stop
  public stop(): void {
    this.sendMessage({action: 'stop', });
    this.finalizeWebRtcPeer();
  }

  public stopPlay(): void {
    // arrete le play
    this.sendMessage({action:'stop-play' });
    this.finalizeWebRtcPeer();
  } 

  // send messages and see what happens
  private sendMessage(message): void {
    console.log('message sent');
    this.subject.next(message);
  }
 
  private onIceCandidate(payload): void {
    this.webRtcPeer.addIceCandidate(payload.candidate, (error) => {
      if (error) {
        return console.error('Error adding candidate: ' + error);
      }
    });
  }

  private onRegisterResponse(payload): void {
    if (payload.response === 'accepted') {
    } else {
      console.log(payload.response);
    }
  }

  // Disable Buttons
  public disableCall(): boolean {
    return (
      this.callWith === '' ||
      this.callWith == null ||
      this.inCall ||
      this.inPlay
    );
  }

  public disableStop(): boolean {
    return !this.inCall;
  }

  public disablePlay(): boolean {
    return (
      this.callWith === '' ||
      this.callWith == null ||
      this.inCall ||
      this.inPlay ||
      !this.hasRecord
    );
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


  // safi salina cummunication ghadi nfixiw dakchi nredouh kima kan
  private finalizeWebRtcPeer(): void {
    this.inCall   = false;
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



public onmessage = (Message) => {
  const payload = JSON.parse(Message);
  switch (payload.action) {
    case 'registerResponse':
      this.onRegisterResponse(payload);
      break;
    case 'callResponse':
      this.onCallResponse(payload);
      break;
    case 'incomingCall':
      this.onIncomingCall(payload);
      break;
    case 'startComunication':
      this.onStartCommunication(payload);
      break;
    case 'stopCommunication':
      this.onStopCommunication();
      break;
    case 'playResponse':
      this.onPlayResponse(payload);
      break;
    case 'playEnd':
      this.finalizeWebRtcPeer();
      break;
    case 'iceCandidate':
      this.onIceCandidate(payload);
      break;
  }
}



}





