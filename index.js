import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import chalk from 'chalk';

async function connectBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")
  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) {
      qrcode.generate(qr, { small: true }, (qrcode) => {
        console.log(chalk.yellow("📲 QR:\n"), qrcode)
      })
    }
    if (connection === "close") {
      if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        connectBot()
      }
    } else if (connection === "open") {
      console.log(chalk.green("✅ Correcto"))
    }
  })

  // Escuchar mensajes
  sock.ev.on("messages.upsert", async ({ messages }) => {
  const m = messages[0]
  const tipo = m.key.remoteJid.includes('@g.us') ? 'Grupo' : 'Privado'
  if (tipo === 'Grupo') return // Ignorar mensajes de grupos

  const fecha = new Date().toLocaleString('es-ES', { hour12: false })
  if (!m.message) return
  const body = (m.message.conversation || m.message.extendedTextMessage?.text || "").replace(/@\d+/g, '')
  const usuario = m.pushName || m.key.participant
  const jid = m.key.remoteJid

  console.log(chalk.cyan(`┌──${tipo}──`))
  console.log(chalk.cyan(`│ Fecha: ${fecha}`))
  console.log(chalk.cyan(`│ Usuario: ${usuario}`))
  console.log(chalk.cyan(`│ Mensaje: ${body}`))
  console.log(chalk.cyan(`└─────────────`))
})
}

connectBot();