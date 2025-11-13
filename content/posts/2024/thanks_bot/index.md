---
title: Gratitude bot
Summary: Creating a slack bot to give and receive gratitude in a funny way, with a simple yet beautiful system.
date: "2024-02-01"
draft: true
---

# Intro
Dankbar, that's the word of the week to learn in german. It translates to "grateful" in english. So why not create a simple bot in our daily communication tools (slack) to give and receive gratitude? And have a leaderboard to see who was the most thanked person in our channels.

There are some already pre-defined workflows in slack, but they lack fun. Most of them are filling a form, then send the responses to the destinated user, nice and simple. But where's the fun?

In one of my previous companies, they designed a funny bot that you could use to thank people, and it was backed by a database that stored the most thanked users. So I decided to implement that same app myself with the next generation slack apps, that have [datastores](https://api.slack.com/automation/datastores) which is an AWS dynamoDB database basically.


## Acceptance criteria 
- Each user has a budget of 20 thxcoins per week. (refilled by a cron task)
- The app has a workflow to have a quick summary about how coins remaining and how many thx points you have.
- You cannot give thxpoints to youself.
- You can thank multiple users with a single message
- The way to thank users is by issuing a `++` being 1 thxcoin (or point).

So if I issue the message:
> @Romans ++++ and @Bill ++++++ deserve thanks!

Romans will get 3 thxcoins and Bill 5 as long as I have enough budget to give to them.

## Architecture

Slack next-gen app will have 4 main pillars:
- Datastores: Used to store data
- Triggers: Used to initiate workflow processes
- Workflows: Used for the heavy lifting, a workflow can have multiple steps (or functions) each of it having it's logic and purpose
- Functions: Units of work that handle the smaller chunks to complete a task. They can contain the slack API client to interact with the slack datastore for example

A visual representation of our architecture would be something like this:
!["Diagram_gratitude"](gratitude.drawio.svg)

And our datastore will contain the following records:

```ts
const ThxDataStore = DefineDatastore({
  name: "thxcoins",
  primary_key: "id",
  attributes: {
    id: { type: Schema.types.string }, // slack unique user ID
    human_name: { type: Schema.types.string },
    total_coins: { type: Schema.types.integer },
    budget: { type: Schema.types.integer },
  },
});
```
Stored data should look like this:
| id         | human_name  | total_coins | budget |
|------------|-------------|-------------|--------|
| U123456789 | John.foobar | 10          | 20     |

Where  
`id` = Slack user id  
`human_name` = human readable name  
`total_coins` = total aggregations of the coins you've received  
`budget` = your budget for giving coins  


## Hands on!

