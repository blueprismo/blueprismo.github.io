---
title: Abstract sockets
Summary: Why abstract sockets exist only in the namespace of the local machine and are not associated with a physical file. 
date: "2023-11-30"
---

# Intro
In this post we are going to talk about abstract sockets,
a colleage from work (ty Bill🙏) pointed out this concept, and I didn't knew this concept of socket existed before.

Abstract sockets have been here for a while (since Linux kernel version 2.3.4), about July 1999.

## Brief explanation about sockets

### What are Unix sockets?
Let's begin with the wikipedia definition of a unix socket: 
> A Unix domain socket aka UDS or IPC socket (inter-process communication socket) is a data communications endpoint for exchanging data between processes executing on the same host operating system. It is also referred to by its address family AF_UNIX. 

It's important to mention that sockets are used for internal communication between the same host. We should find our running socket files in our system under `/run` according to the [Filesystem Hierarchy Standard](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/ch03s15.html). Some time ago the `/var/run` folder was used, but this is not encouraged now (You may see some systems symlinking /var/run -> /run). We can also find them in the `/tmp` directory.

Unlike network sockets that operate over a network, unix sockets exist entirely within the operating system's file system. This means their form of communication is usually a file, this file does not contain data: It **TRANSPORTS** data! You may've seen `/run/mysqld/mysqld.sock` as an example.

### Dissection of sockets

Sockets are created with the `AF_UNIX` socket family, which is a shortstand for Address Family Unix, we can have 3 different types of UNIX sockets:
1. SOCK_STREAM: for a stream-oriented socket (somehow like TCP)
2. SOCK_DGRAM: for a datagram-oriented socket that preserves message boundaries (somehow like UDP)
3. SOCK_SEQPACKET: for a sequenced-packet socket that is connection-oriented, preserves message boundaries, and delivers messages in the order that they were sent (somehow like a queue/channel)

As sockets do not communicate over IP addresses, they do over a file, that file needs to have an address.
a socket address is represented in the following structure:

```c
struct sockaddr_un {
   sa_family_t sun_family;               /* AF_UNIX */
   char        sun_path[108];            /* Pathname */
};
```

There are three types of addresses distinguished in the sockaddr_un

