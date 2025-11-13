---
title: Bypass censorship
Summary: If you go on vacation in China, be ready for the big internet censorship they have. Services like NordVPN or ExpressVPN are banned. In this post there's a way to circunvent censorship.
date: "2025-05-27"
---

# Intro

Last week I was on vacation in China, and one of the saddest things any traveler experiences is the huge censorship China has in regards to internet.

![tiananmen](image.png)

Thought you were safe with good ol' NordVPN? or similar services? Damn you are wrong! NordVPN has been experienced to also be banned in China. In this post I will explain how to set up your own tunnel to freedom.

## Shadowsocks

There are a myriad of ways to set up a network tunnel (with openvpn, wireguard, etc.), in this occasion I will impersonate the frustration of any foregein tourist coming into the realization he cannot login into his gmail account and needs a fast relief, that is a secure connection from China to the outer world.

The perfect candidate to satisfy this task is [shadowsocks](https://github.com/shadowsocks/shadowsocks-rust), an open-source fast-tunnel proxy that allows you to bypass firewalls, because it has a single configuration file and it is lightweight, secure, and simple to set up.

## Hands on

The great firewall of China is controlled by the Chineese goverment, and there are lots of ways where the blade of censorship cuts: Dns spoofing, IP range blocking, URL filtering, connection reset, packet inspection, etc.

What we need is a server outside of china. I have a very cheap hetzner cloud server that costs around 4$ per month and a custom domain attached to it (a DNS `A record` resolving it's static IP address). My server is located in Helsinki.

We need one single configuration file looking like this:

```json
{
    "server": "0.0.0.0",
    "fast_open": true,
    "mode":"tcp_and_udp",
    "server_port":8389,
    "local_port":1080,
    "password": "SECURE_PASSWORD",
    "timeout": 86400,
    "method": "aes-256-gcm"
}
```

Here, I put server to `0.0.0.0` because I will be deploying shadowsocks using docker, and as it will be in an isolated network, there won't be a way out to the internet. `0.0.0.0` means "listen to all interfaces", and this will map the container interface to the port.

Then we can apply this docker compose file

```docker-compose.yml
services:
  shadowsocks:
    image: ghcr.io/shadowsocks/ssserver-rust:latest
    container_name: shadowsocks
    ports:
      - "8389:8389/tcp"
      - "8389:8389/udp" # Enable UDP if needed (for gaming/VoIP)
    volumes:
      - "/home/blueprismo/projects/shadowsocks/config.json:/etc/shadowsocks-rust/config.json"
    restart: unless-stopped
    sysctls:
      - net.ipv4.tcp_fastopen=3 # Required for TFO support
```

The [tcp_fastopen](https://en.wikipedia.org/wiki/TCP_Fast_Open) configuration is set in order to speed up the connection, in a nutshell it sets a cookie for reconnection purposes avoiding the round trip in the initial three-way-handshake,

After starting the container, we can now use our mobile [android](https://github.com/shadowsocks/shadowsocks-android/releases) client to connect into our server and route all traffic to Helsinki and therefore being free to access all public information!

That's all for today!
