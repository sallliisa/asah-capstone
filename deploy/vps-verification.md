# VPS model service verification

17 November 2026. SSH alias kknkalongan_muslik. The user selected app/models.

The service is installed at /home/muslik/app/models with a pinned Python 3.11
environment, scikit-learn 1.7.2, and the reviewed tenant and intent artifacts.
Trusted SHA-256 checks pass during service startup. The bearer token matches
the app configuration. No database or Cloudflare credentials were deployed.

User systemd is available and login linger is enabled. kos-models.service is
enabled and active, bound only to 127.0.0.1:5195. The service uses one process,
one numerical thread, a 2 GB memory cap, and a 150% CPU cap. These caps are not
measured usage. Service snapshots recorded about 142 MB peak before restart.

The real loopback HTTP check rejected anonymous health access with 401, loaded
both model versions, classified the financial question correctly, and scored
25 eligible synthetic tenant histories. Ten intent requests measured a median
4.11 ms and maximum 4.95 ms. Five batch requests measured a median 164.58 ms
and maximum 174.75 ms. These are small functional timing samples, not a load
test or internet latency result. A manual service restart recovered readiness.
Evidence is retained under .local/verification/vps-models-*.

HTTPS publication, deployed app-to-service requests, and the minute job timer
remain to be checked. The experimental model quality limits are unchanged.

## HTTPS publication

The owner supplied administrator SSH alias kknkalongan. Its ubuntu account
can use sudo. The prepared script validated a candidate tunnel configuration,
preserved cfos.southneuhof.tech, published models.southneuhof.tech, and restarted
cloudflared. The existing origin certificate is at
/home/ubuntu/.cloudflared/cert.pem; no certificate contents were copied or printed.

The applied command was sudo env
TUNNEL_ORIGIN_CERT=/home/ubuntu/.cloudflared/cert.pem python3
/home/muslik/app/models/configure-tunnel.py --apply. A private root-owned config
backup was saved. Anonymous HTTPS health returns 401. Authenticated health and
financial intent classification pass over HTTPS. The existing CloudflareOS
origin still returns 200. The local API environment now uses the HTTPS model
address. Evidence: models-tunnel-apply.log and models-https-proof.json under
.local/verification. The deployed API and timer still need acceptance.

## Live app and minute timer

Vercel deployment dpl_74ZUbT6xBuadMo6wrWrd3CFH4K3N was staged, checked, then
promoted to https://asah-capstone-nu.vercel.app. The build applied pending
migrations through Vercel's existing production database secret. A real MCP
client used the deployed endpoint, VPS classifier, active Vectorize corpus,
and app database. It returned the monthly-rent policy with a source version,
read calculated cash, and saved its routing audit. Anonymous tools returned
401; exactly two read-only tool names were exposed. Owner app sign-in and the
Wisp native-session handoff also passed.

The minute job is installed at app/models/scripts/run-jobs.ts with a private
jobs.env file. User systemd kos-jobs.service and kos-jobs.timer are installed,
verified, enabled, and active. A manual run and later timer runs completed with
recurrence, push, and model configuration enabled. No current occurrence was
due, so generated/created/sent/saved counts were zero. This does not prove an
iPhone received a push. Evidence is in vps-jobs-*.log.

## Current direct MCP deployment

The later tested deployment dpl_HxZYREtQ1sP6RKyi1cF9sV1ZEapy is now live.
The user selected public MCP access for internal testing, so the old anonymous
401 statement above describes the previous checkpoint only. The current two-tool
MCP endpoint has no caller authentication. Authenticated model HTTPS and private
job tokens retain their checks. Both user services remain active. Native chats
now prove classifier routing, source use, live cash, and Wisp reopening; see
cfos-verification.md.
