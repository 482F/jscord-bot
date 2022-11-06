/**
 * @params dateStr <String> - HH:MM
 */
function calcWaitTime(dateStr) {
  const groups = dateStr.match(/(?<h>[*\d]{2}):(?<mi>[*\d]{2})/).groups
  const [h, mi] = [groups.h, groups.mi].map(Number)

  const current = new Date()
  const [currentH, currentMi, currentS] = [
    current.getHours(),
    current.getMinutes(),
    current.getSeconds(),
  ]

  const targetH = (() => {
    if (!Number.isNaN(h)) return h
    else if (mi <= currentMi) return currentH + 1
    else return currentH
  })()
  const targetMi = (() => {
    if (!Number.isNaN(mi)) return mi
    else if (h === currentH) return (currentMi + 1) % 60
    else return 0
  })()

  const diff = (targetH - currentH) * 60 + (targetMi - currentMi)
  return ((0 < diff ? diff : diff + 24 * 60) * 60 - currentS) * 1000
}

async function sendByName(channels, name, message, { deletable = false } = {}) {
  const max = 1800
  if (max < message?.length) {
    const messages = []
    for (let i = 0; i < message.length; i += max) {
      messages.push(message.slice(i, i + max))
    }
    for (const part of messages) {
      await sendByName(channels, name, part)
    }
  } else {
    await Promise.all(
      channels
        .filter((channel) => channel.name === name)
        .map((channel) =>
          channel
            .send(message)
            .then((message) => {
              if (deletable) return message.react('🍊')
            })
            .catch((e) => console.log(e))
        )
    )
  }
}

const notifications = await Promise.all(
  [
    {
      module: 'epic-free',
      channel: 'epic-free',
      date: ['06:00', '12:00', '18:00'],
    },
    {
      module: 'gtav-events',
      channel: 'gtav',
      date: ['06:00'],
    },
    {
      module: 'niconico-ikkyo',
      channel: 'niconico-animation',
      date: ['06:00'],
    },
    {
      module: 'pso2-emg',
      channel: 'pso2',
      date: ['**:06'],
    },
  ].map(async (notification) => ({
    ...notification,
    func: await import(`node-scraping/${notification.module}.js`).then(
      (m) => m.default
    ),
  }))
)

async function startNotification(notification, channels) {
  while (true) {
    const waitTime = Math.min(...notification.date.map(calcWaitTime))
    await new Promise((resolve) => setTimeout(resolve, waitTime))
    const message = await notification
      .func()
      .then(({ text }) => text)
      .catch((e) => console.log(e))

    ;(() => {
      const date = new Date()
      const df = (n) => n.toString().padStart(2, '0')
      console.log(notification.module, {
        date: `${date.getFullYear()}/${df(date.getMonth() + 1)}/${df(
          date.getDate()
        )} ${df(date.getHours())}:${df(date.getMinutes())}:${df(
          date.getSeconds()
        )}`,
        message,
        waitTime,
        waitTimes: notification.date.map(calcWaitTime),
      })
    })()

    if (message?.match(/\S/)) {
      for (const section of message.split('\n\n')) {
        await sendByName(channels, notification.channel, section, {
          deletable: notification.deletable,
        })
      }
    }
  }
}

export default async function startNotifications(channels) {
  await Promise.all(
    notifications.map((notification) =>
      startNotification(notification, channels)
    )
  )
}
