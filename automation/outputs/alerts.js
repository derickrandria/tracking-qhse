// ═══════════════════════════════════════════════════════════════════════
// SYSTÈME D'ALERTES AUTOMATIQUES
// Email + Webhook (Teams, Slack, WhatsApp Business)
// ═══════════════════════════════════════════════════════════════════════

const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Envoie une alerte par email en cas d'infraction
 */
async function sendEmailAlert(infractions) {
  if (!config.alerts.email.enabled) {
    console.log('📧 Alertes email désactivées (config.alerts.email.enabled = false)');
    return;
  }

  const { smtp, recipients } = config.alerts.email;

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.password },
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const infractionsList = infractions.map(inf =>
    `  • ${inf.plate} (${inf.driver}) – ${inf.type}\n    ${inf.detail}`
  ).join('\n');

  const subject = `🚨 ALERTE QHSE – ${infractions.length} infraction(s) détectée(s) – ${dateStr}`;
  const body = `
═══════════════════════════════════════════════════
  ALERTE AUTOMATIQUE – TRANSPORT PÉTROLIER
═══════════════════════════════════════════════════

Date : ${dateStr} à ${timeStr}
Nombre d'infractions : ${infractions.length}

INFRACTIONS DÉTECTÉES :
${infractionsList}

───────────────────────────────────────────────────
Seuils en vigueur :
  • Conduite continue : 4h30 max
  • TCJ : 10h00 max (sans dérogation)
  • TTJ : 12h00 max (sans dérogation)

───────────────────────────────────────────────────
Action requise : Vérifier les véhicules concernés
et prendre les mesures appropriées.

Ceci est un message automatique du système de
suivi QHSE – Transport Pétrolier Madagascar.

Jean Frédéric Herinjanahary
Responsable Tracking & Opération QHSE
═══════════════════════════════════════════════════
  `;

  for (const recipient of recipients) {
    try {
      await transporter.sendMail({
        from: `"QHSE Automation" <${smtp.user}>`,
        to: recipient,
        subject,
        text: body,
      });
      console.log(`📧 Alerte envoyée à: ${recipient}`);
    } catch (err) {
      console.error(`❌ Erreur envoi email à ${recipient}: ${err.message}`);
    }
  }
}

/**
 * Envoie une alerte via webhook (Teams, Slack, etc.)
 */
async function sendWebhookAlert(infractions) {
  if (!config.alerts.webhook.enabled) {
    return;
  }

  const payload = {
    text: `🚨 *ALERTE QHSE* – ${infractions.length} infraction(s) détectée(s)`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `🚨 ${infractions.length} infraction(s) – ${new Date().toLocaleDateString('fr-FR')}` },
      },
      ...infractions.map(inf => ({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${inf.plate}* (${inf.driver})\n${inf.type} – ${inf.detail}`,
        },
      })),
    ],
  };

  try {
    const response = await fetch(config.alerts.webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log(`🔔 Webhook envoyé (status: ${response.status})`);
  } catch (err) {
    console.error(`❌ Erreur webhook: ${err.message}`);
  }
}

/**
 * Déclenche toutes les alertes pour les infractions détectées
 */
async function triggerAlerts(infractions) {
  if (!infractions || infractions.length === 0) {
    console.log('✅ Aucune infraction détectée – pas d\'alerte à envoyer');
    return;
  }

  console.log(`\n🚨 ${infractions.length} INFRACTION(S) DÉTECTÉE(S) – Envoi des alertes...`);

  // Console log détaillé
  for (const inf of infractions) {
    console.log(`   ⚠️  ${inf.plate} (${inf.driver}) – ${inf.type}: ${inf.detail}`);
  }

  await Promise.all([
    sendEmailAlert(infractions),
    sendWebhookAlert(infractions),
  ]);

  console.log('✅ Alertes traitées');
}

module.exports = { triggerAlerts, sendEmailAlert, sendWebhookAlert };
