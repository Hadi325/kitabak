import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');
const url = process.argv[2] || 'https://staging.kitabak.me/api/integrations/slack/events';

function readEnv(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing .env file at ${filePath}`);
    }

    return fs.readFileSync(filePath, 'utf8')
        .split(/\r?\n/)
        .reduce((values, line) => {
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('#')) {
                return values;
            }

            const equalsIndex = trimmed.indexOf('=');

            if (equalsIndex === -1) {
                return values;
            }

            const key = trimmed.slice(0, equalsIndex).trim();
            let value = trimmed.slice(equalsIndex + 1).trim();

            if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
            ) {
                value = value.slice(1, -1);
            }

            values[key] = value;

            return values;
        }, {});
}

function required(values, key) {
    if (!values[key]) {
        throw new Error(`Missing ${key} in ${envPath}`);
    }

    return values[key];
}

async function main() {
    const env = readEnv(envPath);
    const signingSecret = required(env, 'SLACK_SIGNING_SECRET');
    const teamId = required(env, 'SLACK_ALLOWED_TEAM_ID');
    const channel = required(env, 'SLACK_ALLOWED_CHANNELS').split(',')[0].trim();
    const reaction = process.argv[3] || env.SLACK_ISSUE_REACTION || 'bug';
    const reactor = env.SLACK_TEST_REACTOR_USER || 'U_TEST_REACTOR';
    const reporter = env.SLACK_TEST_REPORTER_USER || 'U_TEST_REPORTER';
    const now = Math.floor(Date.now() / 1000);
    const eventId = `Ev${Date.now()}`;

    const payload = {
        type: 'event_callback',
        team_id: teamId,
        event_id: eventId,
        event: {
            type: 'reaction_added',
            user: reactor,
            item_user: reporter,
            reaction,
            item: {
                type: 'message',
                channel,
                ts: `${now}.000100`,
            },
            event_ts: `${now}.000200`,
        },
    };

    const body = JSON.stringify(payload);
    const base = `v0:${now}:${body}`;
    const signature = `v0=${crypto
        .createHmac('sha256', signingSecret)
        .update(base, 'utf8')
        .digest('hex')}`;

    const secretHash = crypto
        .createHash('sha256')
        .update(signingSecret, 'utf8')
        .digest('hex')
        .slice(0, 12);

    console.log(`POST ${url}`);
    console.log(`Env file: ${envPath}`);
    console.log(`Signing secret: configured, length=${signingSecret.length}, hash=${secretHash}`);
    console.log(`Team: ${teamId}`);
    console.log(`Channel: ${channel}`);
    console.log(`Reaction: ${reaction}`);
    console.log(`Reporter: ${reporter}`);
    console.log(`Reactor: ${reactor}`);
    console.log(`Event ID: ${eventId}`);
    console.log(`Body: ${body}`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Slack-Request-Timestamp': String(now),
            'X-Slack-Signature': signature,
        },
        body,
    });

    const responseBody = await response.text();

    console.log(`HTTP ${response.status} ${response.statusText}`);
    console.log(responseBody);

    if (!response.ok) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
