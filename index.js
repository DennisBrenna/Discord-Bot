const discord = require("discord.js");
require('dotenv').config();

const apiKey = process.env.OpenAiBotToken;

const client = new discord.Client({
  intents: ["Guilds", "GuildMessages", "GuildVoiceStates", "MessageContent"],
});
const { DisTube } = require("distube");
client.DisTube = new DisTube(client, {
  leaveOnStop: false,
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  emitAddListWhenCreatingQueue: false,
});


//Open Ai setup

const {Configuration, OpenAIApi} = require('openai');

const configuration = new Configuration({
  organization:process.env.ChatGptApiOrg,
  apiKey:process.env.ChatGptApiKey
});

const openai = new OpenAIApi(configuration);

//da client er clar starte får vi en liten log mld
client.on("ready", (client) => {
  console.log(`Bot is now ONLINE ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  //prefixen aka deette du skriver for å vise botten at det er den du skal bruke
  const prefix = "//";
  
  //stopper botten fra å svare på seg selv
  if(message.author.bot) return;

  //hvis du skriver //chat så vil botten svare deg
  if(message.content.toLowerCase().startsWith("/chat")){
    //henter ut teksten du skriver etter //chat
    const text = message.content.slice(6);

    //henter ut svaret fra open ai
  const response = await openai.createCompletion({
    model: "gpt-3.5-turbo",
    prompt: `Hey Give me a response to this : ${message.content}`,
    temperature: 0.5,
    max_tokens: 60,
    top_p: 1.0,
    frequency_penalty: 0.5,
    presence_penalty: 0.0,
  });
  //sender svaret tilbake til deg
  message.reply(`${response.data.choices[0].text}`)
}

if(message.content.toLowerCase().startsWith("/image")){
  const response = await openai.createImage({
  prompt: `${message.content}`,
  n: 1,
  size: "1024x1024",
});
image_url = response.data.data[0].url;
}

  if (message.author.bot || !message.guild) return;
  if (!message.content.toLowerCase().startsWith(prefix)) return;


  //en args const så jeg slipper å gjøre det mer en en gang
  const args = message.content.slice(prefix.length).trim().split(/ +/g);

  //en command const så jeg slipper å skrive det samme hele tiden
  const command = args.shift().toLowerCase();

  //command til å starte sang. ald du trenger er på skrive parameter + play + navn på sang i form av string
  if (command === "play") {
    const voiceChannel = message.member?.voice?.channel;
    if (voiceChannel) {
      client.DisTube.play(message.member.voice.channel, args.join(" "), {
        member: message.member,
        textChannel: message.channel,
        message,
      });
    } else {
      //en feil håndtering som sier ifra da du ikke er i en vc.. om du ikke er i en vc veit ikke botten hvilken den skal joine
      message.channel.send(
        "you need to be in a voice channel to use this command"
      );
    }
  }

  //dette stopper musikken
  if (command === "stop") {
    client.DisTube.stop(message);
    message.channel.send("The music has been stopped");
  }

  //dette gjør at botten disconnecter fra discord VoiceChatten
  if (command === "leave") {
    client.DisTube.voices.get(message)?.leave();
    message.channel.send("Screw u guys im going home");
  }

  ////for å starte sangen etter du har satt den på pause
  if (command === "resume") client.DisTube.resume(message);

  //for å pause sang
  if (command === "pause") client.DisTube.pause(message);

  //for å skippe sang
  if (command === "skip") client.DisTube.skip(message);
});

//dette er for å spille sang
client.DisTube.on("playSong", (queue, song) => {
  queue.textChannel.send(
    "grattis du lytter nå til " + song.name
  );
});

client.login(
  apiKey
);