1. pathname: bound to a null-terminated filesystem pathname using bind()
2. unnamed: A stream socket that has not been bound to a pathname using bind() has no name, for instance two sockets created by [socketpair()](https://man7.org/linux/man-pages/man2/socketpair.2.html) syscall
3. abstract: the first byte of sun path (sun_path[0]) is a null byte (`'\0'`), the name has no connection with filesystem pathnames!


### So what are unix abstract sockets?

As his name suggests, abstract sockets are the ones that do not have any connection with the filesystem pathnames. This means we cannot unlink() them 

This comes also with an isolation feature as they are only visible to processes that know the abstract name. They are not listed in the file system, making them a form of hidden, private communication.

## Demo time
### Pathname socket

A demonstration is worthier than just words. Let's set up a pathname socket mentioned above.
Pathname sockets are widely used, a file in the filesystem will be created in order to stablish a intra-system communication.

We will have a server script like this one:

```python
import socket
import os

# set the path where the socket will be living
# Important to make sure the user running the script will own the /tmp/test folder,
# Otherwise you'll see a Permission Denied error.
socket_path = '/tmp/test/pathname_socket.sock'

# Make sure the socket file does not exist
try:
    os.unlink(socket_path)
except OSError:
    if os.path.exists(socket_path):
        raise

# Create a Unix domain socket
server_socket = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)

# Bind the socket to the specified path
server_socket.bind(socket_path)

# Listen for incoming connections
server_socket.listen(1)
print(f"Server listening on {socket_path}")

try:
    # Accept a connection
    client_socket, client_address = server_socket.accept()
    print("Accepted connection from client")

    # Receive data from the client
    data = client_socket.recv(1024)
    print(f"Received data from client: {data.decode()}")

finally:
    # Clean up the socket
    server_socket.close()
    os.unlink(socket_path)
```

This code will create a socket in the `/run/pathname_socket` file
Then, we bind that socket to the specified address, afterwards we listen for the incoming connections, and we will patiently wait for an answer, this server part communicates internal processes of our system.

Notice we used the [bind](https://man7.org/linux/man-pages/man2/bind.2.html), [unlink](https://man7.org/linux/man-pages/man2/unlink.2.html),[listen](https://man7.org/linux/man-pages/man2/listen.2.html),[close](https://man7.org/linux/man-pages/man2/close.2.html),[accept](https://man7.org/linux/man-pages/man2/accept.2.html) and [socket](https://man7.org/linux/man-pages/man2/socket.2.html) syscalls.


Let's create the client that will connect to this pathname socket:

```python
import socket

# Same path above
socket_path = '/tmp/test/pathname_socket.sock'

# Create a client socket
client_socket = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)

try:
    # Connect to the server
    client_socket.connect(socket_path)
    print(f"Connected to server at {socket_path}")

    # Send a message to the server
    message = "Hello, server! This is the client."
    client_socket.sendall(message.encode())

finally:
    # Clean up the socket
    client_socket.close()
```
Afterwards, we can run the server in the background

```sh
# Run the server as a background process
❯ python3 server.py &
[1] 777654   # Remember this number is the PID of the process we sent to the backgorund ;)
Server listening on /tmp/test/pathname_socket.

# Check the socket with the ss (socket statistics) tool.
❯ ss -l -x -A unix_stream | grep pathname_socket
LISTEN 0  1  /tmp/test/pathname_socket.sock 4698172

# Check the file descriptor 3 of our process... se anything familiar?
❯ ls -l /proc/777654/fd/3
lrwx------ 1 blueprismo blueprismo 64 Nov 30 20:32 /proc/777654/fd/3 -> 'socket:[4698172]'

# summon the client 🧙‍♂️
❯ python3 client.py
Connected to server at /tmp/test/pathname_socket.sock
Accepted connection from client
Received data from client: Hello, server! This is the client.
[1]   777654  done       python3 server.py
```

We can see the ss output that our socket has an identifier (4698172), this number is the inode number where the socket is associated.

The special aspect of file descriptor 3 is that it will usually be the first file descriptor returned from a system call that allocates a new file descriptor, given that 0, 1 and 2 are usually set up for stdin, stdout and stderr.

This means that if any library function you have called allocates a file descriptor for its own internal purposes in order to perform its functions, it will get fd 3.

The file descriptor 3 for our server process (with process ID 777654) is a symlink pointing to our socket!

This is a typical example of unix sockets working. But what happens if we create an abstract socket?


### Abstract sockets

Let's tune a bit our server code so it creates an abstract socket

```python
import socket

# Create an abstract socket
server_socket = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)

# Specify the abstract address as a byte array, notice we put the first byte 
# As a null byte \0
abstract_address = b'\0abstract_socket'

# Bind the socket and listen to incomming connections
server_socket.bind(abstract_address)
server_socket.listen()

print("Server is listening for connections on abstract socket:", abstract_address.decode())

# Accept connections and handle data
while True:
    client_socket, client_address = server_socket.accept()
    print("Accepted connection from client")

    # Receive and print data from the client
    data = client_socket.recv(1024)
    print("Received data:", data.decode())

    # Close the connection
    client_socket.close()
```

In our server code, look that we create a byte string beginning with a null byte.
Remember in the definition that if the sun_path begins with a null byte, we do not define anything in our filesystem. Therefore we create an additional layer of isolation, as we won't see this socket in the filesystem.

Let's create a client that will connect to the same abstract address:

```python
import socket

# Create an abstract socket
client_socket = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)

# Specify the abstract address
abstract_address = b'\0abstract_socket'

# Connect to the server
client_socket.connect(abstract_address)

# Send data to the server
message = "Hello, abstract socket!"
client_socket.sendall(message.encode())

# Close the connection
client_socket.close()
```

Let's run again the server in the background and connect the client to it:
```sh
# Run the server code in the background, it has the PID 779968
❯ python3 server_abstract.py&
[1] 779968
Server is listening for connections on abstract socket: abstract_socket

# Our socket this time is refered by '@' we cannot locate this in our filesystem
❯ ss -l -x -A unix_stream | grep abstract
LISTEN 0  128   @abstract_socket 4707743    * 0

# Our fd 3 is pointing to the inode where the socket is associated
❯ ls -l /proc/779968/fd/3
lrwx------ 1 blueprismo blueprismo 64 Nov 30 21:09 /proc/779968/fd/3 -> 'socket:[4707743]'

# Connect the client to the server
❯ python3 client_abstract.py
Accepted connection from client
Received data: Hello, abstract socket!
```

Notice that the abstract socket always begin with '@', this symbol helps distinguish that this is an abstract socket.

Abstract sockets automatically disappear when all open references to the socket are closed.
In this example we have an infinite loop in the server, therefore the abstract socket will still be LISTENING for connections. But if we remove the `while True:` block and we fix the indentation we will see that the abstract socket will be deleted. Feel free to try!

Thanks for staying until here, here's a cookie 🍪

