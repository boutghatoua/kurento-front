import {InjectableRxStompConfig} from '@stomp/ng2-stompjs';
import {CONST_URLS} from './CONST_URLS';

export const rxStompConfig: InjectableRxStompConfig = {
  brokerURL: CONST_URLS.WEBSOCKET_URL,
  heartbeatIncoming: 20000,
  heartbeatOutgoing: 20000,
  reconnectDelay: 200, // essayer de reconnecter apres éààm
  debug: (msg) => {
    console.log(msg);
  }
};
