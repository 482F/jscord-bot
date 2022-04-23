import path from 'node:path'
import { promises as fs } from 'node:fs'
import JSON5 from 'json5'
import { Client, Intents } from 'discord.js'
import jsus from '@482-utils/js'

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
})

const info = JSON5.parse(
  await fs.readFile(new URL('./info.json5', import.meta.url))
)

const readyPromise = new Promise((resolve) => client.once('ready', resolve))
client.login(info.token)
await readyPromise

console.log('ready')

const textChannels = [...client.channels.cache.values()].filter(
  (channel) => channel.type === 'GUILD_TEXT'
)
console.dir({ textChannels })

const data = [{ name: 'ping', description: 'replies with pong' }]
await client.application.commands.set(data, '591486967191961631')

client.on('interactionCreate', async (interaction) => {
  console.dir({ interaction })
  if (!interaction.isCommand()) {
    return
  }
  if (interaction.commandName === 'ping') {
    await interaction.reply('pong')
  }
})
