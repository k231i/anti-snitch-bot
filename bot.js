const { Client, Intents } = require('discord.js');
const { config } = require('./config.json');
const Scheduler = require('./scheduler');

const observedChannels = config.observedChannels;
const scheduler = new Scheduler();

const discordIntents = new Intents([Intents.FLAGS.GUILDS,			//idk djs docs say it's required
									Intents.FLAGS.GUILD_MESSAGES]);	//catch message creation
const discord = new Client({ intents: discordIntents });

discord.once('ready', () => {
	console.log('Connected to discord');
	scheduler.readJobsFromFile();
});
discord.login(config.token);

discord.on('messageCreate', message => {
	let channelId = message.channelId;
	if (observedChannels.includes(channelId))
		scheduler.addMessage(channelId, message.id);
});

scheduler.on('timeToDelete', (channelId, messageId) => {
	discord.channels.fetch(channelId).then(channel => {
		channel.messages.fetch(messageId).then(message => {
			message.delete().catch(console.error);
		}).catch(console.error);
	});
});