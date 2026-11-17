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
