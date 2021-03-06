/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var { View } = ReactNative;
var { TestModule } = ReactNative.NativeModules;

const DEFAULT_WS_URL = 'ws://localhost:5555/';

const WS_EVENTS = [
  'close',
  'error',
  'message',
  'open',
];
const WS_STATES = [
  /* 0 */ 'CONNECTING',
  /* 1 */ 'OPEN',
  /* 2 */ 'CLOSING',
  /* 3 */ 'CLOSED',
];

type State = {
  url: string;
  fetchStatus: ?string;
  socket: ?WebSocket;
  socketState: ?number;
  lastSocketEvent: ?string;
  lastMessage: ?string | ?ArrayBuffer;
  testMessage: string;
  testExpectedResponse: string;
};

class WebSocketTest extends React.Component {
  state: State = {
    url: DEFAULT_WS_URL,
    fetchStatus: null,
    socket: null,
    socketState: null,
    lastSocketEvent: null,
    lastMessage: null,
    testMessage: 'testMessage',
    testExpectedResponse: 'testMessage_response'
  };

  _waitFor = (condition: any, timeout: any, callback: any) => {
    var remaining = timeout;
    var t;
    var timeoutFunction =  function() {
      if (condition()) {
        callback(true);
        return;
      }
      remaining--;
      if (remaining === 0) {
        callback(false);
      } else {
        t = setTimeout(timeoutFunction,1000);
      }
    };
    t = setTimeout(timeoutFunction,1000);
  }

  _connect = () => {
    const socket = new WebSocket(this.state.url);
    WS_EVENTS.forEach(ev => socket.addEventListener(ev, this._onSocketEvent));
    this.setState({
      socket,
      socketState: socket.readyState,
    });
  };

  _socketIsConnected = () => {
    return this.state.socketState === 1; //'OPEN'
  }

  _socketIsDisconnected = () => {
    return this.state.socketState === 3; //'CLOSED'
  }

  _disconnect = () => {
    if (!this.state.socket) {
      return;
    }
    this.state.socket.close();
  };

  _onSocketEvent = (event: any) => {
    const state: any = {
      socketState: event.target.readyState,
      lastSocketEvent: event.type,
    };
    if (event.type === 'message') {
      state.lastMessage = event.data;
    }
    this.setState(state);
  };

  _sendText = (text: string) => {
    if (!this.state.socket) {
      return;
    }
    this.state.socket.send(text);
  };

  _sendTestMessage = () => {
    this._sendText(this.state.testMessage);
  };

  _receivedTestExpectedResponse = () => {
    return (this.state.lastMessage === this.state.testExpectedResponse);
  };

  componentDidMount() {
    this.testConnect();
  }

  testConnect = () => {
    var component = this;
    component._connect();
    component._waitFor(component._socketIsConnected, 5, function(connectSucceeded) {
      if (!connectSucceeded) {
        TestModule.markTestPassed(false);
        return;
      }
      component.testSendAndReceive();
    });
  }

  testSendAndReceive = () => {
    var component = this;
    component._sendTestMessage();
    component._waitFor(component._receivedTestExpectedResponse, 5, function(messageReceived) {
      if (!messageReceived) {
        TestModule.markTestPassed(false);
        return;
      }
      component.testDisconnect();
    });
  }

  testDisconnect = () => {
    var component = this;
    component._disconnect();
    component._waitFor(component._socketIsDisconnected, 5, function(disconnectSucceeded) {
      TestModule.markTestPassed(disconnectSucceeded);
    });
  }

  render(): React.Element<any> {
    return <View />;
  }
}

WebSocketTest.displayName = 'WebSocketTest';

module.exports = WebSocketTest;
